import os
from groq import Groq
from flask import Blueprint, request, jsonify

ai_assistant_bp = Blueprint('ai_assistant', __name__)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = "You are a professional Agricultural Assistant. Provide practical, organic, and easy-to-follow advice for Indian farmers. Keep answers concise and helpful."

@ai_assistant_bp.route('/ask-expert', methods=['POST'])
def ask_expert():
    print("AI Expert: Request Received")
    try:
        data  = request.json
        mode  = data.get('mode')
        label = data.get('label')

        prompt = f"Expert advice for {mode} detected as {label}. Provide treatment in English and a 2-line summary in Hindi."

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": prompt},
            ],
            max_tokens=500,
        )

        return jsonify({
            "success":  True,
            "analysis": response.choices[0].message.content
        })
    except Exception as e:
        print(f"AI Expert ERROR: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@ai_assistant_bp.route('/chat', methods=['POST'])
def chat_with_groq():
    print("--- AI Chat: Request Received ---")
    try:
        data         = request.json
        user_message = data.get('message')
        print(f"User Message: {user_message}")

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": user_message},
            ],
            max_tokens=500,
        )

        reply = response.choices[0].message.content
        print("AI Chat: Groq Responded Successfully")
        return jsonify({
            "success": True,
            "reply":   reply
        })
    except Exception as e:
        print(f"AI Chat ERROR: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500