import { useState } from "react";
import { parseUsage } from "../format.ts";

export function UsageBlock({ usage }: { usage: string }) {
  const [copied, setCopied] = useState(false);
  const blocks = parseUsage(usage);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(usage);
    } catch {
      const area = document.createElement("textarea");
      area.value = usage;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section className="rounded-2xl border border-line bg-white/75 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-3xl leading-none">用法 Usage</h2>
        <button
          type="button"
          onClick={() => {
            void onCopy();
          }}
          className="rounded-full bg-copper px-4 py-2 text-sm text-paper"
        >
          {copied ? "已复制 Copied" : "复制用法 Copy usage"}
        </button>
      </div>
      <p role="status" className="sr-only">
        {copied ? "用法已复制到剪贴板" : ""}
      </p>
      <div className="mt-4 space-y-3">
        {blocks.map((block, index) =>
          block.type === "code" ? (
            <div key={index} className="overflow-hidden rounded-xl bg-ink text-paper">
              {block.lang ? (
                <div className="px-4 pt-3 text-[11px] tracking-[0.14em] text-paper/60 uppercase">
                  {block.lang}
                </div>
              ) : null}
              <pre className="overflow-x-auto px-4 py-3 text-[13px] leading-6">
                <code>{block.text}</code>
              </pre>
            </div>
          ) : (
            <p key={index} className="text-sm leading-6 whitespace-pre-wrap text-ink/85">
              {block.text}
            </p>
          ),
        )}
      </div>
    </section>
  );
}
