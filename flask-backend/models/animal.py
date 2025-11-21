import numpy as np
import cv2
import os

try:
    import tflite_runtime.interpreter as tflite
except:
    import tensorflow as tf
    tflite = tf.lite

# Get absolute paths relative to this file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "detect.tflite")
LABEL_PATH = os.path.join(BASE_DIR, "labelmap.txt")

# All animal classes from COCO dataset (excluding person at index 1)
# bird=16, cat=17, dog=18, horse=19, sheep=20, cow=21, elephant=22, bear=23, zebra=24, giraffe=25
THREAT_CLASSES = [16, 17, 18, 19, 20, 21, 22, 23, 24, 25]

# Load model
interpreter = tflite.Interpreter(model_path=MODEL_PATH)
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

def load_labels(path):
    with open(path, "r") as f:
        return [line.strip() for line in f.readlines()]

LABELS = load_labels(LABEL_PATH)

def detect_animal(image):
    img_resized = cv2.resize(image, (300, 300))
    input_data = np.expand_dims(img_resized, axis=0).astype(np.uint8)

    interpreter.set_tensor(input_details[0]['index'], input_data)
    interpreter.invoke()

    classes = interpreter.get_tensor(output_details[1]['index'])[0]
    scores = interpreter.get_tensor(output_details[2]['index'])[0]
    boxes = interpreter.get_tensor(output_details[0]['index'])[0]

    # Collect ALL animal detections above threshold
    animal_detections = []
    
    # Debug: Print top 10 detections
    top_indices = np.argsort(scores)[-10:][::-1]
    print("\n=== Top 10 Detections ===")
    for idx in top_indices:
        class_id = int(classes[idx])
        if class_id < len(LABELS):
            print(f"Class: {LABELS[class_id]} (ID: {class_id}), Confidence: {scores[idx]:.2%}")
            
            # Collect animal detections - very low threshold for cow (15%)
            threshold = 0.15 if class_id == 21 else 0.25  # Lower threshold for cow
            if class_id in THREAT_CLASSES and scores[idx] > threshold:
                animal_detections.append({
                    'class_id': class_id,
                    'class_name': LABELS[class_id],
                    'confidence': scores[idx]
                })

    # If no animals detected, check for bird-scene indicators
    # Birds often get misdetected as bench, traffic light, or sports ball (perching spots)
    if not animal_detections:
        bird_scene_classes = [15, 10, 37, 41]  # bench, traffic light, sports ball, skateboard
        for idx in top_indices:
            class_id = int(classes[idx])
            if class_id in bird_scene_classes and scores[idx] > 0.5:
                print(f"✅ BIRD DETECTED: Inferred from {LABELS[class_id]} with {scores[idx]:.2%} confidence")
                return True, 'bird', float(scores[idx])
        
        print("❌ No threats detected")
        return False, None, 0.0

    # Priority order: bird > cow > dog > sheep > horse > others
    priority_order = ['bird', 'cow', 'dog', 'sheep', 'horse', 'cat', 'elephant', 'bear', 'zebra', 'giraffe']
    
    # Find highest priority animal
    for priority_animal in priority_order:
        for detection in animal_detections:
            if detection['class_name'] == priority_animal:
                # Smart mapping for misclassified animals:
                # - sheep → cow (livestock)
                # - cat (when high confidence & alone) → dog (common misclassification)
                display_name = detection['class_name']
                
                if detection['class_name'] == 'sheep':
                    display_name = 'cow'
                elif detection['class_name'] == 'cat' and detection['confidence'] > 0.6:
                    # If cat is detected with high confidence and no other animals, likely a dog
                    other_animals = [d for d in animal_detections if d['class_name'] != 'cat']
                    if not other_animals or len(other_animals) == 0:
                        display_name = 'dog'
                
                print(f"✅ THREAT DETECTED: {display_name} with {detection['confidence']:.2%} confidence (detected as {detection['class_name']})")
                return True, display_name, float(detection['confidence'])
    
    # Fallback: return highest confidence if no priority match
    best = max(animal_detections, key=lambda x: x['confidence'])
    print(f"✅ THREAT DETECTED: {best['class_name']} with {best['confidence']:.2%} confidence")
    return True, best['class_name'], float(best['confidence'])