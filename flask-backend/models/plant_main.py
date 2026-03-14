import torch
import timm
import torch.nn.functional as F
from torchvision import transforms
from PIL import Image

# -------------------------------
# Device
# -------------------------------
device = torch.device("cpu")
print("Using device:", device)

# -------------------------------
# Disease Classes (38)
# -------------------------------
disease_classes = [
'Apple___Apple_scab',
'Apple___Black_rot',
'Apple___Cedar_apple_rust',
'Apple___healthy',
'Blueberry___healthy',
'Cherry_(including_sour)___Powdery_mildew',
'Cherry_(including_sour)___healthy',
'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot',
'Corn_(maize)___Common_rust_',
'Corn_(maize)___Northern_Leaf_Blight',
'Corn_(maize)___healthy',
'Grape___Black_rot',
'Grape___Esca_(Black_Measles)',
'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)',
'Grape___healthy',
'Orange___Haunglongbing_(Citrus_greening)',
'Peach___Bacterial_spot',
'Peach___healthy',
'Pepper,_bell___Bacterial_spot',
'Pepper,_bell___healthy',
'Potato___Early_blight',
'Potato___Late_blight',
'Potato___healthy',
'Raspberry___healthy',
'Soybean___healthy',
'Squash___Powdery_mildew',
'Strawberry___Leaf_scorch',
'Strawberry___healthy',
'Tomato___Bacterial_spot',
'Tomato___Early_blight',
'Tomato___Late_blight',
'Tomato___Leaf_Mold',
'Tomato___Septoria_leaf_spot',
'Tomato___Spider_mites Two-spotted_spider_mite',
'Tomato___Target_Spot',
'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
'Tomato___Tomato_mosaic_virus',
'Tomato___healthy'
]

# -------------------------------
# Load Models
# -------------------------------
stage1_model = timm.create_model("efficientnet_b0", pretrained=False, num_classes=2)
stage1_model.load_state_dict(torch.load("models/models_stored/plant_vs_nonplant.pth", map_location=device))
stage1_model.to(device).eval()

stage2_model = timm.create_model("efficientnet_b0", pretrained=False, num_classes=38)
stage2_model.load_state_dict(torch.load("models/models_stored/plant_disease_38.pth", map_location=device))
stage2_model.to(device).eval()

# -------------------------------
# Animal Guard Model (75 species)
# Used to reject animal images from plant pipeline
# -------------------------------
animal_guard_model = timm.create_model("efficientnet_b0", pretrained=False, num_classes=75)
animal_guard_model.load_state_dict(torch.load("models/models_stored/animal_species_75.pth", map_location=device))
animal_guard_model.to(device).eval()

# -------------------------------
# Transform
# -------------------------------
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor()
])

# -------------------------------
# Animal Guard Threshold
# If animal model is THIS confident → reject as animal
# -------------------------------
ANIMAL_GUARD_THRESHOLD = 0.80

# -------------------------------
# Prediction Function
# -------------------------------
def predict(image_path):

    image = Image.open(image_path).convert("RGB")
    tensor = transform(image).unsqueeze(0).to(device)

    # ===== Animal Guard Check =====
    # Run animal species model first
    # If it's very confident this is an animal → reject early
    with torch.no_grad():
        animal_out = animal_guard_model(tensor)
        animal_prob = F.softmax(animal_out, dim=1)
        animal_conf, _ = torch.max(animal_prob, 1)

    if animal_conf.item() >= ANIMAL_GUARD_THRESHOLD:
        return f"❌ No plant detected - Animal image given ({animal_conf.item()*100:.2f}%)", animal_conf.item()

    # ===== Stage 1: Plant vs Non-Plant =====
    with torch.no_grad():
        out1 = stage1_model(tensor)
        prob1 = F.softmax(out1, dim=1)
        conf1, pred1 = torch.max(prob1, 1)

    # If Non-Plant
    if pred1.item() == 0:
        return "❌ Not a plant detected", conf1.item()

    # ===== Stage 2: Disease Detection =====
    with torch.no_grad():
        out2 = stage2_model(tensor)
        prob2 = F.softmax(out2, dim=1)

        top2_prob, top2_idx = torch.topk(prob2, 2)
        confidence = top2_prob[0][0].item()
        second_conf = top2_prob[0][1].item()
        pred_index = top2_idx[0][0].item()

    predicted_class = disease_classes[pred_index]

    # ==============================
    # THREAT-FOCUSED DECISION LOGIC
    # ==============================

    # 1️⃣ Low confidence → unclear (far / blurry / new plant)
    if confidence < 0.78:
        return f"⚠ Unclear image - Move closer to leaf ({confidence*100:.2f}%)", confidence

    # 2️⃣ If prediction unstable (close top 2 probs) → unclear
    if (confidence - second_conf) < 0.12:
        return f"⚠ Unclear image - Focus on single leaf ({confidence*100:.2f}%)", confidence

    # 3️⃣ Confident → check threat
    if "healthy" in predicted_class:
        return f"✅  HEALTHY - No disease detected ({confidence*100:.2f}%)", confidence
    else:
        return f"⚠ UNHEALTHY - Disease detected ({confidence*100:.2f}%)", confidence


# -------------------------------
# Test Example
# -------------------------------
if __name__ == "__main__":
    image_path = "pictures/plants/dry2.jpg"  # change image here
    result, confidence = predict(image_path)
    print("Result:", result)
    print(f"Confidence: {confidence*100:.2f}%")