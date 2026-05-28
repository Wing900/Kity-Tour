# Kity-Tour · PlotKityCat 官方教程站

基于 React + Vite + Excalidraw 的交互式教程网页，用于展示与编辑 PlotKityCat 手绘教程。

**在线访问：** https://wing900.github.io/Kity-Tour/

## 功能概览

- 左侧目录树：文件夹 / 教程文件浏览
- 中间画布：Excalidraw 手绘区（支持翻页、多幻灯片）
- 顶部栏：编辑模式工具、JSON 备份导入导出
- 开发模式：画布修改自动写入 `public/data/tour-data.json`
- 画布图片：开发模式自动拆分到 `public/data/scene-files/`，JSON 仅保存引用
- 标签页与顶栏 Logo 使用仓库内 `public/logo.png`（与 PlotKityCat 官方图一致，便于离线/GitHub Pages）

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开终端提示的地址（一般为 `http://localhost:5173`）。

## 如何编辑画布

默认是**只读阅读模式**（可平移、缩放，不能画图）。要编辑请：

1. 点击左上角 Logo，进入编辑模式
2. 顶栏会出现导入导出、退出等工具；Excalidraw 工具栏可用
3. 每页独立保存，切换页面前会自动写入；开发环境会自动写入 `public/data/tour-data.json`

## 如何添加可点击链接

教程画布基于 Excalidraw，**不能只写一段看起来像网址的文字**就自动可点，需要给图形绑定链接：

1. 进入编辑模式后，用选择工具点选**矩形、文字**等图形
2. 按 **Ctrl+K**（Mac：**⌘+K**），或右键菜单中的链接项
3. 输入完整网址（如 `https://github.com/Wing900/PlotKityCat`），确认保存
4. 图形会出现**链接角标**；读者在阅读模式点击该角标即可在新标签页打开

链接会随画布一起写入 `tour-data.json` 的 `elements[].link` 字段。

## 数据文件

教程结构保存在：

`public/data/tour-data.json`

画布中插入的图片资源会单独落到：

`public/data/scene-files/`

生产构建后位于 `dist/data/` 下对应目录。可通过顶部 **导出备份 / 导入备份** 迁移数据。

## 技术栈

- React 19 + TypeScript
- Vite 6
- [@excalidraw/excalidraw](https://github.com/excalidraw/excalidraw)
- lucide-react 图标

## 构建与本地预览

```bash
npm run build
npm run preview
```

本地预览即 `dist/` 目录的静态站点，与线上一致。

## 部署

这是 **纯静态站点**（`npm run build` → `dist/`），可部署到任意静态托管。

### 部署前检查

1. **教程内容**：确认 `public/data/tour-data.json` 已是最终版（构建时会复制进 `dist/data/`）
2. **线上无法自动写盘**：开发时的 `/api/save` 仅在 `npm run dev` 有效；线上改动画布后请用「导出备份」→ 更新 JSON → 重新构建部署，或仅在本机 dev 编辑后部署

### 方式 A：GitHub Pages（本仓库推荐）

仓库：[github.com/Wing900/Kity-Tour](https://github.com/Wing900/Kity-Tour)

1. 推送代码到 `main` 分支（已含 `.github/workflows/deploy-pages.yml`）
2. 打开 **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**
3. 等 Actions 跑完，访问：**https://wing900.github.io/Kity-Tour/**

之后每次 push `main` 会自动重新部署。本地 `npm run dev` 不受影响（仍用根路径 `/`）。

### 方式 B：Vercel

1. 将项目推到 GitHub / GitLab
2. 打开 [vercel.com](https://vercel.com) → Import 仓库
3. 框架选 **Vite**，构建命令 `npm run build`，输出目录 `dist`（仓库已含 `vercel.json`）
4. Deploy

或使用 CLI：

```bash
npm i -g vercel
npm run build
vercel --prod
```

### 方式 C：Netlify

1. Import Git 仓库，或拖拽 `dist` 文件夹到 [Netlify Drop](https://app.netlify.com/drop)
2. Build command: `npm run build`，Publish directory: `dist`
3. 已包含 `netlify.toml` 与 `public/_redirects`（SPA 回退）

### 方式 D：Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `dist`
- Node 版本 18+

### 方式 E：自己的服务器 / Nginx

把 `dist/` 整目录上传到服务器，Nginx 示例：

```nginx
server {
    listen 80;
    server_name your.domain.com;
    root /var/www/kity-tour/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 方式 F：仅上传静态文件

```bash
npm run build
# 将 dist/ 内所有文件上传到对象存储 + CDN，或任意静态空间
```

### 编辑模式说明

- 点击左上角 Logo 即可进入编辑模式。
- 编辑模式只影响当前浏览器会话；刷新后会回到阅读模式。
- 本地 `npm run dev` 下会自动写回 `public/data/tour-data.json`。
- 本地插入的图片会自动写入 `public/data/scene-files/`，避免把大图直接塞进 JSON。
- 已部署的静态站不会自动把改动写回服务器文件；如需长期保留，请导出 JSON 后更新仓库并重新部署。

### 更新已上线教程

1. 本地 `npm run dev` 编辑并保存，或改 `public/data/tour-data.json`
2. `npm run build`
3. 重新部署（覆盖 `dist` 或触发 CI 再构建）
