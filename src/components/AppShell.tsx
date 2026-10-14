import { Link, Outlet, useLocation } from "react-router-dom";
import { inboxResources } from "../catalog.ts";

export function AppShell() {
  const { pathname } = useLocation();
  const catalogActive = pathname === "/" || pathname.startsWith("/r/");
  const inboxActive = pathname.startsWith("/inbox");

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line/90 bg-paper/80 backdrop-blur-md">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-copper/40 to-transparent" />
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-5 py-4 sm:py-5">
          <Link to="/" className="group text-inherit no-underline">
            <span className="flex items-center gap-2 text-[11px] font-medium tracking-[0.2em] text-copper">
              <span className="relative inline-flex size-3 items-center justify-center">
                <span className="absolute inset-0 rotate-45 rounded-[2px] bg-copper/25 transition duration-200 group-hover:rotate-[50deg]" />
                <span className="relative size-2 rotate-45 rounded-[1px] bg-copper" />
              </span>
              ui-resource-lab
            </span>
            <span className="mt-1.5 block font-serif text-[1.85rem] leading-none tracking-tight sm:text-3xl">
              界面资源索引
            </span>
          </Link>
          <nav className="flex items-center gap-1.5 rounded-full border border-line/90 bg-white/55 p-1 shadow-[0_10px_30px_-22px_rgba(26,22,18,0.7)]" aria-label="主菜单">
            <Link to="/" aria-current={catalogActive ? "page" : undefined} className={navClass(catalogActive)}>
              目录
              <span className="ml-1.5 hidden text-[11px] opacity-60 sm:inline">Catalog</span>
            </Link>
            <Link
              to="/inbox"
              aria-current={inboxActive ? "page" : undefined}
              className={navClass(inboxActive)}
            >
              待审
              <span className="ml-1.5 hidden text-[11px] opacity-60 sm:inline">Inbox</span>
              <span
                className={
                  inboxActive
                    ? "ml-1.5 rounded-full bg-paper/20 px-1.5 py-0.5 text-[11px] tabular-nums text-paper"
                    : "ml-1.5 rounded-full bg-copper-soft px-1.5 py-0.5 text-[11px] tabular-nums text-copper"
                }
              >
                {inboxResources.length}
              </span>
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto min-w-0 max-w-6xl px-5 py-8 sm:py-10">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-6xl border-t border-line/70 px-5 pt-6 pb-10 text-xs leading-5 text-muted">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-xl">
            目录只展示 approved。X 搜索命中留在 inbox，直到人工批准。规则见{" "}
            <span className="text-ink/70">docs/INGEST.md</span>。
          </p>
          <p className="max-w-sm text-[11px] leading-4 opacity-80">
            Approved only in catalog. X hits stay pending until a human moves them.
          </p>
        </div>
      </footer>
    </div>
  );
}

function navClass(active: boolean): string {
  return active
    ? "inline-flex items-center rounded-full bg-ink px-3.5 py-1.5 text-sm text-paper no-underline transition duration-200 ease-ui"
    : "inline-flex items-center rounded-full px-3.5 py-1.5 text-sm text-ink no-underline transition duration-200 ease-ui hover:bg-white/90";
}
