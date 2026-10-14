import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { inboxResources } from "../catalog.ts";
import { ResourceCard } from "../components/ResourceCard.tsx";
import { resourceText } from "../query.ts";

export function InboxPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
  const visible = inboxResources.filter((resource) => {
    if (tokens.length === 0) return true;
    const haystack = resourceText(resource);
    return tokens.every((token) => haystack.includes(token));
  });

  useEffect(() => {
    document.title = "待审 · ui-resource-lab";
  }, []);

  return (
    <div className="rise-in">
      <section className="relative overflow-hidden rounded-3xl border border-line/90 bg-gradient-to-br from-[#fff6ef] via-[#f3ece1] to-[#ebe2d4] px-5 py-7 sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -top-12 right-0 size-44 rounded-full bg-copper/12 blur-3xl" />
        <p className="flex items-center gap-2 text-[11px] font-medium tracking-[0.18em] text-copper uppercase">
          <span className="inline-block h-px w-6 bg-copper/70" aria-hidden />
          Inbox · 待审
        </p>
        <h1 className="mt-3 font-serif text-[2.5rem] leading-[0.95] tracking-tight sm:text-5xl">待审队列</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          这里只读展示 pending_review。v1 不能在页面上批准。X 搜索命中应落在 data/inbox，人工确认后再把文件移到
          data/resources 并改成 approved。
        </p>
      </section>

      <label className="mt-6 block max-w-xl">
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
            placeholder="搜索待审条目…"
            autoComplete="off"
            className="w-full rounded-xl border border-line bg-white/90 py-3 pr-4 pl-10 text-sm outline-none transition duration-200 ease-ui placeholder:text-muted/70 focus:border-copper/45 focus:ring-2 focus:ring-copper/15"
          />
        </div>
      </label>

      {visible.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-white/55 px-5 py-12 text-center">
          <p className="font-serif text-3xl">队列是空的</p>
          <p className="mt-2 text-sm text-muted">没有待审记录，或搜索无匹配。</p>
        </div>
      ) : (
        <div className="stagger mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
