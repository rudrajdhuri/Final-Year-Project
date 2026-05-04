from flask import Blueprint, request, jsonify
import bcrypt
import hashlib
import dns.resolver
from database import COLLECTIONS, get_collection, limit_collection
from services.autonomous_service import update_owner_user_id as update_autonomous_owner_user_id
from services.live_detection_service import update_owner_user_id as update_detection_owner_user_id
from services.session_lock_service import transfer_owner_session
from services.time_service import from_epoch_ms_ist, now_ist

auth_bp = Blueprint('auth', __name__)


def get_users_col():
    return get_collection("users")


# ──────────────────────────────────────────
# Helper: MX record check
# ──────────────────────────────────────────
def _email_domain_valid(email: str) -> bool:
    """Check if email domain has MX records (real mail server)."""
    try:
        domain = email.split("@")[1]
        dns.resolver.resolve(domain, "MX")
        return True
    except Exception:
        return False


# ──────────────────────────────────────────
# Helper: enforce per-user limit
# ──────────────────────────────────────────
# ──────────────────────────────────────────
# POST /api/auth/signup  (manual)
# ──────────────────────────────────────────
@auth_bp.route('/signup', methods=['POST'])
def signup():
    try:
        data     = request.get_json()
        name     = data.get('name', '').strip()
        email    = data.get('email', '').strip().lower()
        password = data.get('password', '')  # SHA-256 from frontend
        guest_history = data.get('guest_history', [])
        client_session_id = data.get('client_session_id')

        if not name or not email or not password:
            return jsonify({"success": False, "error": "All fields are required"}), 400

        # MX record check
        if not _email_domain_valid(email):
            return jsonify({"success": False, "error": "Email domain does not exist. Please use a real email."}), 400

        users_col = get_users_col()
        existing  = users_col.find_one({"email": email})

        if existing:
            if existing.get("auth_provider") == "google":
                return jsonify({"success": False, "error": "This email is registered with Google. Please use the Google Sign In button."}), 400
            return jsonify({"success": False, "error": "Email already registered. Please sign in."}), 400

        # bcrypt the SHA-256 hash
        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

        result = users_col.insert_one({
            "name":          name,
            "email":         email,
            "password":      hashed,
            "auth_provider": "manual",
            "created_at":    now_ist()
        })

        user_id = str(result.inserted_id)
        if guest_history:
            _migrate_guest_history(user_id, guest_history)
        _migrate_guest_runtime(user_id, client_session_id)

        return jsonify({
            "success": True,
            "user": {"id": user_id, "name": name, "email": email}
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ──────────────────────────────────────────
# POST /api/auth/signin  (manual)
# ──────────────────────────────────────────
@auth_bp.route('/signin', methods=['POST'])
def signin():
    try:
        data     = request.get_json()
        email    = data.get('email', '').strip().lower()
        password = data.get('password', '')  # SHA-256 from frontend
        guest_history = data.get('guest_history', [])
        client_session_id = data.get('client_session_id')

        if not email or not password:
            return jsonify({"success": False, "error": "All fields are required"}), 400

        users_col = get_users_col()
        user      = users_col.find_one({"email": email})

        if not user:
            return jsonify({"success": False, "error": "No account found with this email."}), 401

        # Block if Google account tries manual login
        if user.get("auth_provider") == "google":
            return jsonify({"success": False, "error": "This account uses Google Sign In. Please use the Google button."}), 401

        if not bcrypt.checkpw(password.encode(), user['password'].encode()):
            return jsonify({"success": False, "error": "Incorrect password."}), 401

        user_id = str(user['_id'])
        if guest_history:
            _migrate_guest_history(user_id, guest_history)
        _migrate_guest_runtime(user_id, client_session_id)

        return jsonify({
            "success": True,
            "user": {"id": user_id, "name": user['name'], "email": user['email']}
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ──────────────────────────────────────────
# POST /api/auth/google  (NextAuth callback)
# ──────────────────────────────────────────
@auth_bp.route('/google', methods=['POST'])
def google_auth():
    """
    Called by NextAuth after Google verifies the user.
    Receives: name, email, google_id, picture
    Returns: user record (create if first time, find if returning)
    """
    try:
        data      = request.get_json()
        name      = data.get('name', '').strip()
        email     = data.get('email', '').strip().lower()
        google_id = data.get('google_id', '')
        picture   = data.get('picture', '')
        guest_history = data.get('guest_history', [])
        client_session_id = data.get('client_session_id')

        if not email or not google_id:
            return jsonify({"success": False, "error": "Invalid Google data"}), 400

        users_col = get_users_col()
        existing  = users_col.find_one({"email": email})

        if existing:
            # Block if manual account tries Google with same email
            if existing.get("auth_provider") == "manual":
                return jsonify({
                    "success": False,
                    "error": "This email is registered with a password. Please sign in manually."
                }), 400

            # Returning Google user — just return their info
            user_id = str(existing['_id'])
            if guest_history:
                _migrate_guest_history(user_id, guest_history)
            _migrate_guest_runtime(user_id, client_session_id)

            return jsonify({
                "success": True,
                "user": {
                    "id":      user_id,
                    "name":    existing['name'],
                    "email":   existing['email'],
                    "picture": existing.get('picture', '')
                }
            })

        # First time Google login — create account
        result = users_col.insert_one({
            "name":          name,
            "email":         email,
            "password":      None,          # no password for Google users
            "auth_provider": "google",
            "google_id":     google_id,
            "picture":       picture,
            "created_at":    now_ist()
        })

        user_id = str(result.inserted_id)
        if guest_history:
            _migrate_guest_history(user_id, guest_history)
        _migrate_guest_runtime(user_id, client_session_id)

        return jsonify({
            "success": True,
            "user": {"id": user_id, "name": name, "email": email, "picture": picture}
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ──────────────────────────────────────────
# POST /api/auth/check-email
# ──────────────────────────────────────────
@auth_bp.route('/check-email', methods=['POST'])
def check_email():
    try:
        email = request.get_json().get('email', '').strip().lower()
        if not email:
            return jsonify({"valid": False, "error": "No email provided"})

        # MX check
        if not _email_domain_valid(email):
            return jsonify({"valid": False, "error": "Email domain does not exist"})

        user = get_users_col().find_one({"email": email})
        if user:
            provider = user.get("auth_provider", "manual")
            return jsonify({"valid": True, "exists": True, "provider": provider})

        return jsonify({"valid": True, "exists": False})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ──────────────────────────────────────────
# Helper: migrate guest history to user
# ──────────────────────────────────────────
def _migrate_guest_history(user_id: str, guest_records: list):
    animal_col = get_collection("animaldect_data")
    plant_col  = get_collection("plantdect_data")

    for rec in guest_records:
        mode = rec.get('mode')
        ts = from_epoch_ms_ist(rec.get("timestamp"))

        if mode == 'animal':
            animal_col.insert_one({
                "user_id":         user_id,
                "threat_detected": rec.get('threat_detected', False),
                "animal_type":     rec.get('animal_type', 'Unknown'),
                "confidence":      rec.get('confidence', 0.0),
                "message":         rec.get('message', ''),
                "image_b64":       rec.get('image_b64', ''),
                "timestamp":       ts
            })
            limit_collection("animaldect_data", 50)
        elif mode == 'plant':
            plant_col.insert_one({
                "user_id":    user_id,
                "result":     rec.get('result', rec.get('message', '')),
                "confidence": rec.get('confidence', 0.0),
                "image_b64":  rec.get('image_b64', ''),
                "timestamp":  ts
            })
            limit_collection("plantdect_data", 50)
        elif mode in {'moisture', 'temperature', 'humidity'}:
            sensor_col = get_collection("sensor_data")
            if sensor_col.find_one({"user_id": user_id, "timestamp": ts}):
                continue
            sensor_col.insert_one({
                "user_id": user_id,
                "moisture": rec.get('moisture'),
                "temperature": rec.get('temperature'),
                "humidity": rec.get('humidity'),
                "ph": rec.get('ph'),
                "obstacle": bool(rec.get('obstacle', False)),
                "source": "guest-migrated",
                "timestamp": ts
            })
            limit_collection("sensor_data", 50)


def _migrate_guest_runtime(user_id: str, client_session_id: str | None):
    if not client_session_id:
        return

    now = now_ist()
    profiles_col = get_collection(COLLECTIONS["PROFILES"])
    profiles_col.update_many(
        {"user_id": "guest", "owner_session_id": client_session_id},
        {"$set": {"user_id": user_id, "updated_at": now}},
    )

    transfer_owner_session(client_session_id, user_id)
    update_detection_owner_user_id(client_session_id, user_id)
    update_autonomous_owner_user_id(client_session_id, user_id)
