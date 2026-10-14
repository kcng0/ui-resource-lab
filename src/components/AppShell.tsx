import { Link, Outlet, useLocation } from "react-router-dom";
import { inboxResources } from "../catalog.ts";

export function AppShell() {
  const { pathname } = useLocation();
  const catalogActive = pathname === "/" || pathname.startsWith("/r/");
  const inboxActive = pathname.startsWith("/inbox");

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-line/80 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-5 py-4">
          <Link to="/" className="text-inherit no-underline">
            <span className="flex items-center gap-2 text-[11px] font-medium tracking-[0.18em] text-copper">
              <span className="inline-block size-2.5 rounded-[2px] bg-copper" />
              ui-resource-lab
            </span>
            <span className="mt-1 block font-serif text-3xl leading-none tracking-tight">
              界面资源索引
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-sm" aria-label="主菜单">
            <Link to="/" aria-current={catalogActive ? "page" : undefined} className={navClass(catalogActive)}>
              目录 Catalog
            </Link>
            <Link
              to="/inbox"
              aria-current={inboxActive ? "page" : undefined}
              className={navClass(inboxActive)}
            >
              待审 Inbox
              <span className="ml-1.5 rounded-full bg-copper-soft px-1.5 py-0.5 text-[11px] text-copper">
                {inboxResources.length}
              </span>
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto min-w-0 max-w-6xl px-5 py-8">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-6xl px-5 pb-10 text-xs leading-5 text-muted">
        目录只展示 approved。X 搜索命中留在 inbox，直到人工批准。规则见 docs/INGEST.md。
        The catalog shows approved records only. X search hits stay in the inbox until a human
        approves them.
      </footer>
    </div>
  );
}

function navClass(active: boolean): string {
  return active
    ? "rounded-full bg-ink px-3 py-1.5 text-paper no-underline"
    : "rounded-full px-3 py-1.5 text-ink no-underline hover:bg-white/80";
}
