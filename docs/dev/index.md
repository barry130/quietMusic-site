# 开发指南

想跑起来改代码、或写自己的音源包，从这里开始。

---

## 三个仓库与边界

| 仓库 | 平台 | 技术栈 | 说明 |
|---|---|---|---|
| [qt-uniappx](https://github.com/barry130/qt-uniappx) | Android / iOS | UniAppX（UVue + UTS + Vapor）、Pinia | 客户端 + 原生插件 |
| [qt-pc](https://github.com/barry130/qt-pc) | Windows | Tauri 2 + React 19 + Rust 2021 | 桌面端 |
| [qt-sources](https://github.com/barry130/qt-sources) | 平台无关 | TypeScript + Vite（零运行时依赖） | 音源实现与打包，**一份产物服务两端** |

关键的架构约定：**音源实现只存在于 qt-sources**。
两端都不内置任何第三方取链逻辑，只在运行时装载音源包。

```
        qt-sources（平台无关 TS）
                 │  pnpm build
                 ▼
    ┌────────────────────────────┐
    │ meta-bundle.js  (~100 KB)  │  数据面：搜索/歌单/歌词/封面/榜单
    │ play-bundle.js  (~1.2 MB)  │  取链面：各平台取链 + 线路执行器
    └────────────────────────────┘
          ▲                    ▲
          │ ESM 动态 import     │ 模块脚本执行
          │                    │（顶层自注册 __qtEntries）
      qt-pc（引擎页）      qt-uniappx（qt-js-engine / WebView V8）
```

### 为什么要平台无关

`qt-sources/src/` 的代码**不得** import 主应用或 Tauri 专有 API——
bundle 要能在 QuickJS / JavaScriptCore / V8 里原样跑。当前它的对外依赖数是 **0**
（`package.json` 没有 `dependencies`）。宿主能力一律靠注入：

| 宿主能力 | 注入点 | qt-pc 的实现 | qt-uniappx 的实现 |
|---|---|---|---|
| HTTP（`request`） | `createSourceLayer(deps)` / `registerQtEntries(host)` | 引擎页 → `invoke("builtin_request")`（Rust reqwest） | prelude → `__qtHost.request` |
| 平台号（`platform`） | 同上 | `1103`（Windows） | `1101`（Android）/ `1102`（iOS） |
| chain.json 覆盖层 | `setChainOverlayReader(reader)` | 引擎页 → `invoke("source_chain_overlay")` | 不注入，宿主调 `__qtEntries.loadChain(json)` |

---

## 各端上手

- [qt-pc（Windows）](./pc) —— Tauri + React + Rust
- [qt-uniappx（Android）](./mobile) —— UniAppX / HBuilderX
- [qt-sources（音源包工程）](./sources) —— 构建流水线与守卫
- [音源包机制](./source-pack) —— 包模型、签名、安全扫描
- [音源包作者指南](./pack-authoring) —— **第三方作者从这里开始**

---

## 通用约定

### 配置只改一处

`qt-pc` 的所有配置（版本号 / 产品名 / 应用 ID / 后端地址 / 开发端口）只在仓库根的
`app.config.json` 里改，其余文件由 `scripts/sync-config.mjs` 自动写入：

```bash
pnpm config:sync     # 同步到各工具自己的配置文件
pnpm config:check    # 只校验（已挂进 build / test：手改派生文件会直接失败）
```

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

---

## 行为准则

- **不要绕过 qt-sources 的构建守卫**。其中两步是线上事故的直接产物：
  `restore-lx-bodies`（把混淆脚本体恢复为逐字节原文）与 `check-lx-bodies`
  （worker 沙箱里逐个执行脚本体，看门狗拦挂死）。跳过会导致脚本自校验被破坏 →
  同步忙循环挂死。
- **不要在 `qt-sources/src/` 里 import 宿主代码**。当前对外依赖数是 0，请保持。
- **不要手写派生文件**。`app_config.rs` / `tauri.conf.json` / `Cargo.toml` 等由
  同步器生成，手改会被 `config:check` 拦下。
- **改 UTS 插件后必须重建基座**（云端打包 / 自定义基座），标准基座不含这些插件。
