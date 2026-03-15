import torch
import timm
import torch.nn.functional as F
from torchvision import transforms
from PIL import Image
import os
import cv2
import numpy as np

# -----------------------------
# Device
# -----------------------------
device = torch.device("cpu")
print("Using device:", device)

# -----------------------------
# Human Face Filter (OpenCV)
# -----------------------------
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def has_human_face(image_path):
    """Returns True if a human face is detected in the image."""
    img  = cv2.imread(image_path)
    if img is None:
        return False
    gray  = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=8, minSize=(80, 80))
    return len(faces) > 0

# -----------------------------
# Animal Classes (75)
# -----------------------------
animal_classes = [
'antelope','badger','bat','bear','beetle','bison','boar','buffalo','cat','caterpillar',
'chimpanzee','cockroach','cow','coyote','crab','crow','deer','dog','donkey','duck',
'eagle','elephant','flamingo','fly','fox','goat','goose','gorilla','grasshopper',
'hamster','hare','hedgehog','hippopotamus','hornbill','horse','hyena','kangaroo',
'koala','ladybugs','leopard','lion','lizard','monkey','mosquito','moth','mouse',
'octopus','okapi','orangutan','otter','owl','ox','panda','parrot','pelecaniformes',
'pig','pigeon','porcupine','possum','raccoon','rat','reindeer','rhinoceros',
'sandpiper','sheep','snake','sparrow','squirrel','tiger','turkey','turtle',
'wolf','wombat','woodpecker','zebra'
]

# -----------------------------
# Load All Models
# -----------------------------

# Step 1 - Plant vs Non-Plant
plant_gate_model = timm.create_model("efficientnet_b0", pretrained=False, num_classes=2)
plant_gate_model.load_state_dict(torch.load("models/models_stored/plant_vs_nonplant.pth", map_location=device))
plant_gate_model.to(device).eval()

# Step 2 - Animal vs Non-Animal
stage1_model = timm.create_model("efficientnet_b0", pretrained=False, num_classes=2)
stage1_model.load_state_dict(torch.load("models/models_stored/animal_vs_nonanimal.pth", map_location=device))
stage1_model.to(device).eval()

# Step 3 - Animal Species
stage2_model = timm.create_model("efficientnet_b0", pretrained=False, num_classes=75)
stage2_model.load_state_dict(torch.load("models/models_stored/animal_species_75.pth", map_location=device))
stage2_model.to(device).eval()

# Step 4 - Plant Disease (only used when plant gate was HIGH confidence)
plant_disease_model = timm.create_model("efficientnet_b0", pretrained=False, num_classes=38)
plant_disease_model.load_state_dict(torch.load("models/models_stored/plant_disease_38.pth", map_location=device))
plant_disease_model.to(device).eval()

# -----------------------------
# Transform
# -----------------------------
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor()
])

# -----------------------------
# Thresholds
# -----------------------------
SPECIES_HIGH_CONF       = 0.70
SPECIES_GAP             = 0.20
PLANT_GATE_HIGH_CONF    = 0.80
PLANT_DISEASE_HIGH_CONF = 0.80
PLANT_DISEASE_MID_CONF  = 0.45
SPECIES_VERY_LOW        = 0.35

# -----------------------------
# Prediction Function
# -----------------------------
def predict(image_path):

    # ===== Human Face Pre-Check =====
    # Still returns a result — gets saved to MongoDB and shown in history
    if has_human_face(image_path):
        return "⚠ Human detected - Not an animal"

    image = Image.open(image_path).convert("RGB")
    tensor = transform(image).unsqueeze(0).to(device)

    # ===== Step 1: Plant vs Non-Plant =====
    with torch.no_grad():
        gate_out  = plant_gate_model(tensor)
        gate_prob = F.softmax(gate_out, dim=1)
        gate_conf, gate_pred = torch.max(gate_prob, 1)

    plant_gate_conf    = gate_conf.item()
    is_plant_gate_high = (gate_pred.item() == 1) and (plant_gate_conf >= PLANT_GATE_HIGH_CONF)

    # ===== Step 2: Animal vs Non-Animal =====
    with torch.no_grad():
        out1  = stage1_model(tensor)
        prob1 = F.softmax(out1, dim=1)
        conf1, pred1 = torch.max(prob1, 1)

    stage1_conf = conf1.item()
    pred1_val   = pred1.item()

    # ===== Step 3: Animal Species =====
    with torch.no_grad():
        out2  = stage2_model(tensor)
        prob2 = F.softmax(out2, dim=1)

        top2_prob, top2_idx = torch.topk(prob2, 2)
        top1_conf  = top2_prob[0][0].item()
        top2_conf  = top2_prob[0][1].item()
        pred_index = top2_idx[0][0].item()

    gap             = top1_conf - top2_conf
    predicted_class = animal_classes[pred_index]

    # ===== Decision =====

    if top1_conf >= SPECIES_HIGH_CONF and gap >= SPECIES_GAP:
        return f"✅ Threat - Animal: {predicted_class} ({top1_conf*100:.2f}%)"

    if is_plant_gate_high:
        with torch.no_grad():
            disease_out  = plant_disease_model(tensor)
            disease_prob = F.softmax(disease_out, dim=1)
            disease_conf, _ = torch.max(disease_prob, 1)

        disease_confidence = disease_conf.item()

        if disease_confidence >= PLANT_DISEASE_HIGH_CONF:
            return f"❌ No animal detected - Plant image given ({disease_confidence*100:.2f}%)"
        if disease_confidence >= PLANT_DISEASE_MID_CONF and top1_conf < SPECIES_VERY_LOW:
            return f"⚠ No animal detected - Unclear image ({top1_conf*100:.2f}%)"
        if pred1_val == 0 and stage1_conf > 0.80:
            return f"❌ Not an animal ({stage1_conf*100:.2f}%)"
        if top1_conf < SPECIES_VERY_LOW:
            return f"⚠ Animal detected but very unclear ({top1_conf*100:.2f}%)"
        if gap < SPECIES_GAP:
            return f"⚠ Animal detected but species ambiguous ({top1_conf*100:.2f}%)"
        return f"⚠ Unclear image ({top1_conf*100:.2f}%)"

    else:
        if pred1_val == 0 and stage1_conf > 0.80:
            return f"❌ Not an animal ({stage1_conf*100:.2f}%)"
        if stage1_conf < 0.60:
            return f"⚠ Uncertain object ({stage1_conf*100:.2f}%)"
        if top1_conf < SPECIES_VERY_LOW:
            return f"⚠ Animal detected but very unclear ({top1_conf*100:.2f}%)"
        if gap < SPECIES_GAP:
            return f"⚠ Animal detected but species ambiguous ({top1_conf*100:.2f}%)"
        return f"⚠ Unclear image ({top1_conf*100:.2f}%)"


# -----------------------------
# Test
# -----------------------------
if __name__ == "__main__":
    image_path = "pictures/animal/test.jpg"
    result = predict(image_path)
    print("Result:", result)