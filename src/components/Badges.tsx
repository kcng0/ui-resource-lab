import { kindLabels, licenseLabels, licenseTone } from "../labels.ts";
import type { Kind, License, Status } from "../types.ts";

export function KindBadge({ kind }: { kind: Kind }) {
  const label = kindLabels[kind];
  return (
    <span className="rounded-full bg-paper-deep px-2 py-0.5 text-xs text-ink">
      {label.zh} {label.en}
    </span>
  );
}

export function LicenseBadge({ license }: { license: License }) {
  const label = licenseLabels[license];
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${licenseTone[license]}`}>
      {label.zh} {label.en}
    </span>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  if (status === "approved") {
    return (
      <span className="rounded-full bg-sage-soft px-2 py-0.5 text-xs text-sage">
        已收录 approved
      </span>
    );
  }
  return (
    <span className="rounded-full bg-copper-soft px-2 py-0.5 text-xs text-copper">
      待审 pending
    </span>
  );
}
