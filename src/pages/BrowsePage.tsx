import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { approvedResources } from "../catalog.ts";
import { ResourceCard } from "../components/ResourceCard.tsx";
import { axisValueLabel, licenseLabels, stackLabel } from "../labels.ts";
import { collectStacks, countValues, matchesQuery, parseBrowseQuery, writeBrowseQuery } from "../query.ts";
import type { BrowseQuery, License } from "../types.ts";

const licenseOptions: Array<License | null> = [null, "free", "pro", "mixed"];

export function BrowsePage() {
  const [params, setParams] = useSearchParams();
  const query = parseBrowseQuery(params);

  useEffect(() => {
    document.title = "目录 · ui-resource-lab";
  }, []);

  function update(next: BrowseQuery) {
    setParams(writeBrowseQuery(next), { replace: true });
  }

  const forCategories = approvedResources.filter((resource) =>
    matchesQuery(resource, { ...query, category: null }),
  );
  const forStacks = approvedResources.filter((resource) =>
    matchesQuery(resource, { ...query, stacks: [] }),
  );
  const forLicenses = approvedResources.filter((resource) =>
    matchesQuery(resource, { ...query, license: null }),
  );
  const visible = approvedResources.filter((resource) => matchesQuery(resource, query));

  const counts = countValues(forCategories, query.axis);
  if (query.category && !counts.has(query.category)) counts.set(query.category, 0);
  const categories = [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "en"),
  );
  const stacks = collectStacks(approvedResources);
  const stackCounts = new Map<string, number>();
  for (const resource of forStacks) {
    for (const stack of resource.stack) {
      stackCounts.set(stack, (stackCounts.get(stack) ?? 0) + 1);
    }
  }
  const filtered =
    query.category !== null || query.q.trim() !== "" || query.license !== null || query.stacks.length > 0;

  return (
    <div>
      <p className="text-[11px] font-medium tracking-[0.16em] text-copper uppercase">Catalog</p>
      <h1 className="mt-2 font-serif text-4xl leading-none tracking-tight sm:text-5xl">
        按气质与场景浏览
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        主轴是气质 vibe 与场景 scene。技术栈和许可是筛选项。示例条目是手写占位，不是爬虫结果。
        Browse on vibe and scene. Stack and license only filter. Seed records are hand-written
        examples, not a crawl.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex gap-1 rounded-full border border-line bg-white/70 p-1" role="group" aria-label="浏览轴">
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
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible" role="group" aria-label="分类">
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
        </aside>

        <div>
          <div className="flex flex-col gap-3">
            <label className="block">
              <span className="sr-only">搜索 Search</span>
              <input
                id="catalog-search"
                value={query.q}
                onChange={(event) => update({ ...query, q: event.target.value })}
                placeholder="搜索标题、笔记、技术栈、气质… Search title, notes, stack, vibe"
                autoComplete="off"
                className="w-full rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm outline-none placeholder:text-muted/80"
              />
            </label>
            <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="许可">
              {licenseOptions.map((license) => {
                const active = query.license === license;
                const count =
                  license === null
                    ? forLicenses.length
                    : forLicenses.filter((resource) => resource.license === license).length;
                const label = license ? `${licenseLabels[license].zh} ${licenseLabels[license].en}` : "全部 All";
                return (
                  <button
                    key={license ?? "all"}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => update({ ...query, license })}
                    className={chipClass(active)}
                  >
                    {label}
                    <span className="ml-1 text-muted">{count}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="技术栈">
              {stacks.map((stack) => {
                const active = query.stacks.includes(stack);
                return (
                  <button
                    key={stack}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleStack(query, stack, update)}
                    className={chipClass(active)}
                  >
                    {stackLabel(stack)}
                    <span className="ml-1 text-muted">{stackCounts.get(stack) ?? 0}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 text-sm text-muted">
            <p>
              {visible.length} 条
              {query.category ? ` · ${axisValueLabel(query.axis, query.category)}` : ""}
            </p>
            {filtered ? (
              <button
                type="button"
                onClick={() => update({ ...query, category: null, q: "", license: null, stacks: [] })}
                className="text-copper"
              >
                清除筛选 Clear
              </button>
            ) : null}
          </div>

          {visible.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-line bg-white/50 px-5 py-10 text-center">
              <p className="font-serif text-3xl">没有符合的条目</p>
              <p className="mt-2 text-sm text-muted">No resources match these filters.</p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} href={`/r/${resource.id}`} />
              ))}
            </div>
          )}
        </div>
      </div>
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
          ? "flex-1 rounded-full bg-ink px-3 py-1.5 text-sm text-paper"
          : "flex-1 rounded-full px-3 py-1.5 text-sm text-ink"
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
          ? "flex shrink-0 items-center justify-between gap-3 rounded-xl bg-copper-soft px-3 py-2 text-left text-sm text-copper lg:w-full"
          : "flex shrink-0 items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm text-ink hover:bg-white/70 lg:w-full"
      }
    >
      <span>{children}</span>
      <span className="text-xs text-muted">{count}</span>
    </button>
  );
}

function chipClass(active: boolean): string {
  return active
    ? "rounded-full bg-ink px-3 py-1.5 text-sm text-paper"
    : "rounded-full border border-line bg-white/70 px-3 py-1.5 text-sm text-ink";
}
