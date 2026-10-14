export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export interface UsageBlock {
  type: "prose" | "code";
  text: string;
  lang?: string;
}

export function parseUsage(usage: string): UsageBlock[] {
  const chunks = usage.split("```");
  const blocks: UsageBlock[] = [];
  chunks.forEach((chunk, index) => {
    if (index % 2 === 0) {
      const text = chunk.trim();
      if (text) blocks.push({ type: "prose", text });
      return;
    }
    const newline = chunk.indexOf("\n");
    if (newline === -1) {
      blocks.push({ type: "code", lang: "", text: chunk.trim() });
      return;
    }
    blocks.push({
      type: "code",
      lang: chunk.slice(0, newline).trim(),
      text: chunk.slice(newline + 1).replace(/\n$/, ""),
    });
  });
  return blocks;
}
