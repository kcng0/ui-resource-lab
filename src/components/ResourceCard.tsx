import { Link, useSearchParams } from "react-router-dom";
import { stackLabel } from "../labels.ts";
import type { Resource } from "../types.ts";
import { KindBadge, LicenseBadge, StatusBadge } from "./Badges.tsx";

export function ResourceCard({
  resource,
  href,
}: {
  resource: Resource;
  href: string;
}) {
  const [params] = useSearchParams();
  const screenshot = resource.preview.screenshot;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white/80 shadow-[0_16px_40px_-28px_rgba(28,25,21,0.7)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-24px_rgba(28,25,21,0.55)]">
      <Link
        to={href}
        state={{ from: params.toString() }}
        className="flex h-full flex-col text-inherit no-underline"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-paper-deep">
          {screenshot ? (
            <img
              src={screenshot}
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-serif text-5xl text-copper">
              {resource.title.slice(0, 1)}
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <KindBadge kind={resource.kind} />
            <LicenseBadge license={resource.license} />
          </div>
          <h2 className="font-serif text-[1.7rem] leading-none tracking-tight">{resource.title}</h2>
          <p className="line-clamp-3 text-sm leading-6 text-muted">{resource.notes}</p>
          <div className="mt-auto flex flex-wrap items-center gap-1.5">
            {resource.status === "pending_review" ? <StatusBadge status={resource.status} /> : null}
            {resource.stack.map((stack) => (
              <span key={stack} className="rounded-md bg-paper px-1.5 py-0.5 text-xs text-muted">
                {stackLabel(stack)}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </article>
  );
}
