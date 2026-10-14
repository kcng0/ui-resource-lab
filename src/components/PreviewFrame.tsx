import { useState } from "react";
import { assetUrl } from "../lib/assetUrl.ts";
import type { Resource } from "../types.ts";

export function PreviewFrame({ resource }: { resource: Resource }) {
  const screenshot = assetUrl(resource.preview.screenshot);
  const embedUrl = resource.preview.embed_url;
  /** Prefer live source preview; local shot is fallback only. */
  const [mode, setMode] = useState<"shot" | "embed">(embedUrl ? "embed" : "shot");
  const showEmbed = mode === "embed" && Boolean(embedUrl);

  return (
    <figure className="m-0">
      <div className="overflow-hidden rounded-2xl border border-line/90 bg-paper-deep shadow-[0_24px_50px_-28px_rgba(26,22,18,0.55)]">
        <div className="flex items-center gap-2 border-b border-line/80 bg-white/70 px-3 py-2">
          <span className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-[#e07a6a]" />
            <span className="size-2.5 rounded-full bg-[#e0b85c]" />
            <span className="size-2.5 rounded-full bg-[#7cbc7a]" />
          </span>
          <span className="ml-2 truncate rounded-md bg-paper-deep/80 px-2.5 py-0.5 font-mono text-[11px] text-muted">
            {resource.source_url.replace(/^https?:\/\//, "")}
          </span>
        </div>
        <div className="relative aspect-[16/9] overflow-hidden sm:aspect-[16/10]">
          {showEmbed && embedUrl ? (
            <iframe
              title={`${resource.title} embed`}
              src={embedUrl}
              className="h-full w-full bg-white"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              referrerPolicy="no-referrer"
              onError={() => {
                if (screenshot) setMode("shot");
              }}
            />
          ) : screenshot ? (
            <img
              src={screenshot}
              alt={`${resource.title} 本地示意截图（非对方站内实时预览）`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">无预览</div>
          )}
        </div>
      </div>
      <figcaption className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="预览方式">
          {embedUrl ? (
            <button
              type="button"
              aria-pressed={mode === "embed"}
              onClick={() => setMode("embed")}
              className={toggleClass(mode === "embed")}
            >
              源站预览
              <span className="ml-1 opacity-60">Live</span>
            </button>
          ) : null}
          {screenshot ? (
            <button
              type="button"
              aria-pressed={mode === "shot"}
              onClick={() => setMode("shot")}
              className={toggleClass(mode === "shot")}
            >
              截图
              <span className="ml-1 opacity-60">Fallback</span>
            </button>
          ) : null}
        </div>
        <p className="max-w-md text-xs leading-5 text-muted">
          优先嵌各源官方组件预览；源站更新会跟着变。截图仅作 fallback（已带 Pages BASE_URL）。站若禁 iframe
          可切手动。
        </p>
      </figcaption>
    </figure>
  );
}

function toggleClass(active: boolean): string {
  return active
    ? "rounded-full bg-ink px-3.5 py-1.5 text-sm text-paper transition duration-200 ease-ui"
    : "rounded-full border border-line bg-white/80 px-3.5 py-1.5 text-sm text-ink transition duration-200 ease-ui hover:border-copper/40 hover:bg-white";
}
