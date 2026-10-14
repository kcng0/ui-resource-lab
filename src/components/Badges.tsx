import { kindLabels, licenseLabels, licenseTone, sourceLabels } from "../labels.ts";
import type { Source } from "../types.ts";
import type { Kind, License, Status } from "../types.ts";

export function KindBadge({ kind }: { kind: Kind }) {
  const label = kindLabels[kind];
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-line/80 bg-paper-deep/90 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-ink">
      <span className="size-1.5 rounded-full bg-ink/45" aria-hidden />
      {label.zh}
      <span className="font-normal text-muted">{label.en}</span>
    </span>
  );
}

export function LicenseBadge({ license }: { license: License }) {
  const label = licenseLabels[license];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${licenseTone[license]}`}>
      {label.zh}
      <span className="ml-1 font-normal opacity-75">{label.en}</span>
    </span>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sage-soft px-2.5 py-0.5 text-[11px] font-medium text-sage">
        <span className="size-1.5 rounded-full bg-sage" aria-hidden />
        已收录
        <span className="font-normal opacity-70">approved</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-copper-soft px-2.5 py-0.5 text-[11px] font-medium text-copper">
      <span className="size-1.5 animate-pulse rounded-full bg-copper" aria-hidden />
      待审
      <span className="font-normal opacity-70">pending</span>
    </span>
  );
}

export function SourceBadge({ source }: { source: Source }) {
  const label = sourceLabels[source];
  return (
    <span className="inline-flex items-center rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-medium text-ink/70">
      {label.zh}
    </span>
  );
}
