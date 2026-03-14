import torch
import timm
import torch.nn.functional as F
from torchvision import transforms
from PIL import Image
import os

# -----------------------------
# Device
# -----------------------------
device = torch.device("cpu")
print("Using device:", device)

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
SPECIES_HIGH_CONF       = 0.70   # animal species must be >= this to confirm animal
SPECIES_GAP             = 0.20   # gap between top1 and top2 species must be >= this
PLANT_GATE_HIGH_CONF    = 0.80   # plant_vs_nonplant must be >= this to be "high"
PLANT_DISEASE_HIGH_CONF = 0.80   # plant_disease_38 overall confidence >= this → it's a plant
PLANT_DISEASE_MID_CONF  = 0.45   # plant_disease_38 confidence >= this AND species < 35% → unclear
SPECIES_VERY_LOW        = 0.35   # animal species below this is considered very low

# -----------------------------
# Prediction Function
# -----------------------------
def predict(image_path):

    image = Image.open(image_path).convert("RGB")
    tensor = transform(image).unsqueeze(0).to(device)

    # ===== Step 1: Plant vs Non-Plant =====
    # Always run — just record, never stop here
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

    # CASE 1: Animal species HIGH confidence → Animal detected, DONE
    if top1_conf >= SPECIES_HIGH_CONF and gap >= SPECIES_GAP:
        return f"✅ Threat - Animal: {predicted_class} ({top1_conf*100:.2f}%)"

    # CASE 2: Animal species NOT confident
    # Now check plant gate result

    if is_plant_gate_high:
        # Plant gate was HIGH → run plant_disease_38 for confirmation

        with torch.no_grad():
            disease_out  = plant_disease_model(tensor)
            disease_prob = F.softmax(disease_out, dim=1)
            disease_conf, _ = torch.max(disease_prob, 1)

        disease_confidence = disease_conf.item()

        # plant_disease confidence HIGH (≥80%) → definitely a plant
        if disease_confidence >= PLANT_DISEASE_HIGH_CONF:
            return f"❌ No animal detected - Plant image given ({disease_confidence*100:.2f}%)"

        # plant_disease confidence MID (≥45%) AND animal species very low (<35%)
        # → not confident enough to call it animal
        if disease_confidence >= PLANT_DISEASE_MID_CONF and top1_conf < SPECIES_VERY_LOW:
            return f"⚠ No animal detected - Unclear image ({top1_conf*100:.2f}%)"

        # plant_disease LOW confidence → trust animal model result
        if pred1_val == 0 and stage1_conf > 0.80:
            return f"❌ Not an animal ({stage1_conf*100:.2f}%)"
        if top1_conf < SPECIES_VERY_LOW:
            return f"⚠ Animal detected but very unclear ({top1_conf*100:.2f}%)"
        if gap < SPECIES_GAP:
            return f"⚠ Animal detected but species ambiguous ({top1_conf*100:.2f}%)"
        return f"⚠ Unclear image ({top1_conf*100:.2f}%)"

    else:
        # Plant gate was LOW → skip plant_disease_38, trust animal model directly

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
    image_path = "pictures/animal/test.jpg"  # change image here
    result = predict(image_path)
    print("Result:", result)