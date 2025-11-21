from flask import Blueprint, request, jsonify
import cv2
import numpy as np
from models.animal import detect_animal
import base64

animal_detection_bp = Blueprint('animal_detection', __name__)

@animal_detection_bp.route('/detect-animal', methods=['POST'])
def detect_animal_endpoint():
    try:
        # Check if request has file or base64 image
        if 'image' in request.files:
            # Handle file upload
            file = request.files['image']
            if file.filename == '':
                return jsonify({'error': 'No file selected'}), 400
            
            # Read image file
            file_bytes = np.frombuffer(file.read(), np.uint8)
            image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
            
        elif 'image_base64' in request.json:
            # Handle base64 encoded image
            base64_data = request.json['image_base64']
            # Remove header if present
            if ',' in base64_data:
                base64_data = base64_data.split(',')[1]
            
            img_bytes = base64.b64decode(base64_data)
            nparr = np.frombuffer(img_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        else:
            return jsonify({'error': 'No image provided'}), 400
        
        if image is None:
            return jsonify({'error': 'Invalid image format'}), 400
        
        # Run detection
        is_threat, class_name, confidence = detect_animal(image)
        
        return jsonify({
            'success': True,
            'threat_detected': is_threat,
            'animal_type': class_name,
            'confidence': round(confidence * 100, 2) if confidence else 0,
            'message': f"⚠️ {class_name} detected with {round(confidence * 100, 2)}% confidence!" if is_threat else "No threats detected"
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@animal_detection_bp.route('/detect-animal/test', methods=['GET'])
def test_endpoint():
    return jsonify({
        'status': 'Animal detection API is running',
        'endpoints': {
            'POST /api/animal/detect-animal': 'Upload image file or send base64 encoded image',
        }
    }), 200
