import { axisValueLabel, kindLabels, licenseLabels, stackLabel } from "./labels.ts";
import type { Axis, BrowseQuery, License, Resource } from "./types.ts";

const licenses = new Set<License>(["free", "pro", "mixed"]);

export function parseBrowseQuery(params: URLSearchParams): BrowseQuery {
  const axis: Axis = params.get("axis") === "scene" ? "scene" : "vibe";
  const category = params.get("cat")?.trim() || null;
  const q = params.get("q") ?? "";
  const licenseParam = params.get("license");
  const license = licenses.has(licenseParam as License) ? (licenseParam as License) : null;
  const stacks = (params.get("stack") ?? "")
    .split(",")
    .map((stack) => stack.trim())
    .filter(Boolean);
  return { axis, category, q, license, stacks };
}

export function writeBrowseQuery(query: BrowseQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.axis === "scene") params.set("axis", "scene");
  if (query.category) params.set("cat", query.category);
  if (query.q.trim()) params.set("q", query.q);
  if (query.license) params.set("license", query.license);
  if (query.stacks.length > 0) params.set("stack", query.stacks.join(","));
  return params;
}

export function resourceText(resource: Resource): string {
  const vibe = resource.vibe.map((slug) => `${slug} ${axisValueLabel("vibe", slug)}`);
  const scene = resource.scene.map((slug) => `${slug} ${axisValueLabel("scene", slug)}`);
  const stack = resource.stack.map((slug) => `${slug} ${stackLabel(slug)}`);
  const kind = kindLabels[resource.kind];
  const license = licenseLabels[resource.license];
  return [
    resource.id,
    resource.title,
    resource.notes,
    resource.usage,
    resource.source_url,
    resource.kind,
    kind.zh,
    kind.en,
    resource.license,
    license.zh,
    license.en,
    ...vibe,
    ...scene,
    ...stack,
  ]
    .join("\n")
    .toLowerCase();
}

export function matchesQuery(resource: Resource, query: BrowseQuery): boolean {
  if (query.category) {
    const values = query.axis === "scene" ? resource.scene : resource.vibe;
    if (!values.includes(query.category)) return false;
  }
  if (query.license && resource.license !== query.license) return false;
  if (query.stacks.length > 0 && !query.stacks.some((stack) => resource.stack.includes(stack))) {
    return false;
  }
  const tokens = query.q.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = resourceText(resource);
  return tokens.every((token) => haystack.includes(token));
}

export function countValues(resources: Resource[], axis: Axis): Map<string, number> {
  const counts = new Map<string, number>();
  for (const resource of resources) {
    for (const value of axis === "scene" ? resource.scene : resource.vibe) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  return counts;
}

export function collectStacks(resources: Resource[]): string[] {
  const stacks = new Set<string>();
  for (const resource of resources) {
    for (const stack of resource.stack) stacks.add(stack);
  }
  return [...stacks].sort((a, b) => stackLabel(a).localeCompare(stackLabel(b), "en"));
}

export function readReturnSearch(state: unknown): string | null {
  if (!state || typeof state !== "object" || !("from" in state)) return null;
  const from = state.from;
  return typeof from === "string" ? from : null;
}
