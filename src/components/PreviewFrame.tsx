import { useState } from "react";
import type { Resource } from "../types.ts";

export function PreviewFrame({ resource }: { resource: Resource }) {
  const screenshot = resource.preview.screenshot;
  const embedUrl = resource.preview.embed_url;
  const [mode, setMode] = useState<"shot" | "embed">(screenshot ? "shot" : "embed");
  const showEmbed = mode === "embed" && Boolean(embedUrl);

  return (
    <figure className="m-0">
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-line bg-paper-deep">
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
            alt={`${resource.title} 的本地示例画稿，不是对方站点的真实截图`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">无预览</div>
        )}
      </div>
      <figcaption className="mt-3 flex flex-col gap-2">
        <div className="flex flex-wrap gap-2" role="group" aria-label="预览方式">
          {screenshot ? (
            <button
              type="button"
              aria-pressed={mode === "shot"}
              onClick={() => setMode("shot")}
              className={toggleClass(mode === "shot")}
            >
              截图 Screenshot
            </button>
          ) : null}
          {embedUrl ? (
            <button
              type="button"
              aria-pressed={mode === "embed"}
              onClick={() => setMode("embed")}
              className={toggleClass(mode === "embed")}
            >
              嵌入 Embed
            </button>
          ) : null}
        </div>
        <p className="text-xs leading-5 text-muted">
          画稿是本地示例，不是对方站点的真实截图。若嵌入空白，站点可能禁止被 iframe
          引用，请改回截图。 Example plate, not a live screenshot. If the embed stays blank, the
          site is blocking iframes.
        </p>
      </figcaption>
    </figure>
  );
}

function toggleClass(active: boolean): string {
  return active
    ? "rounded-full bg-ink px-3 py-1.5 text-sm text-paper"
    : "rounded-full border border-line bg-white/70 px-3 py-1.5 text-sm text-ink";
}
