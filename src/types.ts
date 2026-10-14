export type Kind = "component_library" | "showcase" | "open_source" | "tweet";
export type License = "free" | "pro" | "mixed";
export type Status = "pending_review" | "approved";
export type Axis = "vibe" | "scene";

export interface XMeta {
  author: string;
  post_id: string;
  lang: string;
  queried_at: string;
}

export interface Preview {
  screenshot?: string;
  embed_url?: string;
}

export interface Resource {
  id: string;
  title: string;
  source_url: string;
  kind: Kind;
  vibe: string[];
  scene: string[];
  stack: string[];
  license: License;
  preview: Preview;
  usage: string;
  notes: string;
  status: Status;
  x_meta?: XMeta;
  created_at: string;
  updated_at: string;
}

export interface BrowseQuery {
  axis: Axis;
  category: string | null;
  q: string;
  license: License | null;
  stacks: string[];
}
