# qt-pc（Windows 桌面端）

Tauri 2 + React 19 + Rust 2021；前端跑在 WebView2 里，取链与音频在 Rust 侧。仓库
<https://github.com/barry130/qt-pc>，显示名「轻听」，应用 ID `com.qt.quietmusic`。

## 环境要求

Windows 10 / 11 + WebView2 Runtime（Win11 自带）；Node ≥ 20 + pnpm；Rust ≥ 1.87（edition 2021，
需 MSVC 工具链）。

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | Tauri 2（`=2.12.1`，启用 `tray-icon`） |
| 前端 | React 19.1 + TS 5.8 + Vite 6.3 + Tailwind v4 + Zustand 5 + TanStack Router |
| 音频 | `rodio` 0.22.2（`symphonia-all`）+ `cpal` 0.17 输出，`symphonia` 0.5 解码 |
| 数据 | `rusqlite` 0.40（`bundled`，自带 SQLite） |
| 网络 | `reqwest` 0.13（关闭默认特性，走 `rustls`） |
| 系统集成 | `souvlaki` 0.8（SMTC 媒体控制 / 硬件媒体键）、`windows` 0.62 |

主窗口只管界面与本地库；取链、解码、下载都在 Rust 侧，前端统一走 `src/services/ipc.ts`。

## 配置只改一处

**`app.config.json` 是唯一配置源**，派生文件由 `scripts/sync-config.mjs` 生成，共 6 个：
`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`、
`src/source-scripts/source-update.ts`、`src-tauri/src/app_config.rs`。

```bash
pnpm config:sync     # 写入派生文件
pnpm config:check    # 只校验（已挂进 build / test）
```

| 字段 | 当前值 |
|---|---|
| `version.name` / `version.code` | `1.1.0` / `110` |
| `product.name` / `product.displayName` | `QuietMusic` / `轻听` |
| `product.identifier` | `com.qt.quietmusic` |
| `backend.dev` | `http://localhost:27000/api/v1/` |
| `backend.prod` | `https://astral.canace.cn/api/v1/` |
| `backend.active` | `prod` |
| `platform.android` / `ios` / `windows` | `1101` / `1102` / `1103` |
| `devServer.port` / `hmrPort` | `1420` / `1421` |
| `sourcePack.hostApiVersion` | `1` |

`version.name` 与 `version.code` 必须一起改；`identifier` 派生注册表路径与数据目录，发布后不可改。

## 常用命令

```bash
pnpm install          # 安装依赖
pnpm tauri dev        # 完整开发（Rust + 前端，推荐）
pnpm dev              # 只跑前端（1420），适合纯 UI 改动
pnpm build            # 前端构建：config:sync → tsc --noEmit → vite build
pnpm typecheck        # tsc --noEmit
pnpm test             # 前端单测（已含 config:check）
```

Rust 侧（先 `$env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"`）：

```bash
cd src-tauri
cargo test --lib
cargo test --test flac_seek
cargo test --test live_astral -- --ignored --nocapture   # 真连后端，CI 不跑
```

::: warning 本机的 tauri CLI 绕行
部分环境下 `pnpm tauri build` / `pnpm tauri dev` 会失败：CLI 把 `argv[0]` 解析成
`DSH Desktop.exe`，报 `unrecognized subcommand`。这是本机环境问题。

```bash
pnpm exec tauri build --runner cargo                   # 方式 A：完整产物，含 NSIS
cargo build --release --features tauri/custom-protocol # 方式 B：只出 exe
```

feature 必须写 **`tauri/custom-protocol`**，裸写 `custom-protocol` 会报
`the package 'quietmusic' does not contain this feature: custom-protocol`。方式 B 只出主程序，
NSIS 安装包由 `tauri-build` 驱动 `makensis` 生成。
:::

## 目录速览

```
app.config.json    ← 唯一配置源
src/               ← React 19 前端（TS 5.8 / Vite 6 / Tailwind v4）
  services/        ← ipc.ts 是全部 Tauri invoke 的唯一出口
  stores/          ← Zustand：播放状态、队列、认证、外观
  source-engine/   ← 引擎页客户端（RPC 封装与超时）
src-tauri/src/
  audio/           ← 音频引擎线程、队列、HTTP Range 读取
  ipc_guard.rs     ← 危险 IPC 只允许主窗口发起
  net_guard.rs     ← 出站请求准入（scheme / 私网 / host）
  app_paths.rs     ← 数据根 %APPDATA%\QuietMusic；app_config.rs 由同步器生成
  source_window.rs ← 隐藏的「音源引擎」窗口
```

## 音源包在 PC 端怎么加载

PC 端把 bundle 交给一个**隐藏窗口**执行：`source_window.rs` 动态创建（不进 `tauri.conf.json`），
label `source-engine`，加载 `qtres://localhost/engine/index.html`，360 × 240、不可见、无边框、
跳过任务栏。引擎页由 `qtres://` 内嵌分发，无 CSP 注入，可自由动态 `import()`；它与主窗口只走
事件 `source-engine-request` / `source-engine-response`。

| kind | 用途 | 超时 |
|---|---|---|
| `status` | 引擎生命周期（`booting`/`ready`/`error`）与当前生效播放包 | 2.5 s |
| `resolve` | 取链；`url` 为空串表示失败 / 无可用层 | 9.5 s |
| `invoke` | 调数据包接口（`__qtEntries` 入口名 + JSON 参数） | 20 s |

取链 9.5 s = 包侧整链预算 9 s + 宽限 250 ms + 调度余量；`playurl_bridge.rs` 的
`ASK_TIMEOUT` 必须大于它（现为 14 s）。

装载流程：`fetch` 包头（`kind` / `id` 要对得上）→ 动态 `import` → 取 `__qtEntries` 或
`globalThis.__qtEntries` → 用 `bundleInfo()` 复验 `name === "meta-bundle"` 且
`hostApiVersion === 1`；播放包用 `installPlayPack({code})` 求值装配。**换包不重建窗口**，
Rust 广播 `source-pack-changed` 后引擎页热切换并跑一次真实取链冒烟；引擎页的
`window.fetch` 被接管，只放行同源站内路径与 Tauri IPC 端点。

## HTTP Range 流式播放

在线播放不做「先整首下完再播」。`audio/range_reader.rs` 的 `HttpRangeReader` 实现
`Read + Seek`，把它伪装成 symphonia 能用的文件：

- 后台线程发 Range 请求，顺序写入磁盘缓冲 `cache/audio/<sha1(url)>.part`
- 就绪进度用**字节粒度区间集**记录（有序、不相交、相邻即合并），落盘多少就能读多少
- `read` 落在未就绪区间就阻塞；`seek` 到未就绪区间就发起新的 Range 请求重定位下载点
- 服务端**不支持 Range**（返回 200 而非 206）则退化为先下完再播

首包 `FIRST_PACKET_TIMEOUT` 8 s、单曲缓冲上限 `MAX_BUFFER_BYTES` 100 MB、总时限
`HTTP_TOTAL_GUARD` 120 s、空闲读超时 `READ_IDLE_TIMEOUT` 20 s、`MAX_RETRIES` 3。总时限放到
120 s，是因为 blocking reqwest 只有总超时、没有空闲读超时。

::: warning 重连必须校验响应起点
`Range` 不一定被遵守——CDN 回源、WAF 改写、签名 URL 换源都可能返回 200 加整文件。所以只
接受 2xx，且请求起点 > 0 时必须是 206、`Content-Range` 起点与请求一致，否则**丢弃这次
响应**并记日志，而不是把错位的数据喂给解码器。
:::

## 打包

`bundle.targets` 是 `["nsis"]`：

| 产物 | 路径 |
|---|---|
| NSIS 安装包 | `src-tauri/target/release/bundle/nsis/QuietMusic_<版本>_x64-setup.exe` |
| 主程序 | `src-tauri/target/release/quietmusic.exe` |
| 前端产物 | `dist/`（已打进二进制，无需单独分发） |

NSIS 用仓库自带模板 `nsis/installer.nsi`（Tauri 官方模板 + 18 行补丁），安装模式
`currentUser`，语言 `SimpChinese`。补丁让升级或同版本重装**不再弹「系统中已存在…是否卸载」**，
直接原地覆盖，用户数据不受影响。打包前先关掉运行中的 QuietMusic，否则链接阶段报
`failed to remove file … os error 5 拒绝访问`：

```powershell
Get-Process quietmusic -ErrorAction SilentlyContinue | Stop-Process -Force
```

## 发版与签名

推送 `v*` 标签触发 `.github/workflows/release.yml`：构建 NSIS → ed25519 签名并自验 → 创建
GitHub Release；普通 push 只跑 `ci.yml`。

```bash
git tag v1.1.0
git push origin v1.1.0
```

::: warning 签名密钥不可缺
工作流依赖仓库 secret `QT_UPDATE_SIGNING_KEY`（本地 ed25519 私钥的 base64）。应用内更新
**强制验签**，缺 `.sig` 会拒装：

```bash
node scripts/update-sign.mjs keygen
node scripts/update-sign.mjs sign   <exe 路径>
node scripts/update-sign.mjs verify <exe 路径>
```

`.exe.sig` 必须与 exe 放**同一目录**一起上传，应用按「下载 URL + `.sig`」取签名；加速节点
对 `.sig` 不可达时自动降级回原始直链。
:::

发版后把「下载地址 / MD5 / fileSize」填进后端管理后台的更新记录：应用内更新检查走后端，GitHub
Release 只托管安装包。

## 安全边界

`ipc_guard.rs` 让危险命令只允许主窗口发起——引擎窗口会把第三方音源包**求值进自己的 JS
环境执行**，而它与主窗口共用同一张 Tauri 命令注册表（ACL 只覆盖插件命令），不设防的话脚本
可以直接 `invoke` 到执行安装包的命令。`net_guard.rs` 对出站请求做 scheme / 私网 / host 准入。

## 数据位置

用户数据在 `%APPDATA%\QuietMusic`：`data/music.db`（曲库、收藏、歌单、历史、统计、下载）、
`source-bundle/`（已安装音源包）、`cache/audio/`（在线播放的 Range 缓冲）。1.0.3 之前目录名
叫 `LightListen`，首次启动新版本时会整目录改名迁移；改名失败则继续用旧目录。

## 常见坑

| 现象 | 原因与处理 |
|---|---|
| `unrecognized subcommand 'DSH Desktop.exe'` | 用了 `pnpm tauri build`，改用 `pnpm exec tauri build --runner cargo` |
| `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY` | pnpm 自身拦截，改调 node 入口（`node node_modules/vite/bin/vite.js build` 等） |
| `failed to remove file … os error 5` | QuietMusic 还在运行，先结束进程（含托盘） |
| `pnpm build` 挂起并问 `Terminate batch job (Y/N)?` | 组合命令的交互问题，拆成两条执行 |
| NSIS 下载 `makensis` 卡住 | 设 `TAURI_NSIS_PATH`；下载超时则配 `$env:HTTPS_PROXY = "socks5://127.0.0.1:10808"`（HTTP 代理端口不行） |
| 前端构建后窗口空白 | 确认走 `vite build` 且 `dist/` 已生成；生产读 `dist/`，不读 1420 端口 |
| 图标或标题中文乱码 | `tauri.conf.json` 与 `app.config.json` 必须存为 UTF-8 无 BOM |
| 启动后一直挂着终端窗口 | `main.rs` 顶部缺 `#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]` |
| `local-mirror … 连接失败 (os error 10061)` | 没起 `node tools/registry-proxy.mjs`（crates 镜像，`127.0.0.1:8650`，配合 `src-tauri/.cargo/config.toml`） |

另外：不要用 `>nul` 重定向（会在 PowerShell 里生成 `nul` 垃圾文件）；`node_modules/` 与
`.pnpm-store/` 不要删。

## 已知限制

- 不支持 APE / WMA / DSD
- 在线能力依赖音源包，未安装时在线功能不可用
- 无损音质可能回退（取决于上游线路）
- 加密歌词（qrc / krc）未实现
- 仓库公开定位为本地播放器，**不内置也不分发**任何音源实现

## 下一步

- 音源包的模型、签名与安装流程 → [音源包机制](/dev/source-pack)
- 自己写一个音源包 → [音源包作者指南](/dev/pack-authoring)
- 改音源实现本体 → [qt-sources（音源包工程）](/dev/sources)
- 打包失败、播放异常 → [问题答疑](/faq)
