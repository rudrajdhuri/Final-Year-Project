export type PlantResultKind =
  | "disease"
  | "healthy"
  | "non_plant"
  | "unclear"
  | "error"
  | "unknown";

export type PlantResultView = {
  kind: PlantResultKind;
  title: string;
  displayText: string;
  isThreat: boolean;
};

export function classifyPlantResult(rawValue: string | null | undefined): PlantResultView {
  const raw = String(rawValue || "").trim();
  const lowered = raw.toLowerCase();

  if (!raw) {
    return {
      kind: "unknown",
      title: "Plant check completed",
      displayText: "No plant result",
      isThreat: false,
    };
  }

  if (lowered.includes("human detected")) {
    return {
      kind: "non_plant",
      title: "No plant detected",
      displayText: "Human detected - not a plant",
      isThreat: false,
    };
  }

  if (lowered.includes("animal image given")) {
    return {
      kind: "non_plant",
      title: "No plant detected",
      displayText: "Animal image given - not a plant",
      isThreat: false,
    };
  }

  if (lowered.includes("not a plant detected") || lowered.includes("no plant detected")) {
    return {
      kind: "non_plant",
      title: "No plant detected",
      displayText: "No plant detected",
      isThreat: false,
    };
  }

  if (lowered.includes("unclear - move closer to leaf")) {
    return {
      kind: "unclear",
      title: "Unclear plant result",
      displayText: "Unclear result - move closer to the leaf",
      isThreat: false,
    };
  }

  if (lowered.includes("unclear - focus on single leaf")) {
    return {
      kind: "unclear",
      title: "Unclear plant result",
      displayText: "Unclear result - focus on one leaf",
      isThreat: false,
    };
  }

  if (lowered.includes("unhealthy") && lowered.includes("disease detected")) {
    return {
      kind: "disease",
      title: "Plant disease detected",
      displayText: "Plant disease detected",
      isThreat: true,
    };
  }

  if (lowered.includes("healthy") && lowered.includes("no disease detected")) {
    return {
      kind: "healthy",
      title: "Healthy plant result",
      displayText: "Healthy plant - no disease detected",
      isThreat: false,
    };
  }

  if (lowered.includes("error")) {
    return {
      kind: "error",
      title: "Detection error",
      displayText: raw,
      isThreat: false,
    };
  }

  return {
    kind: "unknown",
    title: "Plant check completed",
    displayText: raw,
    isThreat: false,
  };
}
