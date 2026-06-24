# apple-pi 实施计划:基于 Pi 的 Tauri 通用 Agent 桌面端

> 目标:Tauri 2 + React 19 桌面应用,以 Pi Coding Agent 为底层,实现基础问答 + 模型配置。Pi 通过 `pi --mode rpc` 作为 Node sidecar 运行,Rust 后端托管其生命周期并桥接 IPC。

## 一、架构总览

```
┌──────────────────────────────────────────────────────────┐
│  React 前端 (WebView, src/)                                │
│  Zustand store ←→ invoke('pi_*') / listen('pi:event')     │
└────────────┬──────────────────────────────┬──────────────┘
             │ Tauri IPC (invoke + event)    │
             ▼                                ▼
┌──────────────────────────────────────────────────────────┐
│  Rust 后端 (src-tauri/src/)                                │
│  ├─ sidecar.rs   spawn pi --mode rpc, 管 stdio, 解析 JSONL │
│  ├─ sessions.rs  扫 ~/.pi/agent/sessions/ 列历史(JSONL)    │
│  ├─ config.rs    读写 auth.json / models.json / settings   │
│  └─ commands.rs  invoke_handler 注册的命令                  │
└────────────┬─────────────────────────────────────────────┘
             │ stdin (JSON 命令) / stdout (JSON 事件)
             ▼
┌──────────────────────────────────────────────────────────┐
│  Node sidecar: pi --mode rpc                               │
│  (node 二进制 + @earendil-works/pi-coding-agent,externalBin)│
│  env: PI_CODING_AGENT_DIR=<app_data>/.pi                   │
│       PI_OFFLINE=1 PI_TELEMETRY=0 PI_SKIP_VERSION_CHECK=1  │
│  args: --mode rpc -a                                       │
└──────────────────────────────────────────────────────────┘
```

**数据隔离**:所有 Pi 数据放在 `<app_data_dir>/apple-pi/.pi/`(Tauri `path::app_data_dir()`),通过 `PI_CODING_AGENT_DIR` 注入,不污染用户全局 `~/.pi/`。此做法效仿 openhanako(它隔离到 `${HANA_HOME}/.pi/`)。

## 二、目录结构(新增/改动)

```
apple-pi/
├── AGENTS.md                          # 需更新:补充 sidecar/stream 说明
├── docs/
│   └── implementation-plan.md         # 本文档
├── scripts/
│   └── fetch-node.ts                  # 新增:按平台下载 node 二进制到 src-tauri/binaries/
├── sidecar/                           # 新增:sidecar TS 源码(独立 Vite 构建)
│   ├── package.json                   # 依赖 @earendil-works/pi-coding-agent
│   ├── tsconfig.json
│   ├── vite.config.ts                 # lib 模式,输出 sidecar/dist/main.js
│   └── src/
│       └── main.ts                    # RPC 模式下其实直接跑 pi CLI,此目录留给 SDK 高级模式
├── src/                               # 前端(改动)
│   ├── routes/
│   │   ├── index.tsx                  # 改:聊天主界面(流式消息渲染)
│   │   └── models.tsx                 # 改:模型/provider/API key 配置
│   ├── components/
│   │   ├── chat/                      # 新增
│   │   │   ├── chat-view.tsx          # 消息流 + 输入框
│   │   │   ├── message-bubble.tsx     # 区分 user/assistant/thinking/tool
│   │   │   └── composer.tsx           # 输入框 + 发送 + abort
│   │   └── models/                    # 新增
│   │       ├── provider-list.tsx      # provider 配置列表
│   │       └── api-key-input.tsx      # key 输入(支持 !command 语法提示)
│   ├── store/                         # 新增
│   │   ├── chat.ts                    # Zustand:当前会话消息流 + streaming 状态
│   │   └── models.ts                  # Zustand:可用模型 + 当前选中
│   ├── lib/
│   │   ├── pi-client.ts               # 新增:封装 invoke('pi_*') + listen('pi:event')
│   │   └── types.ts                   # 新增:Pi RPC 事件/命令的 TS 类型
│   └── ...
├── src-tauri/
│   ├── Cargo.toml                     # 改:加 tokio, serde_json, dirs 等依赖
│   ├── tauri.conf.json                # 改:bundle.externalBin + beforeBuildCommand
│   ├── binaries/                      # 新增(gitignore):node-${target} 二进制
│   ├── capabilities/default.json      # 改:加 shell:allow-execute(若需)或自定义权限
│   └── src/
│       ├── main.rs                    # 不变
│       ├── lib.rs                     # 改:注册新命令,初始化 sidecar manager
│       ├── sidecar.rs                 # 新增:PiSidecar 进程管理(tokio)
│       ├── rpc.rs                     # 新增:JSONL 解析 + 命令分发 + 事件转发
│       ├── sessions.rs                # 新增:扫 sessions 目录 + 解析 JSONL 头
│       ├── config.rs                  # 新增:读写 auth.json/models.json/settings.json
│       └── commands.rs                # 新增:#[tauri::command] 定义
```

## 三、关键技术设计

### 3.1 sidecar 进程管理(Rust,`sidecar.rs`)

- 用 `tauri::async_runtime::spawn` + `tokio::process::Command` 启动 `node-${target}` 运行 pi。
- 二进制命名遵循 Tauri externalBin 约定:`node-aarch64-apple-darwin`、`node-x86_64-pc-windows-msvc.exe` 等,Tauri 自动按 target 选。
- 启动参数:`--mode rpc -a`(信任项目资源),环境变量见架构图。
- stdin/stdout 用 `tokio::io::BufReader` 按行读,**只能按 `\n` 分割**(Pi 文档警告不能用 readline 的 Unicode 分隔)。
- 生命周期:app 启动时 spawn,app 关闭时先发 `abort`(若在跑)→ 关 stdin → SIGTERM → 兜底 SIGKILL。
- 健康检查:启动后发 `get_state`,3s 内有响应视为就绪。

### 3.2 RPC 协议桥接(Rust,`rpc.rs`)

- **命令下发**:前端 `invoke('pi_send', { cmd: { type: 'prompt', text, id } })` → Rust 序列化为 JSON + `\n` 写 stdin。
- **事件上报**:Rust 读到 stdout 一行 JSON → `app.emit("pi:event", parsed)` → 前端 `listen('pi:event')`。
- **请求/响应关联**:命令带 `id`,Rust 维护 `id → oneshot::Sender` 表;`success:true` 响应回填;agent 异步结果走事件流(不带 id)。
- **批量合并**:token 级 `message_update` 在 Rust 侧 50ms 窗口内合并 `text_delta` 后再 emit,减少前端抖动。

### 3.3 前端 IPC 封装(`lib/pi-client.ts`)

```ts
// 形态(非最终代码)
export const piClient = {
  ready: () => invoke<boolean>('pi_ready'),
  send: (cmd: RpcCommand) => invoke<RpcResponse>('pi_send', { cmd }),
  prompt: (text: string) => piClient.send({ type: 'prompt', text, id: crypto.randomUUID() }),
  abort: () => piClient.send({ type: 'abort' }),
  setModel: (provider: string, modelId: string) => piClient.send({ type: 'set_model', provider, modelId }),
  getAvailableModels: () => piClient.send({ type: 'get_available_models' }),
  onEvent: (handler: (e: RpcEvent) => void) => listen('pi:event', e => handler(e.payload))
};
```

### 3.4 会话历史(`sessions.rs`)

- 扫 `<app_data>/apple-pi/.pi/agent/sessions/**/*.jsonl`。
- 每个文件只读首行 `SessionHeader`(`type:session`,含 `id`/`timestamp`/`cwd`)。
- 文件名格式 `--<cwd-encoded>--/<timestamp>_<uuid>.jsonl`,解析出可读标题(cwd 末段 + 时间)。
- 暴露 `list_sessions` / `get_session_messages`(全量读 JSONL 解析)命令。
- MVP 不做全文搜索,只按时间排序 + 标题展示。

### 3.5 模型配置页(`config.rs` + `routes/models.tsx`)

- 读写三个文件(都在 `PI_CODING_AGENT_DIR` 下):
  - `auth.json`:provider → API key(支持 `!command` / `$ENV` / 字面量)。
  - `models.json`:自定义 provider/model(OpenAI 兼容、Ollama 等)。
  - `settings.json`:`defaultProvider`/`defaultModel`/`defaultThinkingLevel`。
- 前端表单 → `invoke('config_save_auth', { ... })` → Rust 写文件(权限 0600)。
- 改动后通过 RPC `set_model` / `cycle_model` 热生效,无需重启 sidecar。

### 3.6 Node 二进制获取(`scripts/fetch-node.ts`)

- `pnpm run fetch:node` 触发,按 `process.platform`/`process.arch` 从 nodejs.org 下载对应 tarball,解压出 `node` 二进制,按 Tauri 命名规则放到 `src-tauri/binaries/`。
- `src-tauri/binaries/` 加入 `.gitignore`。
- `tauri.conf.json` 的 `bundle.externalBin` 指向 `binaries/node`。
- 开发前/CI 里需先跑此脚本(写进 README 和 AGENTS.md)。

## 四、依赖新增

### Cargo.toml

```toml
tokio = { version = "1", features = ["full"] }
serde_json = "1"
dirs = "5"
uuid = { version = "1", features = ["v4"] }
```

### package.json

```json
{
  "devDependencies": {
    "zustand": "^5"
  }
}
```

> sidecar 子包独立依赖 `@earendil-works/pi-coding-agent`;前端只依赖 `zustand`。

## 五、分阶段里程碑

### 阶段 0:sidecar 跑通(无 UI,验证链路)

- [ ] `scripts/fetch-node.ts` 下载 node 二进制
- [ ] `src-tauri/sidecar.rs` spawn `pi --mode rpc`,读 stdout 打印到日志
- [ ] Rust 发 `get_state` 命令,确认收到 `success` 响应
- [ ] `tauri.conf.json` 配 `externalBin`,验证 `pnpm tauri dev` 能拉起 sidecar
- **验证标准**:Tauri 控制台能看到 pi 的 RPC 事件流

### 阶段 1:基础问答(MVP 核心)

- [ ] `rpc.rs` 完整命令分发 + 事件转发
- [ ] `lib/pi-client.ts` + `store/chat.ts`(Zustand)
- [ ] `components/chat/` 三件套(消息流 + composer + bubble)
- [ ] `routes/index.tsx` 接入聊天界面
- [ ] 流式渲染:`message_update` → `text_delta` 累积,支持 abort
- **验证标准**:能发 prompt、看到流式回复、能中止;thinking/toolcall 正确区分显示

### 阶段 2:模型配置页

- [ ] `config.rs` 读写 auth/models/settings.json
- [ ] `routes/models.tsx` 表单(provider 选择 + API key 输入 + 默认模型)
- [ ] `get_available_models` 命令拉取可用模型列表
- [ ] 改配置后 `set_model` 热切换
- **验证标准**:配置 OpenAI/Anthropic key 后,聊天页能选对应模型并正常问答

### 阶段 3:会话历史

- [ ] `sessions.rs` 扫目录 + 解析 JSONL 头
- [ ] sidebar 的"历史记录"区接真实数据(替换 `recentConversations` 假数据)
- [ ] 点击历史项 → `switch_session` → 加载消息
- [ ] "新建对话"按钮 → `new_session`
- **验证标准**:重启 app 后历史会话可恢复并继续

### 阶段 4:打包验证

- [ ] `pnpm tauri build` 产出含 node 二进制的安装包
- [ ] 验证安装包体积(预期 60-80MB)
- [ ] 验证裸机(无 node)安装可运行
- **验证标准**:macOS .dmg / Windows .exe / Linux .deb 三平台打包通过

## 六、风险与对策(已验证项)

| 风险 | 状态 | 对策 |
|---|---|---|
| Pi 无 Rust 绑定 | 已验证 | sidecar + RPC 模式,官方推荐路径 |
| Node 二进制 114MB | 已实测 | 压缩后 +22MB,可接受;后续可评估 bun 编译 |
| RPC 无 list sessions | 已确认 | Rust 侧扫 sessions 目录 |
| JSONL Unicode 分隔陷阱 | 已确认 | Rust `BufRead::lines()` 只按 `\n`,安全 |
| MCP 不内建 | 已确认 | MVP 不涉及;v2 走 SDK 自集成或第三方 extension |
| 数据污染全局 pi | 已规避 | `PI_CODING_AGENT_DIR` 隔离(效仿 openhanako) |

## 七、不在 MVP 范围(v2+)

- MCP server 配置与调用(`/mcp` 页面保持占位)
- Skills 加载与管理(`/skills` 页面保持占位)
- Extension/插件系统
- SDK 高级模式(自定义工具/扩展)
- 全文搜索、会话归档、多会话并行
- 快捷键系统(`/shortcuts` 保持占位)

## 八、需更新的现有文件

- `AGENTS.md`:补充 sidecar 架构、`fetch:node` 流程、`PI_CODING_AGENT_DIR` 约定
- `.gitignore`:加 `src-tauri/binaries/`、`sidecar/dist/`、`sidecar/node_modules/`
- `README.md`:纠正过时的"原生 HTML/CSS/TS"描述(或直接指向 AGENTS.md)

## 九、参考实现

- **pi-web**(<https://github.com/jmfederico/pi-web>):web UI,Fastify + WebSocket + session daemon,用 SDK 进程内调用。
- **openhanako**(<https://github.com/liliMozi/openhanako>):Electron + Hono server,用 SDK,数据隔离到 `${HANA_HOME}/.pi/`。
- **Pi RPC 文档**:`packages/coding-agent/docs/rpc.md`(协议权威)。
- 两个参考实现都选 SDK 路径,因需自定义 UI/权限/多会话;apple-pi 选 RPC 是因纯问答场景足矣,且 Rust 侧直接掌控进程。
