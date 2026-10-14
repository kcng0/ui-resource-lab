import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { inboxResources } from "../catalog.ts";
import { ResourceCard } from "../components/ResourceCard.tsx";
import { sourceLabels } from "../labels.ts";
import { collectSources, resourceText } from "../query.ts";
import type { Source } from "../types.ts";

export function InboxPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const sourceParam = params.get("source") ?? "";
  const selectedSources = useMemo(
    () =>
      sourceParam
        .split(",")
        .map((s) => s.trim())
        .filter((s): s is Source => ["shadcn", "magicui", "uiverse", "21st"].includes(s)),
    [sourceParam],
  );

  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
  const sources = collectSources(inboxResources);

  const visible = inboxResources.filter((resource) => {
    if (selectedSources.length > 0 && !selectedSources.includes(resource.source)) return false;
    if (tokens.length === 0) return true;
    const haystack = resourceText(resource);
    return tokens.every((token) => haystack.includes(token));
  });

  useEffect(() => {
    document.title = "待审组件 · ui-resource-lab";
  }, []);

  function setSources(next: Source[]) {
    const nextParams = new URLSearchParams(params);
    if (next.length > 0) nextParams.set("source", next.join(","));
    else nextParams.delete("source");
    setParams(nextParams, { replace: true });
  }

  function toggleSource(source: Source) {
    const next = selectedSources.includes(source)
      ? selectedSources.filter((s) => s !== source)
      : [...selectedSources, source];
    setSources(next);
  }

  return (
    <div className="rise-in">
      <section className="relative overflow-hidden rounded-3xl border border-line/90 bg-gradient-to-br from-[#fff6ef] via-[#f3ece1] to-[#ebe2d4] px-5 py-7 sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -top-12 right-0 size-44 rounded-full bg-copper/12 blur-3xl" />
        <p className="flex items-center gap-2 text-[11px] font-medium tracking-[0.18em] text-copper uppercase">
          <span className="inline-block h-px w-6 bg-copper/70" aria-hidden />
          Inbox · 组件采收
        </p>
        <h1 className="mt-3 font-serif text-[2.5rem] leading-[0.95] tracking-tight sm:text-5xl">待审组件</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          这里是从公开列表采下的组件条目（pending_review），不是库站总卡。v1 不能在页面上批准——人工确认后把文件移到
          data/resources 并改成 approved，才会进入平铺目录。
        </p>
        <p className="mt-2 text-sm tabular-nums text-ink/70">
          {inboxResources.length} 条待审 · 当前可见 {visible.length}
        </p>
      </section>

      <div className="mt-6 rounded-2xl border border-line/90 bg-white/65 p-3 shadow-[0_16px_36px_-28px_rgba(26,22,18,0.45)] backdrop-blur-sm sm:p-4">
        <label className="block">
          <span className="sr-only">搜索待审 Search inbox</span>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" aria-hidden>
              ⌕
            </span>
            <input
              value={q}
              onChange={(event) => {
                const next = new URLSearchParams(params);
                if (event.target.value) next.set("q", event.target.value);
                else next.delete("q");
                setParams(next, { replace: true });
              }}
              placeholder="搜索待审组件…"
              autoComplete="off"
              className="w-full rounded-xl border border-line bg-white/90 py-3 pr-4 pl-10 text-sm outline-none transition duration-200 ease-ui placeholder:text-muted/70 focus:border-copper/45 focus:ring-2 focus:ring-copper/15"
            />
          </div>
        </label>
        <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="来源筛选">
          <span className="mr-1 text-[10px] font-medium tracking-[0.14em] text-muted uppercase">来源 Source</span>
          {sources.map((source) => {
            const active = selectedSources.includes(source);
            const count = inboxResources.filter((r) => r.source === source).length;
            return (
              <button
                key={source}
                type="button"
                aria-pressed={active}
                onClick={() => toggleSource(source)}
                className={active ? "chip chip-active" : "chip"}
              >
                {sourceLabels[source].zh}
                <span className="count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-white/55 px-5 py-12 text-center">
          <p className="font-serif text-3xl">队列是空的</p>
          <p className="mt-2 text-sm text-muted">没有待审组件，或筛选无匹配。</p>
        </div>
      ) : (
        <div className="stagger mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {visible.map((resource) => (
            <div key={resource.id} className="rise-in h-full">
              <ResourceCard resource={resource} href={`/inbox/${resource.id}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
