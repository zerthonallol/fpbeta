export function availableStoryChoice(condition: "notes" | "gens" | undefined, notes: number, gens: number) {
  return condition === "notes" ? notes >= 3 : condition === "gens" ? gens >= 3 : true;
}

export function canReleaseBear(armed: boolean, flashlight: boolean, distance: number, visible: boolean) {
  return armed && !flashlight && distance < 3 && visible;
}