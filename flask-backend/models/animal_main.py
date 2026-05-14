# import torch
# import timm
# import torch.nn.functional as F
# from torchvision import transforms
# from PIL import Image
# import os
# import cv2
# import numpy as np

# # -----------------------------
# # Device
# # -----------------------------
# device = torch.device("cpu")
# print("Using device:", device)

# # -----------------------------
# # Human Face Filter (OpenCV)
# # -----------------------------
# face_cascade = cv2.CascadeClassifier('/usr/share/opencv4/haarcascades/haarcascade_frontalface_default.xml')

# def has_human_face(image_path):
#     """Returns True if a human face is detected in the image."""
#     img  = cv2.imread(image_path)
#     if img is None:
#         return False
#     gray  = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
#     faces = face_cascade.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=8, minSize=(80, 80))
#     return len(faces) > 0

# # -----------------------------
# # Animal Classes (75)
# # -----------------------------
# animal_classes = [
# 'antelope','badger','bat','bear','beetle','bison','boar','buffalo','cat','caterpillar',
# 'chimpanzee','cockroach','cow','coyote','crab','crow','deer','dog','donkey','duck',
# 'eagle','elephant','flamingo','fly','fox','goat','goose','gorilla','grasshopper',
# 'hamster','hare','hedgehog','hippopotamus','hornbill','horse','hyena','kangaroo',
# 'koala','ladybugs','leopard','lion','lizard','monkey','mosquito','moth','mouse',
# 'octopus','okapi','orangutan','otter','owl','ox','panda','parrot','pelecaniformes',
# 'pig','pigeon','porcupine','possum','raccoon','rat','reindeer','rhinoceros',
# 'sandpiper','sheep','snake','sparrow','squirrel','tiger','turkey','turtle',
# 'wolf','wombat','woodpecker','zebra'
# ]

# # -----------------------------
# # Load All Models
# # -----------------------------

# # Step 1 - Plant vs Non-Plant
# plant_gate_model = timm.create_model("efficientnet_b0", pretrained=False, num_classes=2)
# plant_gate_model.load_state_dict(torch.load("models/models_stored/plant_vs_nonplant.pth", map_location=device))
# plant_gate_model.to(device).eval()

# # Step 2 - Animal vs Non-Animal
# stage1_model = timm.create_model("efficientnet_b0", pretrained=False, num_classes=2)
# stage1_model.load_state_dict(torch.load("models/models_stored/animal_vs_nonanimal.pth", map_location=device))
# stage1_model.to(device).eval()

# # Step 3 - Animal Species
# stage2_model = timm.create_model("efficientnet_b0", pretrained=False, num_classes=75)
# stage2_model.load_state_dict(torch.load("models/models_stored/animal_species_75.pth", map_location=device))
# stage2_model.to(device).eval()

# # Step 4 - Plant Disease (only used when plant gate was HIGH confidence)
# plant_disease_model = timm.create_model("efficientnet_b0", pretrained=False, num_classes=38)
# plant_disease_model.load_state_dict(torch.load("models/models_stored/plant_disease_38.pth", map_location=device))
# plant_disease_model.to(device).eval()

# # -----------------------------
# # Transform
# # -----------------------------
# transform = transforms.Compose([
#     transforms.Resize((224, 224)),
#     transforms.ToTensor()
# ])

# # -----------------------------
# # Thresholds
# # -----------------------------
# SPECIES_HIGH_CONF       = 0.70
# SPECIES_GAP             = 0.20
# PLANT_GATE_HIGH_CONF    = 0.80
# PLANT_DISEASE_HIGH_CONF = 0.80
# PLANT_DISEASE_MID_CONF  = 0.45
# SPECIES_VERY_LOW        = 0.35

# # -----------------------------
# # Prediction Function
# # -----------------------------
# def predict(image_path):

#     # ===== Human Face Pre-Check =====
#     # Still returns a result — gets saved to MongoDB and shown in history
#     if has_human_face(image_path):
#         return "⚠ Human detected - Not an animal"

#     image = Image.open(image_path).convert("RGB")
#     tensor = transform(image).unsqueeze(0).to(device)

#     # ===== Step 1: Plant vs Non-Plant =====
#     with torch.no_grad():
#         gate_out  = plant_gate_model(tensor)
#         gate_prob = F.softmax(gate_out, dim=1)
#         gate_conf, gate_pred = torch.max(gate_prob, 1)

#     plant_gate_conf    = gate_conf.item()
#     is_plant_gate_high = (gate_pred.item() == 1) and (plant_gate_conf >= PLANT_GATE_HIGH_CONF)

#     # ===== Step 2: Animal vs Non-Animal =====
#     with torch.no_grad():
#         out1  = stage1_model(tensor)
#         prob1 = F.softmax(out1, dim=1)
#         conf1, pred1 = torch.max(prob1, 1)

#     stage1_conf = conf1.item()
#     pred1_val   = pred1.item()

#     # ===== Step 3: Animal Species =====
#     with torch.no_grad():
#         out2  = stage2_model(tensor)
#         prob2 = F.softmax(out2, dim=1)

#         top2_prob, top2_idx = torch.topk(prob2, 2)
#         top1_conf  = top2_prob[0][0].item()
#         top2_conf  = top2_prob[0][1].item()
#         pred_index = top2_idx[0][0].item()

#     gap             = top1_conf - top2_conf
#     predicted_class = animal_classes[pred_index]

#     # ===== Decision =====

#     if top1_conf >= SPECIES_HIGH_CONF and gap >= SPECIES_GAP:
#         return f"✅ Threat - Animal: {predicted_class} ({top1_conf*100:.2f}%)"

#     if is_plant_gate_high:
#         with torch.no_grad():
#             disease_out  = plant_disease_model(tensor)
#             disease_prob = F.softmax(disease_out, dim=1)
#             disease_conf, _ = torch.max(disease_prob, 1)

#         disease_confidence = disease_conf.item()

#         if disease_confidence >= PLANT_DISEASE_HIGH_CONF:
#             return f"❌ No animal detected - Plant image given ({disease_confidence*100:.2f}%)"
#         if disease_confidence >= PLANT_DISEASE_MID_CONF and top1_conf < SPECIES_VERY_LOW:
#             return f"⚠ No animal detected - Unclear image ({top1_conf*100:.2f}%)"
#         if pred1_val == 0 and stage1_conf > 0.80:
#             return f"❌ Not an animal ({stage1_conf*100:.2f}%)"
#         if top1_conf < SPECIES_VERY_LOW:
#             return f"⚠ Animal detected but very unclear ({top1_conf*100:.2f}%)"
#         if gap < SPECIES_GAP:
#             return f"⚠ Animal detected but species ambiguous ({top1_conf*100:.2f}%)"
#         return f"⚠ Unclear image ({top1_conf*100:.2f}%)"

#     else:
#         if pred1_val == 0 and stage1_conf > 0.80:
#             return f"❌ Not an animal ({stage1_conf*100:.2f}%)"
#         if stage1_conf < 0.60:
#             return f"⚠ Uncertain object ({stage1_conf*100:.2f}%)"
#         if top1_conf < SPECIES_VERY_LOW:
#             return f"⚠ Animal detected but very unclear ({top1_conf*100:.2f}%)"
#         if gap < SPECIES_GAP:
#             return f"⚠ Animal detected but species ambiguous ({top1_conf*100:.2f}%)"
#         return f"⚠ Unclear image ({top1_conf*100:.2f}%)"


# # -----------------------------
# # Test
# # -----------------------------
# if __name__ == "__main__":
#     image_path = "pictures/animal/test.jpg"
#     result = predict(image_path)
#     print("Result:", result)






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
# Human Face Filter (OpenCV) — Pi-cam hardened
# -----------------------------
face_cascade = cv2.CascadeClassifier('/usr/share/opencv4/haarcascades/haarcascade_frontalface_default.xml')

def has_human_face(image_path):
    """
    Returns True ONLY if a high-confidence human face is detected.

    Pi-cam hardening changes vs original:
    - scaleFactor 1.05 → 1.08  : less aggressive pyramid, fewer false steps
    - minNeighbors 8 → 14      : many more overlapping detections required
    - minSize (80,80) → (100,100): ignores small face-like blobs (leaves, snouts)
    - Added aspect-ratio check  : real faces are roughly square; leaf patches are not
    - Added histogram check     : skin-tone guard — rejects green/grey regions
    """
    img = cv2.imread(image_path)
    if img is None:
        return False

    gray  = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # Equalize so Pi-cam exposure changes don't fool the detector
    gray  = cv2.equalizeHist(gray)

    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.08,
        minNeighbors=18,        # raised: dog/cat snouts don't sustain this many overlaps
        minSize=(100, 100)
    )

    if len(faces) == 0:
        return False

    h_img, w_img = img.shape[:2]
    img_area = h_img * w_img

    for (x, y, w, h) in faces:
        # 1. Aspect-ratio guard — real face boxes are nearly square
        aspect = w / float(h)
        if aspect < 0.75 or aspect > 1.35:
            continue

        # 2. Size sanity — face shouldn't be >60% of frame
        if (w * h) > 0.60 * img_area:
            continue

        roi = img[y:y+h, x:x+w]
        hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)

        # 3. Fur/animal color rejection
        # Golden/yellow fur (golden retrievers, dogs): hue 15-35, high saturation
        lower_fur = np.array([15, 80,  80],  dtype=np.uint8)
        upper_fur = np.array([35, 255, 255], dtype=np.uint8)
        fur_mask  = cv2.inRange(hsv, lower_fur, upper_fur)
        fur_ratio = cv2.countNonZero(fur_mask) / float(w * h)
        # If >35% of the box is golden/yellow fur → animal snout, not a human face
        if fur_ratio > 0.35:
            continue

        # 4. Skin-tone guard — human skin hue 0-18, low-mid saturation
        lower_skin = np.array([0,  20,  60], dtype=np.uint8)
        upper_skin = np.array([18, 150, 255], dtype=np.uint8)
        skin_mask  = cv2.inRange(hsv, lower_skin, upper_skin)
        skin_ratio = cv2.countNonZero(skin_mask) / float(w * h)
        # Require at least 20% skin-tone pixels (raised from 15%)
        if skin_ratio < 0.20:
            continue

        # Passed all guards — treat as a real human face
        return True

    return False

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

# Step 1 - Plant vs Non-Plant (gate)
plant_gate_model = timm.create_model("efficientnet_b0", pretrained=False, num_classes=2)
plant_gate_model.load_state_dict(torch.load("models/models_stored/plant_vs_nonplant.pth", map_location=device))
plant_gate_model.to(device).eval()

# Step 2 - Animal vs Non-Animal
stage1_model = timm.create_model("efficientnet_b0", pretrained=False, num_classes=2)
stage1_model.load_state_dict(torch.load("models/models_stored/animal_vs_nonanimal.pth", map_location=device))
stage1_model.to(device).eval()

# Step 3 - Animal Species (75 classes)
stage2_model = timm.create_model("efficientnet_b0", pretrained=False, num_classes=75)
stage2_model.load_state_dict(torch.load("models/models_stored/animal_species_75.pth", map_location=device))
stage2_model.to(device).eval()

# Step 4 - Plant Disease (used when plant gate fires)
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
# Thresholds  ← tuned for 75-class buffalo-biased model
# -----------------------------
SPECIES_HIGH_CONF       = 0.60   # was 0.70 — relaxed so valid species aren't dropped
SPECIES_GAP             = 0.12   # was 0.20 — relaxed; 75-class softmax spreads probability
PLANT_GATE_HIGH_CONF    = 0.80
PLANT_DISEASE_HIGH_CONF = 0.80
PLANT_DISEASE_MID_CONF  = 0.45
SPECIES_VERY_LOW        = 0.30   # was 0.35

# -----------------------------
# Buffalo bias correction
# -----------------------------
# If the model predicts buffalo but the image is not dark/black-dominant,
# lower the effective confidence so it falls back to the gap/ambiguous path.
BUFFALO_IDX = animal_classes.index('buffalo')

def apply_buffalo_debias(prob_tensor, image_path):
    """
    If top prediction is buffalo, check whether the image is genuinely
    dark/black-dominated. If not, reduce buffalo's logit weight by 40%
    and re-normalise so a more plausible second choice can win.
    """
    top_idx = torch.argmax(prob_tensor).item()
    if top_idx != BUFFALO_IDX:
        return prob_tensor   # not buffalo → nothing to do

    # Read image and compute darkness score (mean brightness in HSV-V channel)
    img = cv2.imread(image_path)
    if img is None:
        return prob_tensor
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    mean_brightness = hsv[:, :, 2].mean()   # 0 (black) → 255 (white)

    # Only debias if image is NOT predominantly dark (brightness > 80/255)
    if mean_brightness > 80:
        prob_np = prob_tensor.clone().cpu().numpy()
        prob_np[0][BUFFALO_IDX] *= 0.60      # penalise buffalo by 40%
        prob_tensor = torch.tensor(prob_np / prob_np.sum())  # renormalise

    return prob_tensor

# -----------------------------
# Prediction Function
# -----------------------------
def predict(image_path):

    # ===== Human Face Pre-Check =====
    if has_human_face(image_path):
        return "⚠ Human detected - Not an animal"

    image = Image.open(image_path).convert("RGB")
    tensor = transform(image).unsqueeze(0).to(device)

    # ===== Step 1: Plant vs Non-Plant gate =====
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

    # Apply buffalo debias before reading top-2
    prob2 = apply_buffalo_debias(prob2, image_path)

    top2_prob, top2_idx = torch.topk(prob2, 2)
    top1_conf  = top2_prob[0][0].item()
    top2_conf  = top2_prob[0][1].item()
    pred_index = top2_idx[0][0].item()

    gap             = top1_conf - top2_conf
    predicted_class = animal_classes[pred_index]

    # ===== Decision =====

    # Strong animal species hit → report threat
    if top1_conf >= SPECIES_HIGH_CONF and gap >= SPECIES_GAP:
        return f"✅ Threat - Animal: {predicted_class} ({top1_conf*100:.2f}%)"

    # Plant gate fired → check plant disease model before giving up
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