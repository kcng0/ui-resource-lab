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
    <div>
      <p className="text-[11px] font-medium tracking-[0.16em] text-copper uppercase">Inbox</p>
      <h1 className="mt-2 font-serif text-4xl leading-none tracking-tight sm:text-5xl">待审队列</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        这里只读展示 pending_review。v1 不能在页面上批准。X 搜索命中应落在 data/inbox，人工确认后再把文件移到
        data/resources 并改成 approved。This queue is read-only. Approval is a file move, not a button.
      </p>
      <label className="mt-6 block max-w-xl">
        <span className="sr-only">搜索待审 Search inbox</span>
        <input
          value={q}
          onChange={(event) => {
            const next = new URLSearchParams(params);
            if (event.target.value) next.set("q", event.target.value);
            else next.delete("q");
            setParams(next, { replace: true });
          }}
          placeholder="搜索待审条目… Search the queue"
          autoComplete="off"
          className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm outline-none placeholder:text-muted/80"
        />
      </label>
      {visible.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-white/50 px-5 py-10 text-center">
          <p className="font-serif text-3xl">队列是空的</p>
          <p className="mt-2 text-sm text-muted">No pending records match.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} href={`/inbox/${resource.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
