export const EQUIPAMIENTO_ITEMS = [
  { key: "celular", label: "Celular" },
  { key: "conos", label: "Conos" },
  { key: "cintasPeligro", label: "Cintas de peligro" },
  { key: "cricetYSogas", label: "Cricet y sogas" },
  { key: "bateriaCarro", label: "Batería del carro" },
  { key: "linternas", label: "Linternas" },
  { key: "goPro", label: "Go Pro" },
] as const;

export type EquipamientoKey = (typeof EQUIPAMIENTO_ITEMS)[number]["key"];

export type EquipamientoItem = {
  estado: string;
  cantidad: string;
};

export type EquipamientoMap = Partial<
  Record<EquipamientoKey, EquipamientoItem>
>;
