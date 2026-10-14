import { useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { findApproved, findInbox } from "../catalog.ts";
import { KindBadge, LicenseBadge, StatusBadge } from "../components/Badges.tsx";
import { PreviewFrame } from "../components/PreviewFrame.tsx";
import { UsageBlock } from "../components/UsageBlock.tsx";
import { formatDate } from "../format.ts";
import { axisValueLabel, stackLabel } from "../labels.ts";
import { readReturnSearch } from "../query.ts";

export function DetailPage({ queue = false }: { queue?: boolean }) {
  const params = useParams();
  const location = useLocation();
  const resource = params.id ? (queue ? findInbox(params.id) : findApproved(params.id)) : undefined;
  const backSearch = readReturnSearch(location.state);
  const backTo = queue
    ? backSearch
      ? `/inbox?${backSearch}`
      : "/inbox"
    : backSearch
      ? `/?${backSearch}`
      : "/";

  useEffect(() => {
    document.title = resource ? `${resource.title} · ui-resource-lab` : "没有这一条 · ui-resource-lab";
  }, [resource]);

  if (!resource) {
    return (
      <NotFound
        title="没有这一条"
        body={queue ? "待审队列里没有这个 id。" : "目录里没有这个 id。"}
        to={queue ? "/inbox" : "/"}
        label={queue ? "返回待审" : "返回目录"}
      />
    );
  }

  return (
    <article>
      <Link to={backTo} className="text-sm text-copper no-underline">
        {queue ? "← 返回待审 Back to inbox" : "← 返回目录 Back to catalog"}
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={resource.status} />
        <KindBadge kind={resource.kind} />
        <LicenseBadge license={resource.license} />
      </div>
      <h1 className="mt-3 font-serif text-5xl leading-none tracking-tight">{resource.title}</h1>
      <p className="mt-3 text-xs text-muted">更新于 {formatDate(resource.updated_at)}</p>

      {resource.status === "pending_review" ? (
        <p className="mt-4 rounded-2xl border border-copper/30 bg-copper-soft px-4 py-3 text-sm leading-6 text-copper">
          这条还在待审，不会出现在目录里。批准前请人工确认来源。X 命中保持 pending_review，直到你把它移到
          data/resources 并改成 approved。This item is not in the catalog yet.
        </p>
      ) : null}

      <div className="mt-6">
        <PreviewFrame resource={resource} />
      </div>

      <p className="mt-4">
        <a
          href={resource.source_url}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-copper"
        >
          打开来源 Open source ↗
        </a>
      </p>

      <div className="mt-6">
        <UsageBlock usage={resource.usage} />
      </div>

      <section className="mt-6 rounded-2xl border border-line bg-white/75 p-4 sm:p-5">
        <h2 className="font-serif text-3xl leading-none">笔记 Notes</h2>
        <p className="mt-3 text-sm leading-6 whitespace-pre-wrap text-ink/85">{resource.notes}</p>
      </section>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <MetaList title="气质 Vibe" values={resource.vibe.map((slug) => axisValueLabel("vibe", slug))} />
        <MetaList title="场景 Scene" values={resource.scene.map((slug) => axisValueLabel("scene", slug))} />
        <MetaList title="技术栈 Stack" values={resource.stack.map((slug) => stackLabel(slug))} />
        <div className="rounded-2xl border border-line bg-white/60 p-4">
          <dt className="text-xs tracking-[0.14em] text-muted uppercase">来源 Source</dt>
          <dd className="mt-2 text-sm break-all">{resource.source_url}</dd>
        </div>
      </dl>

      {resource.x_meta ? (
        <section className="mt-4 rounded-2xl border border-line bg-white/60 p-4">
          <h2 className="text-xs tracking-[0.14em] text-muted uppercase">x_meta</h2>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">作者 Author</dt>
              <dd>{resource.x_meta.author}</dd>
            </div>
            <div>
              <dt className="text-muted">post_id</dt>
              <dd>{resource.x_meta.post_id}</dd>
            </div>
            <div>
              <dt className="text-muted">语言 Lang</dt>
              <dd>{resource.x_meta.lang}</dd>
            </div>
            <div>
              <dt className="text-muted">检索时间 Queried</dt>
              <dd>{resource.x_meta.queried_at}</dd>
            </div>
          </dl>
        </section>
      ) : null}
    </article>
  );
}

function MetaList({ title, values }: { title: string; values: string[] }) {
  return (
    <div className="rounded-2xl border border-line bg-white/60 p-4">
      <dt className="text-xs tracking-[0.14em] text-muted uppercase">{title}</dt>
      <dd className="mt-2 flex flex-wrap gap-1.5">
        {values.length === 0 ? (
          <span className="text-sm text-muted">—</span>
        ) : (
          values.map((value) => (
            <span key={value} className="rounded-full bg-paper px-2 py-0.5 text-sm">
              {value}
            </span>
          ))
        )}
      </dd>
    </div>
  );
}

export function NotFoundPage() {
  return <NotFound title="没有这一页" body="这个路径不在目录里。" to="/" label="返回目录" />;
}

function NotFound({
  title,
  body,
  to,
  label,
}: {
  title: string;
  body: string;
  to: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white/50 px-5 py-12">
      <h1 className="font-serif text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-muted">{body}</p>
      <Link to={to} className="mt-4 inline-block text-sm text-copper">
        {label}
      </Link>
    </div>
  );
}
