import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { approvedResources } from "../catalog.ts";
import { ResourceCard } from "../components/ResourceCard.tsx";
import { axisValueLabel, licenseLabels, sourceLabels, stackLabel } from "../labels.ts";
import {
  collectSources,
  collectStacks,
  countValues,
  matchesQuery,
  parseBrowseQuery,
  writeBrowseQuery,
} from "../query.ts";
import type { BrowseQuery, License, Source } from "../types.ts";

const licenseOptions: Array<License | null> = [null, "free", "pro", "mixed"];

/** Catalog base set: approved components only (legacy library cards stay out of the grid). */
const componentCatalog = approvedResources.filter((resource) => resource.kind === "component");

export function BrowsePage() {
  const [params, setParams] = useSearchParams();
  const query = parseBrowseQuery(params);

  useEffect(() => {
    document.title = "组件目录 · ui-resource-lab";
  }, []);

  function update(next: BrowseQuery) {
    setParams(writeBrowseQuery(next), { replace: true });
  }

  const forCategories = componentCatalog.filter((resource) =>
    matchesQuery(resource, { ...query, category: null }),
  );
  const forStacks = componentCatalog.filter((resource) =>
    matchesQuery(resource, { ...query, stacks: [] }),
  );
  const forLicenses = componentCatalog.filter((resource) =>
    matchesQuery(resource, { ...query, license: null }),
  );
  const forSources = componentCatalog.filter((resource) =>
    matchesQuery(resource, { ...query, sources: [] }),
  );
  const visible = componentCatalog.filter((resource) => matchesQuery(resource, query));

  const counts = countValues(forCategories, query.axis);
  if (query.category && !counts.has(query.category)) counts.set(query.category, 0);
  const categories = [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "en"),
  );
  const stacks = collectStacks(componentCatalog);
  const stackCounts = new Map<string, number>();
  for (const resource of forStacks) {
    for (const stack of resource.stack) {
      stackCounts.set(stack, (stackCounts.get(stack) ?? 0) + 1);
    }
  }
  const sources = collectSources(componentCatalog);
  const sourceCounts = new Map<Source, number>();
  for (const resource of forSources) {
    sourceCounts.set(resource.source, (sourceCounts.get(resource.source) ?? 0) + 1);
  }

  const filtered =
    query.category !== null ||
    query.q.trim() !== "" ||
    query.license !== null ||
    query.stacks.length > 0 ||
    query.sources.length > 0;

  const noApprovedComponents = componentCatalog.length === 0;

  return (
    <div className="rise-in">
      <section className="relative overflow-hidden rounded-3xl border border-line/90 bg-gradient-to-br from-[#fffaf3] via-[#f3ece1] to-[#e8dfd0] px-5 py-7 shadow-[0_24px_50px_-30px_rgba(26,22,18,0.45)] sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-copper/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-10 size-48 rounded-full bg-sage/10 blur-3xl" />
        <div className="pointer-events-none absolute top-6 right-8 hidden rotate-12 font-serif text-7xl text-ink/[0.04] select-none sm:block">
          件
        </div>
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-[11px] font-medium tracking-[0.18em] text-copper uppercase">
              <span className="inline-block h-px w-6 bg-copper/70" aria-hidden />
              Components · 平铺组件
            </p>
            <h1 className="mt-3 font-serif text-[2.6rem] leading-[0.95] tracking-tight sm:text-5xl lg:text-[3.35rem]">
              平铺每一个组件
              <span className="mt-1 block text-copper">来源只做筛选</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted sm:text-[15px]">
              主列表是已批准的 UI 组件，不是组件库卡片。气质 vibe 与场景 scene 是浏览主轴；来源、技术栈、许可只作筛选标签。
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col lg:items-end">
            <StatPill label="已收录组件" value={String(componentCatalog.length)} />
            <StatPill label="当前可见" value={String(visible.length)} accent />
          </div>
        </div>
      </section>

      <div className="mt-8 grid w-full min-w-0 gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-line/90 bg-white/70 p-3 shadow-[0_16px_36px_-28px_rgba(26,22,18,0.55)] backdrop-blur-sm">
            <p className="px-1 pb-2 text-[10px] font-medium tracking-[0.16em] text-muted uppercase">
              浏览轴 Axis
            </p>
            <div className="flex gap-1 rounded-full border border-line bg-paper/80 p-1" role="group" aria-label="浏览轴">
              <AxisButton
                active={query.axis === "vibe"}
                onClick={() => update({ ...query, axis: "vibe", category: null })}
              >
                气质 Vibe
              </AxisButton>
              <AxisButton
                active={query.axis === "scene"}
                onClick={() => update({ ...query, axis: "scene", category: null })}
              >
                场景 Scene
              </AxisButton>
            </div>
            <div
              className="mt-3 flex w-full gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible"
              role="group"
              aria-label="分类"
            >
              <CategoryButton
                active={query.category === null}
                count={forCategories.length}
                onClick={() => update({ ...query, category: null })}
              >
                全部 All
              </CategoryButton>
              {categories.map(([slug, count]) => (
                <CategoryButton
                  key={slug}
                  active={query.category === slug}
                  count={count}
                  onClick={() => update({ ...query, category: slug })}
                >
                  {axisValueLabel(query.axis, slug)}
                </CategoryButton>
              ))}
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="rounded-2xl border border-line/90 bg-white/65 p-3 shadow-[0_16px_36px_-28px_rgba(26,22,18,0.45)] backdrop-blur-sm sm:p-4">
            <label className="block">
              <span className="sr-only">搜索 Search</span>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" aria-hidden>
                  ⌕
                </span>
                <input
                  id="catalog-search"
                  value={query.q}
                  onChange={(event) => update({ ...query, q: event.target.value })}
                  placeholder="搜索组件名、笔记、来源、技术栈…"
                  autoComplete="off"
                  className="w-full rounded-xl border border-line bg-white/90 py-3 pr-4 pl-10 text-sm outline-none transition duration-200 ease-ui placeholder:text-muted/70 focus:border-copper/45 focus:ring-2 focus:ring-copper/15"
                />
              </div>
            </label>
            <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="来源">
              <span className="mr-1 text-[10px] font-medium tracking-[0.14em] text-muted uppercase">来源 Source</span>
              {sources.length === 0 ? (
                <span className="text-xs text-muted">暂无来源标签</span>
              ) : (
                sources.map((source) => {
                  const active = query.sources.includes(source);
                  return (
                    <button
                      key={source}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleSource(query, source, update)}
                      className={active ? "chip chip-active" : "chip"}
                    >
                      {sourceLabels[source].zh}
                      <span className="count">{sourceCounts.get(source) ?? 0}</span>
                    </button>
                  );
                })
              )}
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2" role="radiogroup" aria-label="许可">
              <span className="mr-1 text-[10px] font-medium tracking-[0.14em] text-muted uppercase">许可</span>
              {licenseOptions.map((license) => {
                const active = query.license === license;
                const count =
                  license === null
                    ? forLicenses.length
                    : forLicenses.filter((resource) => resource.license === license).length;
                const label = license ? `${licenseLabels[license].zh}` : "全部";
                return (
                  <button
                    key={license ?? "all"}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => update({ ...query, license })}
                    className={active ? "chip chip-active" : "chip"}
                  >
                    {label}
                    <span className="count">{count}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2" role="group" aria-label="技术栈">
              <span className="mr-1 text-[10px] font-medium tracking-[0.14em] text-muted uppercase">技术栈</span>
              {stacks.map((stack) => {
                const active = query.stacks.includes(stack);
                return (
                  <button
                    key={stack}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleStack(query, stack, update)}
                    className={active ? "chip chip-active" : "chip"}
                  >
                    {stackLabel(stack)}
                    <span className="count">{stackCounts.get(stack) ?? 0}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 text-sm text-muted">
            <p className="font-medium text-ink/80">
              <span className="tabular-nums text-ink">{visible.length}</span> 个组件
              {query.category ? (
                <span className="text-muted"> · {axisValueLabel(query.axis, query.category)}</span>
              ) : null}
              {query.sources.length > 0 ? (
                <span className="text-muted">
                  {" "}
                  · {query.sources.map((s) => sourceLabels[s].zh).join(" / ")}
                </span>
              ) : null}
            </p>
            {filtered ? (
              <button
                type="button"
                onClick={() =>
                  update({ ...query, category: null, q: "", license: null, stacks: [], sources: [] })
                }
                className="rounded-full border border-copper/30 bg-copper-soft/60 px-3 py-1 text-copper transition duration-200 ease-ui hover:bg-copper-soft"
              >
                清除筛选
              </button>
            ) : null}
          </div>

          {noApprovedComponents ? (
            <div className="mt-6 rounded-2xl border border-dashed border-line bg-white/55 px-5 py-12 text-center">
              <p className="font-serif text-3xl">还没有已批准组件</p>
              <p className="mt-2 text-sm text-muted">
                去{" "}
                <Link to="/inbox" className="text-copper underline-offset-2 hover:underline">
                  待审 Inbox
                </Link>{" "}
                勾选通过后，组件会出现在这里。
              </p>
            </div>
          ) : visible.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-line bg-white/55 px-5 py-12 text-center">
              <p className="font-serif text-3xl">没有符合的组件</p>
              <p className="mt-2 text-sm text-muted">换个气质、来源或场景，或清掉筛选再试。</p>
            </div>
          ) : (
            <div className="stagger mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {visible.map((resource) => (
                <div key={resource.id} className="rise-in h-full">
                  <ResourceCard resource={resource} href={`/r/${resource.id}`} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={
        accent
          ? "inline-flex items-baseline gap-2 rounded-2xl border border-copper/25 bg-copper-soft/70 px-3.5 py-2"
          : "inline-flex items-baseline gap-2 rounded-2xl border border-line/80 bg-white/70 px-3.5 py-2"
      }
    >
      <span className="font-serif text-2xl leading-none tabular-nums tracking-tight text-ink">{value}</span>
      <span className="text-[11px] text-muted">{label}</span>
    </div>
  );
}

function toggleStack(
  query: BrowseQuery,
  stack: string,
  update: (next: BrowseQuery) => void,
) {
  const stacks = query.stacks.includes(stack)
    ? query.stacks.filter((item) => item !== stack)
    : [...query.stacks, stack];
  update({ ...query, stacks });
}

function toggleSource(
  query: BrowseQuery,
  source: Source,
  update: (next: BrowseQuery) => void,
) {
  const sources = query.sources.includes(source)
    ? query.sources.filter((item) => item !== source)
    : [...query.sources, source];
  update({ ...query, sources });
}

function AxisButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={
        active
          ? "flex-1 rounded-full bg-ink px-3 py-1.5 text-sm text-paper transition duration-200 ease-ui"
          : "flex-1 rounded-full px-3 py-1.5 text-sm text-ink transition duration-200 ease-ui hover:bg-white/80"
      }
    >
      {children}
    </button>
  );
}

function CategoryButton({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean;
  count: number;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={
        active
          ? "flex shrink-0 items-center justify-between gap-3 rounded-xl border border-copper/20 bg-copper-soft px-3 py-2.5 text-left text-sm text-copper transition duration-200 ease-ui lg:w-full"
          : "flex shrink-0 items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm text-ink transition duration-200 ease-ui hover:border-line hover:bg-white/80 lg:w-full"
      }
    >
      <span className="truncate">{children}</span>
      <span className="tabular-nums text-xs text-muted">{count}</span>
    </button>
  );
}
