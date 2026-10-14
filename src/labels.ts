import type { Axis, Kind, License } from "./types.ts";

export const vibeLabels: Record<string, string> = {
  minimal: "极简",
  editorial: "编辑感",
  playful: "活泼",
  technical: "技术感",
  luxury: "精致",
  soft: "柔和",
  brutalist: "粗野",
  cinematic: "电影感",
};

export const sceneLabels: Record<string, string> = {
  landing: "落地页",
  dashboard: "仪表盘",
  marketing: "营销",
  docs: "文档",
  auth: "登录注册",
  commerce: "电商",
  portfolio: "作品集",
  "app-shell": "应用壳",
};

const stackLabels: Record<string, string> = {
  react: "React",
  vue: "Vue",
  tailwind: "Tailwind",
  typescript: "TypeScript",
  css: "CSS",
  html: "HTML",
  motion: "Motion",
  next: "Next.js",
  radix: "Radix",
};

export const kindLabels: Record<Kind, { zh: string; en: string }> = {
  component_library: { zh: "组件库", en: "Library" },
  showcase: { zh: "陈列", en: "Showcase" },
  open_source: { zh: "开源", en: "Open source" },
  tweet: { zh: "推文", en: "Tweet" },
};

export const licenseLabels: Record<License, { zh: string; en: string }> = {
  free: { zh: "免费", en: "Free" },
  pro: { zh: "付费", en: "Pro" },
  mixed: { zh: "混合", en: "Mixed" },
};

export const licenseTone: Record<License, string> = {
  free: "bg-sage-soft text-sage",
  pro: "bg-pro-soft text-pro",
  mixed: "bg-copper-soft text-copper",
};

export function stackLabel(slug: string): string {
  return stackLabels[slug] ?? slug;
}

export function axisValueLabel(axis: Axis, slug: string): string {
  const zh = axis === "vibe" ? vibeLabels[slug] : sceneLabels[slug];
  return zh ? `${zh} ${slug}` : slug;
}
