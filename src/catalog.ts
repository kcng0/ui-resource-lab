import type { Resource } from "./types.ts";

const approvedModules = import.meta.glob<Resource>("../data/resources/*.json", {
  eager: true,
  import: "default",
});

const inboxModules = import.meta.glob<Resource>("../data/inbox/*.json", {
  eager: true,
  import: "default",
});

export const approvedResources = Object.values(approvedModules).sort((a, b) =>
  a.title.localeCompare(b.title, "en"),
);

export const inboxResources = Object.values(inboxModules).sort(
  (a, b) => b.updated_at.localeCompare(a.updated_at) || a.title.localeCompare(b.title, "en"),
);

export function findApproved(id: string): Resource | undefined {
  return approvedResources.find((resource) => resource.id === id);
}

export function findInbox(id: string): Resource | undefined {
  return inboxResources.find((resource) => resource.id === id);
}
