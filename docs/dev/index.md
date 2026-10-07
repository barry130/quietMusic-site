# 开发指南

想跑起来改代码、或写自己的音源包，从这里开始。

---

## 三个仓库与边界

| 仓库 | 面向平台 | 技术栈 | 产物 |
|---|---|---|---|
| [qt-uniappx](https://github.com/barry130/qt-uniappx) | Android / iOS | UniAppX：`.uvue` 页面 + UTS 服务 + Vapor 渲染，Vue 3 组合式 API，Pinia 管全局状态 | Android 安装包 / iOS 包 |
| [qt-pc](https://github.com/barry130/qt-pc) | Windows | Tauri 2（Rust 后端 + WebView2 前端）+ React 19 + Rust 2021 | NSIS 安装包 `QuietMusic_<版本>_x64-setup.exe` |
| [qt-sources](https://github.com/barry130/qt-sources) | 平台无关 | TypeScript + Vite 库模式，**零运行时依赖** | `meta-bundle.js`、`play-bundle.js` |

关键的架构约定：**音源实现只存在于 qt-sources**。
两端都不内置任何第三方取链逻辑，只在运行时装载音源包。

```
        qt-sources（平台无关 TS）
                 │  pnpm build
                 ▼
    ┌────────────────────────────┐
    │ meta-bundle.js  (~229 KB)  │  数据面：搜索/歌单/歌词/封面/榜单
    │ play-bundle.js  (~1.4 MB)  │  取链面：各平台取链 + 线路执行器
    └────────────────────────────┘
          ▲                    ▲
          │ ESM 动态 import     │ 模块脚本执行
          │                    │（顶层自注册 __qtEntries）
      qt-pc（引擎页）      qt-uniappx（qt-js-engine / WebView V8）
```

两个包的产出格式不同，这是有意的：

- `meta-bundle.js` 以 **ESM** 产出（`format: "es"`，入口 `meta-entry.ts`），PC 侧直接
  `import()`；负责搜索、歌单、专辑、歌手、榜单、歌词、封面等数据面接口。
- `play-bundle.js` 以 **IIFE** 产出（`format: "iife"`，全局名 `qtPlayBundle`，入口
  `play-entry.ts`）。这是硬要求：它由数据包侧的 `installPlayPack(code)` 用
  `new Function(code)()` 求值，顶层不能出现 `import` / `export`。
- 两者 target 都是 `es2020`（部分混淆脚本用到 BigInt），且**不压缩**（`minify: false`）。
- 构建期还会追加身份头与签名块，宿主不执行包体就能读出身份。

### 为什么要平台无关

`qt-sources/src/` 的代码**不得** import 主应用或 Tauri 专有 API——
bundle 要能在 QuickJS（安卓）、JavaScriptCore（iOS）、V8（PC 引擎页）里原样跑。
当前它的对外依赖数是 **0**（`package.json` 没有 `dependencies`）。宿主能力一律靠注入：

| 宿主能力 | 注入点 | qt-pc 的实现 | qt-uniappx 的实现 |
|---|---|---|---|
| HTTP（`request`） | `createSourceLayer(deps)` / `registerQtEntries(host)` | 引擎页 → `invoke("builtin_request")`（Rust reqwest） | prelude → `__qtHost.request` |
| 平台号（`platform`） | 同上 | `1103`（Windows） | `1101`（Android）/ `1102`（iOS） |
| chain.json 覆盖层 | `setChainOverlayReader(reader)` | 引擎页 → `invoke("source_chain_overlay")` | 不注入，宿主调 `__qtEntries.loadChain(json)` |

历史上 `chain-store.ts` 里曾直接 `invoke("source_chain_overlay")`，是 bundle 里唯一的
Tauri 依赖；改成注入式之后，两端才能真正共用同一份产物。

### 包的身份头与签名

产物首行是一段注释形式的包头，宿主**不执行包体**即可读取身份：

```js
/*__QT_PACK__{"kind":"play","id":"play-official","name":"官方播放包","versionCode":2026100701,…}*/
```

产物尾部是签名块 `/*__QT_SIGN__{"alg":…,"sig":…}*/`。签名在构建期对**含身份头的全文**
计算；两端内置公钥，只对 `play-official` / `meta-official` 这两个保留 id 硬校验——
验不过一律拒绝安装。第三方包不签名，不受影响。

---

## 我该读哪一页

| 你想了解 | 页面 |
|---|---|
| 包模型、安装与更新流程、签名与安全闸门 | [音源包机制](/dev/source-pack) |
| 编译、调试、打包 Windows 桌面端 | [qt-pc（Windows）](/dev/pc) |
| 在 HBuilderX 里跑 Android / iOS 端 | [qt-uniappx（Android）](/dev/mobile) |
| 改音源实现、跑构建流水线与守卫 | [qt-sources（音源包工程）](/dev/sources) |
| 从零写一个第三方音源包 | [音源包作者指南](/dev/pack-authoring) |

---

## 本地环境要求

| 目标 | 需要准备 |
|---|---|
| 通用 | Node.js ≥ 20、pnpm（两个前端仓库的脚本都按 pnpm 写） |
| qt-pc | Windows 10 / 11、WebView2 Runtime（Win11 自带）、Rust ≥ 1.87（edition 2021，含 MSVC 工具链） |
| qt-uniappx | HBuilderX 5.x 或更高版本、Android SDK 或 iOS 工具链、真机 / 模拟器 |
| qt-sources | 只需 Node.js；`devDependencies` 仅 esbuild / typescript / vite / vitest，无原生依赖 |

::: warning qt-uniappx 必须用自定义基座
标准基座不含 `qt-app-native`、`qt-audio-player`、`qt-js-engine`、`qt-stat`、`qt-ui`
这五个 UTS 原生插件，直接跑会出现「找不到悬浮窗授权入口」这类假故障。
必须使用自定义基座或云端打包；改过 UTS 代码后要重新编译插件并重建基座。
（早期文档里的 `qt-media-store` 已合并进 `qt-app-native`，不再是独立插件。）
:::

---

## 常用命令

### qt-pc

| 命令 | 作用 |
|---|---|
| `pnpm install` | 安装依赖 |
| `pnpm dev` | 只跑前端（Vite 固定 1420 端口），适合纯 UI 改动 |
| `pnpm tauri dev` | 完整开发（Rust + 前端） |
| `pnpm build` | 前端构建：先 `config:sync`，再 `tsc --noEmit`，最后 `vite build` |
| `pnpm typecheck` | 类型检查 |
| `pnpm test` | 前端单测；前置一次 `config:check` |
| `pnpm config:sync` / `pnpm config:check` | 写入 / 校验派生配置文件 |

### qt-sources

| 命令 | 作用 |
|---|---|
| `pnpm build` | 完整构建流水线（**带守卫**，见「行为准则」），产出两个 bundle |
| `pnpm typecheck` / `pnpm test` | 类型检查 / 单测 |
| `pnpm gen:vendor` | 从本机第三方脚本原文重新生成 vendored 片段 |
| `pnpm check:bodies` | 单独跑脚本体沙箱守卫 |
| `pnpm smoke:bundle` / `pnpm smoke:entries` | 产物冒烟（bundle 与入口自注册各一项） |
| `pnpm verify:expr` | 表达式校验脚本 |

### qt-uniappx

| 命令 | 作用 |
|---|---|
| `npm install` | 安装 Pinia 等依赖，首次克隆后必须先做 |
| `npm run check` | `.uvue` 静态检查，并校验图标「定义」与「引用」一一对应 |
| `npm run gen:tab-icons` | 重新生成 tabBar 图标 |

移动端的编译与运行都在 HBuilderX 里进行，命令行只负责静态检查。

### 当前版本号

| 仓库 | 版本定义位置 | 当前值 |
|---|---|---|
| qt-pc | `app.config.json` 的 `version.name` / `version.code` | `1.1.0` / `110` |
| qt-uniappx | `manifest.json` 的 `versionName` / `versionCode` | `3.0.7` / `307` |
| qt-sources | `sources.config.json` 的 `packs.meta` / `packs.play` | `2026.10.07.1` / `2026100701` |

---

## 通用约定

### 配置只改一处

`qt-pc` 的所有配置（版本号 / 产品名 / 应用 ID / 后端地址 / 开发端口）只在仓库根的
`app.config.json` 里改，其余文件由 `scripts/sync-config.mjs` 自动写入：

```bash
pnpm config:sync     # 同步到各工具自己的配置文件
pnpm config:check    # 只校验（已挂进 build / test：手改派生文件会直接失败）
```

派生文件一共 6 个：`package.json`、`src-tauri/tauri.conf.json`、
`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock`、`src/source-scripts/source-update.ts`、
`src-tauri/src/app_config.rs`。清单以外的东西（`tsconfig.json`、`vite.config.ts`、
`nsis/installer.nsi` 等）由各自的工具直接读，同步器不碰。

`qt-uniappx` 的 API 基地址在 `services/config.ts` 按 dev / prod 分离，生产地址放在
**不提交**的 `services/config.local.ts`。首次克隆请把
`services/config.local.example.ts` 复制为 `services/config.local.ts` 并填入真实地址。

### 版本号纪律

- `qt-pc`：只改 `app.config.json` 的 `version.name` 与 `version.code` 两行（如 `1.1.0` / `110`），
  二者自洽性由单测校验
- `qt-uniappx`：`manifest.json` 的 `versionName` / `versionCode`
- `qt-sources`：音源包的 `versionCode` **必须单调递增**，格式为 `YYYYMMDD` + 2 位序号，
  且不得低于已发布的最大值。忘了 +1，用户永远收不到更新

### 本机命令可能被 pnpm 拦

部分环境下 `pnpm <script>` 会报 `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`。
绕行方式是直接调 node 入口：

```bash
node node_modules/vitest/vitest.mjs run
node node_modules/typescript/bin/tsc --noEmit
```

脚本本身与 CI 不受影响，只有本机直接敲 `pnpm <script>` 时会遇到。

---

## 行为准则

- **不要绕过 qt-sources 的构建守卫**。其中两步是线上事故的直接产物：
  `restore-lx-bodies`（把混淆脚本体恢复为逐字节原文）与 `check-lx-bodies`
  （worker 沙箱里逐个执行脚本体，看门狗拦挂死）。跳过会导致脚本自校验被破坏 →
  同步忙循环挂死。敏感词闸门同样不能关。
- **不要在 `qt-sources/src/` 里 import 宿主代码**。当前对外依赖数是 0，请保持。
- **不要手写派生文件**。`app_config.rs` / `tauri.conf.json` / `Cargo.toml` 等由
  同步器生成，手改会被 `config:check` 拦下。
- **改 UTS 插件后必须重建基座**（云端打包 / 自定义基座），标准基座不含这些插件。

---

## 下一步

- 动手改桌面端 → [qt-pc（Windows）](/dev/pc)
- 动手改移动端 → [qt-uniappx（Android）](/dev/mobile)
- 写自己的音源包 → [音源包作者指南](/dev/pack-authoring)
- 连接不上、装不上、取不到链 → [问题答疑](/faq)
