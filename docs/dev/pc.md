# qt-pc（Windows 桌面端）

[Tauri 2](https://tauri.app/) + React 19 + Rust 2021。前端跑在系统 WebView2 里，
取链与音频在 Rust 侧。

- 仓库：<https://github.com/barry130/qt-pc>
- 产品名 `QuietMusic`，显示名「轻听」，应用 ID `com.qt.quietmusic`

---

## 环境要求

| 依赖 | 版本 |
|---|---|
| 操作系统 | Windows 10 / 11 |
| WebView2 Runtime | 已随 Win11 自带，Win10 需自行安装 |
| Node.js | ≥ 20 |
| pnpm | 最新稳定版 |
| Rust | ≥ 1.87（edition 2021） |

---

## 配置只改一处

**`app.config.json` 是唯一配置源。** 版本号、产品名、应用 ID、后端地址、开发端口
都在那里改，其余文件（`src-tauri/tauri.conf.json`、`tauri.windows.conf.json`、
`src-tauri/Cargo.toml`、`src-tauri/src/app_config.rs`、`src/constants.ts`）全部由
同步器生成：

```bash
pnpm config:sync     # 写入派生文件
pnpm config:check    # 只校验（已挂进 build / test：手改派生文件会直接失败）
```

`app.config.json` 里的关键字段：

| 字段 | 当前值 |
|---|---|
| `version.name` / `version.code` | `1.1.0` / `110` |
| `product.name` / `product.id` | `QuietMusic` / `com.qt.quietmusic` |
| `backend.dev` | `http://localhost:27000/api/v1/` |
| `backend.prod` | `https://astral.canace.cn/api/v1/` |
| `backend.active` | `prod` |
| `platform.android` / `ios` / `windows` | `1101` / `1102` / `1103` |
| `devServer.port` / `hmrPort` | `1420` / `1421` |
| `sourcePack.hostApiVersion` | `1` |

改版本**只改 `version.name` 与 `version.code` 两行**，二者自洽性由单测校验。

---

## 常用命令

```bash
pnpm install          # 安装依赖

pnpm tauri dev        # 完整开发（Rust + 前端，推荐）
pnpm dev              # 只跑前端（1420），适合纯 UI 改动

pnpm build            # 前端构建
pnpm typecheck        # tsc --noEmit
pnpm test             # 前端单测（已含 config:check）
```

Rust 侧：

```bash
cd src-tauri
cargo test --lib
cargo test --test flac_seek
cargo test --test live_astral -- --ignored --nocapture   # 真连后端，CI 不跑
```

::: warning 本机的 tauri CLI 绕行
部分环境下 `pnpm tauri build` / `pnpm tauri dev` 会失败：
CLI 把 `argv[0]` 解析成 `DSH Desktop.exe` → `unrecognized subcommand`。
这是本机环境问题，不是项目问题。两种绕行方式：

```bash
# 方式 A：加 --runner cargo（能出完整产物，含 NSIS 安装包）
pnpm exec tauri build --runner cargo

# 方式 B：只出 exe，不出安装包
cargo build --release --features tauri/custom-protocol
```

注意 feature 必须写 **`tauri/custom-protocol`**。裸写 `custom-protocol` 会报
`the package 'quietmusic' does not contain this feature: custom-protocol`。
:::

---

## 目录速览

```
app.config.json          ← 唯一配置源
scripts/sync-config.mjs  ← 配置同步器（生成所有派生文件）
src/                     ← React 19 前端（TS 5.8 / Vite 6 / Tailwind v4）
  constants.ts           ← 由同步器生成
  state/                 ← Zustand
src-tauri/
  Cargo.toml             ← 由同步器生成（Rust 2021，MSRV 1.87）
  src/
    app_config.rs        ← 由同步器生成
    ipc_guard.rs         ← 危险 IPC 只允许主窗口发起
    net_guard.rs         ← 出站请求白名单（scheme / 私网 / host）
tools/registry-proxy.mjs ← cargo 离线镜像（127.0.0.1:8650）
```

前端栈：React 19 + TypeScript 5.8 + Vite 6 + Tailwind CSS v4 + Zustand + TanStack Router。
音频：Rust 侧 `rodio` 0.22（`symphonia` 0.5 解码）+ `cpal` 0.17 输出，数据用 `rusqlite`。

---

## 网络与离线

公司网络下 cargo 拉注册表可能超时。仓库自带一个本地镜像代理：

```bash
node tools/registry-proxy.mjs      # 起在 127.0.0.1:8650
# 配合 src-tauri/.cargo/config.toml 使用
```

---

## 构建产物与发版

发版流程：改 `app.config.json` 的版本 → commit → push `v*` 标签，
`.github/workflows/release.yml` 自动构建 Windows 产物并发布 Release：

```
src-tauri/target/release/bundle/nsis/QuietMusic_<版本>_x64-setup.exe
```

::: warning 需要配置签名密钥
工作流依赖仓库 secret `QT_UPDATE_SIGNING_KEY`，值为本地 ed25519 私钥的 base64：

```bash
# 值取自 .signing/ed25519.key
```

应用内更新为**强制验签**，缺 `.sig` 会拒装。签名工具：

```bash
node scripts/update-sign.mjs keygen
node scripts/update-sign.mjs sign   <exe 路径>
node scripts/update-sign.mjs verify <exe 路径>
```

`.exe.sig` 必须与 exe 放在**同一目录**。
:::

---

## 安全边界

| 模块 | 职责 |
|---|---|
| `src-tauri/src/ipc_guard.rs` | 危险命令只允许主窗口发起（引擎页等内部窗口无权调用） |
| `src-tauri/src/net_guard.rs` | 出站请求做 scheme / 私网 / host 白名单校验 |

音源包在独立的「引擎页」里执行，经 `invoke("builtin_request")` 走 Rust 的 reqwest
出网，不接触前端 `fetch`。

---

## 数据位置

用户数据（数据库、缓存、音源包）在 `%APPDATA%\QuietMusic`。

---

## 已知限制

- 不支持 APE / WMA / DSD
- 在线能力依赖音源包，未安装时在线功能不可用
- 无损音质可能回退（取决于上游线路）
- 加密歌词（qrc / krc）未实现
