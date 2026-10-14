import { Link, useSearchParams } from "react-router-dom";
import { stackLabel } from "../labels.ts";
import type { Resource } from "../types.ts";
import { KindBadge, LicenseBadge, StatusBadge, SourceBadge } from "./Badges.tsx";

/** Accent per vibe slug / locked zh label — editorial, not rainbow spam. */
const vibeAccent: Record<string, { bar: string; soft: string; mark: string }> = {
  minimal: { bar: "bg-ink/70", soft: "bg-paper-deep", mark: "text-ink/50" },
  editorial: { bar: "bg-copper", soft: "bg-copper-soft", mark: "text-copper" },
  playful: { bar: "bg-coral", soft: "bg-coral-soft", mark: "text-coral" },
  technical: { bar: "bg-slate", soft: "bg-slate-soft", mark: "text-slate" },
  luxury: { bar: "bg-pro", soft: "bg-pro-soft", mark: "text-pro" },
  soft: { bar: "bg-sage", soft: "bg-sage-soft", mark: "text-sage" },
  brutalist: { bar: "bg-ink", soft: "bg-paper-deep", mark: "text-ink" },
  cinematic: { bar: "bg-amber", soft: "bg-amber-soft", mark: "text-amber" },
  趣味交互: { bar: "bg-coral", soft: "bg-coral-soft", mark: "text-coral" },
  产品级组件橱窗: { bar: "bg-copper", soft: "bg-copper-soft", mark: "text-copper" },
  动效营销: { bar: "bg-amber", soft: "bg-amber-soft", mark: "text-amber" },
  克制工程基座: { bar: "bg-sage", soft: "bg-sage-soft", mark: "text-sage" },
};

const fallbackAccent = { bar: "bg-copper", soft: "bg-copper-soft", mark: "text-copper" };

function accentFor(resource: Resource) {
  const key = resource.vibe[0];
  return (key && vibeAccent[key]) || fallbackAccent;
}

export function ResourceCard({
  resource,
  href,
}: {
  resource: Resource;
  href: string;
}) {
  const [params] = useSearchParams();
  const screenshot = resource.preview.screenshot;
  const accent = accentFor(resource);
  const primaryVibe = resource.vibe[0];

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line/90 bg-white/85 shadow-[0_18px_42px_-28px_rgba(26,22,18,0.65)] transition duration-200 ease-ui hover:-translate-y-1 hover:border-copper/35 hover:shadow-[0_28px_50px_-24px_rgba(26,22,18,0.55)]">
      <span className={`absolute top-0 bottom-0 left-0 z-10 w-[3px] ${accent.bar}`} aria-hidden />
      <Link
        to={href}
        state={{ from: params.toString() }}
        className="flex h-full flex-col text-inherit no-underline"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-paper-deep">
          {screenshot ? (
            <img
              src={screenshot}
              alt=""
              className="h-full w-full object-cover transition duration-500 ease-ui group-hover:scale-[1.04]"
              loading="lazy"
            />
          ) : (
            <div className={`flex h-full items-center justify-center ${accent.soft}`}>
              <span className={`font-serif text-6xl leading-none ${accent.mark}`}>
                {resource.title.slice(0, 1)}
              </span>
            </div>
          )}
          {primaryVibe ? (
            <span
              className={`absolute top-3 right-3 max-w-[70%] truncate rounded-full border border-white/50 bg-white/90 px-2.5 py-1 text-[11px] font-medium shadow-sm backdrop-blur ${accent.mark}`}
            >
              {primaryVibe}
            </span>
          ) : null}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink/25 to-transparent opacity-0 transition duration-200 group-hover:opacity-100" />
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4 pl-5">
          <div className="flex items-center justify-between gap-2">
            <KindBadge kind={resource.kind} />
            <LicenseBadge license={resource.license} />
          </div>
          <h2 className="font-serif text-[1.65rem] leading-[1.05] tracking-tight transition-colors duration-200 group-hover:text-copper sm:text-[1.75rem]">
            {resource.title}
          </h2>
          <p className="line-clamp-3 text-sm leading-6 text-muted">{resource.notes}</p>
          <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
            {resource.status === "pending_review" ? <StatusBadge status={resource.status} /> : null}
            {resource.stack.slice(0, 4).map((stack) => (
              <span
                key={stack}
                className="rounded-md border border-line/70 bg-paper/90 px-1.5 py-0.5 text-[11px] text-muted"
              >
                {stackLabel(stack)}
              </span>
            ))}
            {resource.stack.length > 4 ? (
              <span className="text-[11px] text-muted">+{resource.stack.length - 4}</span>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}

