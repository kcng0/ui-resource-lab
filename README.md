# ui-resource-lab

策展式 UI 资源索引，外加一个可浏览的本地 Web 应用。收录不是自由爬网：只收人工批准的链接；X/Twitter 搜索命中先以 `pending_review` 落在 inbox，等人批准。

A curated UI resource knowledge base and a small browse app. Ingest is not a free crawl: only human-approved links enter the catalog. X/Twitter search hits stay `pending_review` until a person approves them.

## 本地运行 / Run locally

需要 Node.js 22+。

```bash
npm install
npm run dev
```

打开 Vite 打印的本地地址（默认 `http://localhost:5173`）。

```bash
npm run validate   # 对照 schema 检查 data/
npm run build      # tsc + 生产构建
npm run preview    # 预览构建结果
```

## 目录里能做什么 / What the app does

- 按 **气质 vibe** 或 **场景 scene** 分组浏览
- 全文搜索（中英文标签都能命中，例如「极简」「free」）
- 按 **stack** 与 **license**（`free` | `pro` | `mixed`）筛选
- 卡片进入详情：来源链接、预览、笔记、一键复制 `usage`
- 预览默认是本地示例画稿；有 `embed_url` 时可改看 iframe。站点若禁止嵌入，改回截图
- 待审队列只读。页面上没有批准按钮

v1 直接用 Vite 打包 `data/resources/*.json`，没有后端。

## 仓库布局 / Layout

```text
schema/resource.schema.json   资源记录合同
data/resources/*.json         已批准目录（一条一个文件）
data/inbox/*.json             待审，含未来的 X 命中
docs/INGEST.md                收录规则
public/previews/              示例画稿
src/                          Vite + React + TypeScript + Tailwind
```

已批准的种子是这四条组件库：Uiverse、21st.dev、Magic UI、shadcn/ui。记录按公开信息填写；气质拿不准的写在笔记 `TODO` 里，没有新造分类。`data/inbox/` 目前是空的。`public/previews/` 仍是本地画稿，不是那些站点的真实截图。

批准一条 inbox 记录：把 `status` 改成 `approved`，更新 `updated_at`，把文件移到 `data/resources/`，再跑 `npm run validate`。细节和「规则之外就停下来问人」见 [docs/INGEST.md](docs/INGEST.md)。

新增或改名 JSON 后如果 dev server 没跟上，重启一次 `npm run dev`。`import.meta.glob` 在启动时收集文件。
