# Ingest rules / 收录规则

This catalog is curated. Ingest is not a free web crawl.

这个知识库是策展的。收录不是自由爬网。

## Allowed inputs / 允许的入口

1. **User-approved links / 人工批准的链接.** A human supplies the URL and confirms it belongs in the catalog.
2. **X/Twitter search hits / X 搜索命中.** A later search job may write hits, but only as `status: pending_review` under `data/inbox/`. They stay out of the browse catalog until a human approves them.

v1 does not call the X API and does not ship a crawler. `data/inbox/` is empty until a human or a future search job writes a `pending_review` file there.

v1 不调用 X API，也不带爬虫。`data/inbox/` 现在是空的，直到人工或以后的搜索任务写入一条 `pending_review`。

## Rules-outside → stop and ask / 规则之外：停下并询问

If a source, field, status, kind, or workflow is not covered by this document or [`schema/resource.schema.json`](../schema/resource.schema.json), stop. Do not guess a new ingest path, crawl, or auto-approve. Ask a human.

来源、字段、状态、kind 或流程如果不在本文或 schema 里，就停。不要发明新的收录路径，不要爬，不要自动批准。问人。

Examples that are outside the rules:

- Following outbound links from an approved page to ingest “similar” sites
- Sitemaps, search-engine queries, or unattended directory crawls
- A new status such as `rejected` or `archived`
- A new kind, or a third browse axis besides `vibe` and `scene`
- Treating an X hit as approved because the query matched

规则之外的例子：

- 从已批准页面顺着外链再收录“相似站点”
- sitemap、搜索引擎查询，或无人值守的目录爬取
- 新状态，例如 `rejected` 或 `archived`
- 新的 kind，或在气质 / 场景之外再加一条浏览主轴
- 因为搜索词命中就把 X 结果当成已批准

## Where records live / 记录放哪

| Folder | Status | Role |
| --- | --- | --- |
| `data/resources/<id>.json` | `approved` | Browse catalog. The app loads only this folder for the public index. |
| `data/inbox/<id>.json` | `pending_review` | Review queue, including future X hits. |

The filename stem must equal `id`. One resource per file, so approval is a file move rather than an edit buried in a giant array.

文件名（不含扩展名）必须等于 `id`。一条资源一个文件，批准就是移动文件，而不是在一个大数组里改一行。

## Taxonomy / 分类

- **Browse axes / 浏览主轴:** `vibe` (气质), `scene` (场景). Both are required, and each needs at least one slug.
- **Filters / 筛选:** `stack` (tech slugs), `license` (`free` | `pro` | `mixed`).
- **Kinds:** `component_library` | `showcase` | `open_source` | `tweet`.

Slugs are open strings, not a closed enum. Scene values on the seed records include `landing`, `marketing`, `docs`, and `app-shell`. A new slug is fine when a human names it. An agent must not invent a new axis.

slug 是开放字符串，不是封闭枚举。种子记录的 scene 用了 `landing`、`marketing`、`docs`、`app-shell`。人指定的新 slug 可以用。不要擅自增加新的主轴。

### Locked library-card vibes / 已锁定的库卡片气质

These four URLs are tagged as library pages, not scraped component by component. `vibe[]` must use these exact strings until a human overrides them:

这四条按库页面打标，不按站内单个组件深挖。在人工改口之前，`vibe[]` 必须用下面的原文字符串：

| source_url | vibe |
| --- | --- |
| https://uiverse.io/ | `趣味交互` |
| https://21st.dev/ | `产品级组件橱窗` |
| https://magicui.design/ | `动效营销` |
| https://ui.shadcn.com/ | `克制工程基座` |

`license` describes the access model used by this catalog (free, paid, or both). It is not an SPDX id.

`license` 描述的是本目录使用的获取方式（免费、付费或两者都有），不是 SPDX 标识。

## X review flow / X 待审流程

Documented only. Not implemented in this scaffold.

这里只写流程，脚手架里没有实现。

1. A future search job queries X and writes one JSON file per hit into `data/inbox/`.
2. Each hit uses `kind: "tweet"`, `status: "pending_review"`, and `x_meta` (`author`, `post_id`, `lang`, `queried_at`). `source_url` is the post URL.
3. A human reviews the inbox entry in the app or in the file.
4. **Approve / 批准:** set `status` to `approved`, refresh `updated_at`, move the file to `data/resources/<id>.json`, then run `npm run validate`.
5. **Reject / 拒绝:** do not put the file in `data/resources/`. v1 has no archive folder. Deleting the inbox file is the rejection. Ask before inventing an archive.

`x_meta` is required for tweets and forbidden on every other kind.

推文必须有 `x_meta`。其他 kind 不能带 `x_meta`。

## Preview and usage / 预览与用法

- `preview.screenshot` is a site path. Put files in `public/` and reference them as `/previews/<file>`.
- `preview.embed_url` is optional. Many sites refuse iframes; the UI falls back to the screenshot.
- `usage` is the string the copy button writes to the clipboard. Markdown fences are fine.
- At least one of `screenshot` or `embed_url` is required.

## Validate / 校验

```bash
npm run validate
```

The script checks every JSON file in `data/resources/` and `data/inbox/` against the schema, checks that `id` matches the filename, checks that status matches the folder, and checks that screenshot paths exist under `public/`.
