export const BACKGROUND_PRESETS = [
  {
    id: "default",
    label: "Default",
    background: "linear-gradient(91deg, #0c141a, #1d1d1d, #12181c)",
  },
  {
    id: "warm",
    label: "Warm",
    background: "linear-gradient(91deg, #1a1410, #1d1814, #1c1210)",
  },
  {
    id: "cool",
    label: "Cool",
    background: "linear-gradient(91deg, #0a141a, #0d1a1d, #0c1218)",
  },
  {
    id: "mono",
    label: "Mono",
    background: "#0d0d0f",
  },
  {
    id: "navy",
    label: "Navy",
    background: "linear-gradient(135deg, #0e1c26, #1a2a35, #0d1520)",
  },
  {
    id: "forest",
    label: "Forest",
    background: "linear-gradient(91deg, #0c1612, #121a14, #0f1810)",
  },
];

export function getBackgroundStyle(id) {
  const preset = BACKGROUND_PRESETS.find((p) => p.id === id);
  return preset?.background ?? BACKGROUND_PRESETS[0].background;
}
