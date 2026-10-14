export type DensityCols = 2 | 4;

export function parseDensity(raw: string | null): DensityCols {
  return raw === "4" ? 4 : 2;
}

export function densityGridClass(cols: DensityCols): string {
  return cols === 4
    ? "grid gap-3 grid-cols-2 lg:grid-cols-4"
    : "grid gap-3 grid-cols-1 sm:grid-cols-2";
}
