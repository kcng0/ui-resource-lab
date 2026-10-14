import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { assetUrl, isEmbeddablePreviewUrl } from "../lib/assetUrl.ts";
import { stackLabel } from "../labels.ts";
import type { Resource } from "../types.ts";
import { KindBadge, LicenseBadge, SourceBadge, StatusBadge } from "./Badges.tsx";

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

/** Live source preview first; local screenshot (BASE_URL-aware) as fallback. */
function CardMedia({
  resource,
  accent,
  onLiveActive,
}: {
  resource: Resource;
  accent: { soft: string; mark: string };
  onLiveActive?: (active: boolean) => void;
}) {
  const rawEmbed = resource.preview.embed_url;
  const embedUrl = isEmbeddablePreviewUrl(rawEmbed) ? rawEmbed : undefined;
  const shot = assetUrl(resource.preview.screenshot);
  const hostRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [embedFailed, setEmbedFailed] = useState(false);

  useEffect(() => {
    const node = hostRef.current;
    if (!node || !embedUrl) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "160px 0px", threshold: 0.05 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [embedUrl]);

  const showEmbed = Boolean(embedUrl) && inView && !embedFailed;

  useEffect(() => {
    onLiveActive?.(showEmbed);
  }, [showEmbed, onLiveActive]);

  return (
    <div ref={hostRef} className="relative aspect-[16/10] overflow-hidden bg-paper-deep">
      {shot ? (
        <img
          src={shot}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition duration-500 ease-ui group-hover:scale-[1.04] ${
            showEmbed ? "opacity-0" : "opacity-100"
          }`}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.visibility = "hidden";
          }}
        />
      ) : (
        <div
          className={`absolute inset-0 flex items-center justify-center ${accent.soft} ${
            showEmbed ? "opacity-0" : "opacity-100"
          }`}
        >
          <span className={`font-serif text-6xl leading-none ${accent.mark}`}>
            {resource.title.slice(0, 1)}
          </span>
        </div>
      )}
      {showEmbed && embedUrl ? (
        <iframe
          title={`${resource.title} live preview`}
          src={embedUrl}
          className="absolute inset-0 h-full w-full bg-white"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setEmbedFailed(true)}
        />
      ) : null}
    </div>
  );
}

export function ResourceCard({
  resource,
  href,
}: {
  resource: Resource;
  href: string;
}) {
  const [params] = useSearchParams();
  const accent = accentFor(resource);
  const primaryVibe = resource.vibe[0];
  const [liveActive, setLiveActive] = useState(false);
  const linkState = { from: params.toString() };

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line/90 bg-white/85 shadow-[0_18px_42px_-28px_rgba(26,22,18,0.65)] transition duration-200 ease-ui hover:-translate-y-1 hover:border-copper/35 hover:shadow-[0_28px_50px_-24px_rgba(26,22,18,0.55)]">
      <span className={`absolute top-0 bottom-0 left-0 z-10 w-[3px] ${accent.bar}`} aria-hidden />
      <div className="relative">
        <CardMedia resource={resource} accent={accent} onLiveActive={setLiveActive} />
        {!liveActive ? (
          <Link
            to={href}
            state={linkState}
            className="absolute inset-0 z-[1]"
            aria-label={resource.title}
          />
        ) : null}
        <div className="pointer-events-none absolute top-3 left-3 right-3 z-[2] flex items-start justify-between gap-2">
          <SourceBadge source={resource.source} />
          {primaryVibe ? (
            <span
              className={`max-w-[55%] truncate rounded-full border border-white/50 bg-white/90 px-2.5 py-1 text-[11px] font-medium shadow-sm backdrop-blur ${accent.mark}`}
            >
              {primaryVibe}
            </span>
          ) : null}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-16 bg-gradient-to-t from-ink/25 to-transparent opacity-0 transition duration-200 group-hover:opacity-100" />
      </div>
      <Link
        to={href}
        state={linkState}
        className="flex flex-1 flex-col gap-2.5 p-3.5 pl-4 text-inherit no-underline sm:p-4 sm:pl-5"
      >
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-serif text-[1.35rem] leading-[1.08] tracking-tight transition-colors duration-200 group-hover:text-copper sm:text-[1.5rem]">
            {resource.title}
          </h2>
          <LicenseBadge license={resource.license} />
        </div>
        {resource.kind !== "component" ? (
          <div className="flex flex-wrap gap-1.5">
            <KindBadge kind={resource.kind} />
          </div>
        ) : null}
        <p className="line-clamp-2 text-sm leading-5 text-muted">{resource.notes}</p>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-0.5">
          {resource.status === "pending_review" ? <StatusBadge status={resource.status} /> : null}
          {resource.stack.slice(0, 3).map((stack) => (
            <span
              key={stack}
              className="rounded-md border border-line/70 bg-paper/90 px-1.5 py-0.5 text-[11px] text-muted"
            >
              {stackLabel(stack)}
            </span>
          ))}
          {resource.stack.length > 3 ? (
            <span className="text-[11px] text-muted">+{resource.stack.length - 3}</span>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
