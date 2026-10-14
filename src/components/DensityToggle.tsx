import type { DensityCols } from "../lib/density.ts";

export function DensityToggle({
  value,
  onChange,
}: {
  value: DensityCols;
  onChange: (next: DensityCols) => void;
}) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label="每行卡片数">
      <span className="text-[10px] font-medium tracking-[0.14em] text-muted uppercase">密度</span>
      {(
        [
          [2, "2 / 行"],
          [4, "4 / 行"],
        ] as const
      ).map(([cols, label]) => {
        const active = value === cols;
        return (
          <button
            key={cols}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(cols)}
            className={active ? "chip chip-active" : "chip"}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
