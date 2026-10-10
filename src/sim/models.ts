export const DEFAULT_MODEL = "../models/Qwen3-4B-Instruct-2507-Q4_K_M.gguf";

/** Measured phone rates (tokens per second) for the models BOAR ships. */
export function phoneRates(model: string): { name: string; read: number; write: number }[] {
  if (/1\.5b/i.test(model)) return [{ name: "Pixel 6a (6 GB)", read: 45, write: 14 }];
  return [
    { name: "Pixel 6a (6 GB)", read: 22, write: 5 },
    { name: "Dimensity 8300 (12 GB)", read: 26, write: 7 },
  ];
}
