# Kity-Tour · PlotKityCat 官方教程站

基于 React + Vite + Excalidraw 的交互式教程网页，用于展示与编辑 PlotKityCat 手绘教程。

## 功能概览

- 左侧目录树：文件夹 / 教程文件浏览
- 中间画布：Excalidraw 手绘区（支持翻页、多幻灯片）
- 顶部栏：管理员解锁、JSON 备份导入导出
- 开发模式：画布修改自动写入 `public/data/tour-data.json`

## 本地运行

```bash
npm install
cp .env.example .env
# 编辑 .env，设置 VITE_ADMIN_PASSWORD=你的密码
npm run dev
```

浏览器打开终端提示的地址（一般为 `http://localhost:5173`）。未配置 `VITE_ADMIN_PASSWORD` 时无法进入编辑模式。

## 如何编辑画布

默认是**只读阅读模式**（可平移、缩放，不能画图）。要编辑请：

1. **连续点击左上角 Logo 20 次**（不要求快速），弹出登录框
2. 输入管理员密码（由部署方通过 `VITE_ADMIN_PASSWORD` 配置，页面上无入口按钮）
3. 解锁后顶栏会出现备份/退出等管理员工具；Excalidraw 工具栏可用，每页独立保存，切换页面前会自动写入（开发环境写入 JSON）

## 如何添加可点击链接

教程画布基于 Excalidraw，**不能只写一段看起来像网址的文字**就自动可点，需要给图形绑定链接：

1. 解锁管理员后，用选择工具点选**矩形、文字**等图形
2. 按 **Ctrl+K**（Mac：**⌘+K**），或右键菜单中的链接项
3. 输入完整网址（如 `https://github.com/Wing900/PlotKityCat`），确认保存
4. 图形会出现**链接角标**；读者（未解锁管理员）点击该角标即可在新标签页打开

链接会随画布一起写入 `tour-data.json` 的 `elements[].link` 字段。

## 数据文件

教程结构保存在：

`public/data/tour-data.json`

生产构建后位于 `dist/data/tour-data.json`。可通过顶部 **导出备份 / 导入备份** 迁移数据。

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
2. **管理员密码**：通过环境变量 `VITE_ADMIN_PASSWORD` 在**构建时**注入（见下方「管理员密码」），勿写进源码或提交到 Git
3. **线上无法自动写盘**：开发时的 `/api/save` 仅在 `npm run dev` 有效；线上改动画布后请用「导出备份」→ 更新 JSON → 重新构建部署，或仅在本机 dev 编辑后部署

### 方式 A：GitHub Pages（本仓库推荐）

仓库：[github.com/Wing900/Kity-Tour](https://github.com/Wing900/Kity-Tour)

1. 推送代码到 `main` 分支（已含 `.github/workflows/deploy-pages.yml`）
2. 仓库 **Settings → Secrets and variables → Actions** 新建 Secret：`VITE_ADMIN_PASSWORD`（你的管理员密码）
3. 打开 **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**
4. 等 Actions 跑完，访问：**https://wing900.github.io/Kity-Tour/**

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

### 管理员密码与安全

| 场景 | 做法 |
|------|------|
| 本地开发 | 项目根目录 `.env` 中设置 `VITE_ADMIN_PASSWORD`（参考 `.env.example`） |
| GitHub Pages | 仓库 **Settings → Secrets → Actions** 添加 `VITE_ADMIN_PASSWORD`，推送后 Actions 构建时注入 |
| Vercel / Netlify 等 | 在托管平台的 **Environment variables** 里添加同名变量，再触发构建 |

说明：

- Vite 只会把以 `VITE_` 开头的变量打进前端包，密码**不会出现在 Git 源码**里，但仍会存在于构建后的 JS 中；熟悉 DevTools 的人仍可能看到。这只是「别明文写进仓库」，不是服务端鉴权。
- 未设置 `VITE_ADMIN_PASSWORD` 时，站点为纯阅读模式，点击 Logo 也不会弹出登录。
- 若需要真正的访问控制，应增加后端校验或私有部署，而不是仅依赖前端密码。

### 更新已上线教程

1. 本地 `npm run dev` 编辑并保存，或改 `public/data/tour-data.json`
2. `npm run build`
3. 重新部署（覆盖 `dist` 或触发 CI 再构建）
