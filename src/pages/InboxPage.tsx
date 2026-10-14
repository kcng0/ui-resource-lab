import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { inboxResources } from "../catalog.ts";
import { DensityToggle } from "../components/DensityToggle.tsx";
import { ResourceCard } from "../components/ResourceCard.tsx";
import { densityGridClass, parseDensity, type DensityCols } from "../lib/density.ts";
import { sourceLabels } from "../labels.ts";
import { collectSources, resourceText } from "../query.ts";
import type { Source } from "../types.ts";

export function InboxPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const sourceParam = params.get("source") ?? "";
  const cols = parseDensity(params.get("cols"));
  const [picked, setPicked] = useState<Set<string>>(() => new Set());
  const [exportNote, setExportNote] = useState<string | null>(null);

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

  const visibleIds = useMemo(() => visible.map((r) => r.id), [visible]);
  const pickedVisibleCount = visibleIds.filter((id) => picked.has(id)).length;

  useEffect(() => {
    document.title = "待审 Inbox · ui-resource-lab";
  }, []);

  function patchParams(mutate: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(params);
    mutate(next);
    setParams(next, { replace: true });
  }

  function setSources(next: Source[]) {
    patchParams((p) => {
      if (next.length > 0) p.set("source", next.join(","));
      else p.delete("source");
    });
  }

  function toggleSource(source: Source) {
    const next = selectedSources.includes(source)
      ? selectedSources.filter((s) => s !== source)
      : [...selectedSources, source];
    setSources(next);
  }

  function setCols(next: DensityCols) {
    patchParams((p) => {
      if (next === 2) p.delete("cols");
      else p.set("cols", String(next));
    });
  }

  function togglePick(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectVisible() {
    setPicked((prev) => {
      const next = new Set(prev);
      for (const id of visibleIds) next.add(id);
      return next;
    });
  }

  function clearPicks() {
    setPicked(new Set());
    setExportNote(null);
  }

  function exportText(): string {
    return [...picked].sort().join("\n");
  }

  async function copyExport() {
    const text = exportText();
    if (!text) {
      setExportNote("还没勾选任何条目");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setExportNote(`已复制 ${picked.size} 个 id，发给 Research 即可 promote`);
    } catch {
      setExportNote("剪贴板失败，请改用下载");
    }
  }

  function downloadExport() {
    const text = exportText();
    if (!text) {
      setExportNote("还没勾选任何条目");
      return;
    }
    const blob = new Blob([text + "\n"], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inbox-approve-${picked.size}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setExportNote(`已下载 ${picked.size} 个 id`);
  }

  return (
    <div className="rise-in">
      <section className="relative overflow-hidden rounded-3xl border border-line/90 bg-gradient-to-br from-[#fff6ef] via-[#f3ece1] to-[#ebe2d4] px-5 py-7 sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -top-12 right-0 size-44 rounded-full bg-copper/12 blur-3xl" />
        <p className="flex items-center gap-2 text-[11px] font-medium tracking-[0.18em] text-copper uppercase">
          <span className="inline-block h-px w-6 bg-copper/70" aria-hidden />
          Inbox · 待审清单
        </p>
        <h1 className="mt-3 font-serif text-[2.5rem] leading-[0.95] tracking-tight sm:text-5xl">待审 Inbox</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Pages 是静态站，不能直接入库。勾选要通过的卡片，导出 id 发给 Research；本机再挪到 data/resources
          并改成 approved。
        </p>
        <p className="mt-2 text-sm tabular-nums text-ink/70">
          {inboxResources.length} 条待审 · 当前可见 {visible.length} · 已选 {picked.size}
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
                patchParams((p) => {
                  if (event.target.value) p.set("q", event.target.value);
                  else p.delete("q");
                });
              }}
              placeholder="搜索标题、笔记、来源…"
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
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line/70 pt-3">
          <DensityToggle value={cols} onChange={setCols} />
          <span className="hidden h-4 w-px bg-line sm:inline-block" aria-hidden />
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="chip" onClick={selectVisible}>
              全选可见 ({visible.length})
            </button>
            <button type="button" className="chip" onClick={clearPicks} disabled={picked.size === 0}>
              清空勾选
            </button>
            <button
              type="button"
              className="chip chip-active"
              onClick={() => void copyExport()}
              disabled={picked.size === 0}
            >
              复制已选 id
            </button>
            <button type="button" className="chip" onClick={downloadExport} disabled={picked.size === 0}>
              下载 .txt
            </button>
            {pickedVisibleCount > 0 && pickedVisibleCount < picked.size ? (
              <span className="text-xs text-muted">含筛选外已选 {picked.size - pickedVisibleCount}</span>
            ) : null}
          </div>
        </div>
        {exportNote ? <p className="mt-2 text-xs text-copper">{exportNote}</p> : null}
      </div>

      {visible.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-white/55 px-5 py-12 text-center">
          <p className="font-serif text-3xl">待审是空的</p>
          <p className="mt-2 text-sm text-muted">没有待审条目，或筛选无匹配。</p>
        </div>
      ) : (
        <div className={`stagger mt-6 ${densityGridClass(cols)}`}>
          {visible.map((resource) => {
            const checked = picked.has(resource.id);
            return (
              <div key={resource.id} className="rise-in relative h-full">
                <label className="absolute top-3 right-3 z-20 flex cursor-pointer items-center gap-1.5 rounded-full border border-white/60 bg-white/95 px-2.5 py-1 text-[11px] font-medium shadow-sm backdrop-blur">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePick(resource.id)}
                    className="size-3.5 accent-copper"
                  />
                  通过
                </label>
                <ResourceCard resource={resource} href={`/inbox/${resource.id}`} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
