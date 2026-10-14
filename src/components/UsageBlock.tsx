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
    <section className="overflow-hidden rounded-2xl border border-line/90 shadow-[0_20px_44px_-28px_rgba(26,22,18,0.5)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/80 bg-white/90 px-4 py-3 sm:px-5">
        <div>
          <p className="text-[11px] font-medium tracking-[0.16em] text-copper uppercase">Usage</p>
          <h2 className="mt-0.5 font-serif text-2xl leading-none sm:text-3xl">用法</h2>
        </div>
        <button
          type="button"
          onClick={() => {
            void onCopy();
          }}
          className={
            copied
              ? "rounded-full bg-sage px-4 py-2 text-sm text-paper transition duration-200 ease-ui"
              : "rounded-full bg-copper px-4 py-2 text-sm text-paper transition duration-200 ease-ui hover:bg-copper/90"
          }
        >
          {copied ? "已复制 · Copied" : "复制用法 · Copy"}
        </button>
      </div>
      <p role="status" className="sr-only">
        {copied ? "用法已复制到剪贴板" : ""}
      </p>
      <div className="space-y-0 bg-[#faf7f1]">
        {blocks.map((block, index) =>
          block.type === "code" ? (
            <div key={index} className="editor-chrome border-t border-white/5">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className="flex gap-1" aria-hidden>
                    <span className="size-2 rounded-full bg-[#e07a6a]/60" />
                    <span className="size-2 rounded-full bg-[#e0b85c]/60" />
                    <span className="size-2 rounded-full bg-[#7cbc7a]/60" />
                  </span>
                  {block.lang ? (
                    <span className="font-mono text-[11px] tracking-wider text-paper/55 uppercase">
                      {block.lang}
                    </span>
                  ) : (
                    <span className="font-mono text-[11px] text-paper/45">code</span>
                  )}
                </div>
              </div>
              <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[13px] leading-6 text-[#f0e6d8]">
                <code>{block.text}</code>
              </pre>
            </div>
          ) : (
            <p
              key={index}
              className="border-t border-line/50 px-4 py-3.5 text-sm leading-6 whitespace-pre-wrap text-ink/85 sm:px-5"
            >
              {block.text}
            </p>
          ),
        )}
      </div>
    </section>
  );
}
