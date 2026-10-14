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
    <article className="rise-in">
      <Link
        to={backTo}
        className="inline-flex items-center gap-1.5 rounded-full border border-line/80 bg-white/70 px-3 py-1.5 text-sm text-copper no-underline transition duration-200 ease-ui hover:border-copper/35 hover:bg-copper-soft/50"
      >
        <span aria-hidden>←</span>
        {queue ? "返回待审" : "返回目录"}
      </Link>

      <header className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={resource.status} />
            <KindBadge kind={resource.kind} />
            <LicenseBadge license={resource.license} />
          </div>
          <h1 className="mt-4 font-serif text-[2.75rem] leading-[0.95] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            {resource.title}
          </h1>
          <p className="mt-3 text-xs text-muted">
            更新于 <time dateTime={resource.updated_at}>{formatDate(resource.updated_at)}</time>
          </p>
          <p className="mt-4">
            <a
              href={resource.source_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm text-paper no-underline transition duration-200 ease-ui hover:bg-ink/90"
            >
              打开来源
              <span aria-hidden>↗</span>
            </a>
          </p>
        </div>
        <div className="rounded-2xl border border-line/90 bg-white/70 p-4 shadow-[0_16px_36px_-28px_rgba(26,22,18,0.45)]">
          <p className="text-[10px] font-medium tracking-[0.16em] text-muted uppercase">快速标签</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {resource.vibe.map((slug) => (
              <span key={`v-${slug}`} className="rounded-full bg-copper-soft px-2.5 py-1 text-xs text-copper">
                {axisValueLabel("vibe", slug)}
              </span>
            ))}
            {resource.scene.map((slug) => (
              <span key={`s-${slug}`} className="rounded-full bg-sage-soft px-2.5 py-1 text-xs text-sage">
                {axisValueLabel("scene", slug)}
              </span>
            ))}
            {resource.stack.map((slug) => (
              <span key={`t-${slug}`} className="rounded-full border border-line bg-paper px-2.5 py-1 text-xs text-muted">
                {stackLabel(slug)}
              </span>
            ))}
          </div>
        </div>
      </header>

      {resource.status === "pending_review" ? (
        <p className="mt-5 rounded-2xl border border-copper/30 bg-copper-soft px-4 py-3 text-sm leading-6 text-copper">
          这条还在待审，不会出现在目录里。批准前请人工确认来源。X 命中保持 pending_review，直到你把它移到
          data/resources 并改成 approved。
        </p>
      ) : null}

      <div className="mt-8">
        <PreviewFrame resource={resource} />
      </div>

      <div className="mt-8">
        <UsageBlock usage={resource.usage} />
      </div>

      <section className="mt-8 overflow-hidden rounded-2xl border border-line/90 bg-white/80 shadow-[0_16px_36px_-28px_rgba(26,22,18,0.4)]">
        <div className="border-b border-line/70 bg-gradient-to-r from-paper to-white/40 px-4 py-3 sm:px-5">
          <p className="text-[11px] font-medium tracking-[0.16em] text-copper uppercase">Notes</p>
          <h2 className="mt-0.5 font-serif text-2xl leading-none sm:text-3xl">笔记</h2>
        </div>
        <p className="px-4 py-4 text-sm leading-7 whitespace-pre-wrap text-ink/85 sm:px-5">{resource.notes}</p>
      </section>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        <MetaList title="气质 Vibe" values={resource.vibe.map((slug) => axisValueLabel("vibe", slug))} tone="copper" />
        <MetaList title="场景 Scene" values={resource.scene.map((slug) => axisValueLabel("scene", slug))} tone="sage" />
        <MetaList title="技术栈 Stack" values={resource.stack.map((slug) => stackLabel(slug))} />
        <div className="rounded-2xl border border-line/90 bg-white/75 p-4">
          <dt className="text-[10px] font-medium tracking-[0.14em] text-muted uppercase">来源 Source</dt>
          <dd className="mt-2 break-all">
            <a href={resource.source_url} target="_blank" rel="noreferrer" className="text-sm text-copper">
              {resource.source_url}
            </a>
          </dd>
        </div>
      </dl>

      {resource.x_meta ? (
        <section className="mt-4 rounded-2xl border border-line/90 bg-white/70 p-4">
          <h2 className="text-[10px] font-medium tracking-[0.14em] text-muted uppercase">推文信息 x_meta</h2>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">作者 Author</dt>
              <dd>{resource.x_meta.author}</dd>
            </div>
            <div>
              <dt className="text-muted">post_id</dt>
              <dd className="font-mono text-xs">{resource.x_meta.post_id}</dd>
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

function MetaList({
  title,
  values,
  tone,
}: {
  title: string;
  values: string[];
  tone?: "copper" | "sage";
}) {
  const chip =
    tone === "copper"
      ? "rounded-full bg-copper-soft px-2.5 py-0.5 text-sm text-copper"
      : tone === "sage"
        ? "rounded-full bg-sage-soft px-2.5 py-0.5 text-sm text-sage"
        : "rounded-full bg-paper px-2.5 py-0.5 text-sm text-ink";

  return (
    <div className="rounded-2xl border border-line/90 bg-white/75 p-4">
      <dt className="text-[10px] font-medium tracking-[0.14em] text-muted uppercase">{title}</dt>
      <dd className="mt-2 flex flex-wrap gap-1.5">
        {values.length === 0 ? (
          <span className="text-sm text-muted">—</span>
        ) : (
          values.map((value) => (
            <span key={value} className={chip}>
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
    <div className="rounded-2xl border border-dashed border-line bg-white/55 px-5 py-12">
      <h1 className="font-serif text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-muted">{body}</p>
      <Link to={to} className="mt-4 inline-block text-sm text-copper">
        {label}
      </Link>
    </div>
  );
}
