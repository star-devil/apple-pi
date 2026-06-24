# apple-pi

基于 [Tauri 2](https://tauri.app/) + [Vite](https://vite.dev/) + TypeScript 的桌面应用项目。前端使用原生 HTML/CSS/TS，后端使用 Rust，通过 Tauri 打包为跨平台桌面应用。

## 技术栈

- **前端**：Vite 6 + TypeScript 5（原生 HTML/CSS，无前端框架）
- **后端**：Rust（Tauri 2 核心）
- **打包**：Tauri 2（产物：`.app` / `.exe` / `.deb` 等）
- **包管理**：pnpm

## 前置环境要求

1. [Node.js](https://nodejs.org/)（建议 LTS 版本）
2. [pnpm](https://pnpm.io/)
3. [Rust](https://www.rust-lang.org/)（含 cargo）
4. Tauri 系统依赖，按平台安装：https://tauri.app/start/prerequisites/

## 安装依赖

```bash
pnpm install
```

Rust 依赖会在首次构建时由 cargo 自动拉取。

## 启动开发

以 Tauri 应用模式启动（同时运行前端 dev server 和 Rust 后端，会弹出桌面窗口）：

```bash
pnpm tauri dev
```

仅启动前端 dev server（浏览器预览，无 Tauri 窗口，无法调用 Rust 命令）：

```bash
pnpm dev
```

前端默认运行在 `http://localhost:1420`（端口固定，见 `vite.config.ts`）。

## 构建生产包

```bash
pnpm tauri build
```

产物位于 `src-tauri/target/release/bundle/` 下。

## 其他命令

- `pnpm build`：仅构建前端（输出到 `dist/`，类型检查 + Vite 打包）
- `pnpm preview`：预览前端构建产物

## 目录结构

```
.
├── index.html              # 前端入口
├── src/                    # 前端源码（main.ts、styles.css、assets）
├── src-tauri/              # Rust 后端及 Tauri 配置
│   ├── src/                # Rust 源码
│   ├── Cargo.toml          # Rust 依赖配置
│   ├── tauri.conf.json     # Tauri 应用配置（窗口、打包等）
│   ├── build.rs
│   └── icons/              # 应用图标
├── vite.config.ts          # Vite 配置（针对 Tauri 适配）
├── tsconfig.json
└── package.json
```

## 推荐 IDE 配置

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
