# qt-sources（音源包工程）

平台无关的 TypeScript 工程，**产物同时服务 Windows 与 Android 两端**。

- 仓库：<https://cnb.cool/canace/qt-sources>
- 类型契约与宿主 API 单独拆在 <https://cnb.cool/canace/qt-sources-sdk>（MIT）：
  只有纯类型、宿主 API 声明、[作者指南](/dev/pack-authoring)与示例包
- 产物：`dist/meta-bundle.js`（官方数据包）、`dist/play-bundle.js`（官方播放包）、
  `dist/chain.json`（线路表，仅本地留档）

::: tip 想写自己的播放包
播放包里要实现的是取链，而取链不在类型契约里。按[音源包作者指南](/dev/pack-authoring)
从零写一个可安装的播放包即可 —— 它只需要 SDK 里的类型与宿主 API。
:::

这个工程是从 `qt-pc` 拆出来的。原先音源包的源码、构建脚本、测试都住在
`qt-pc/src/source-scripts/` 与 `qt-pc/scripts/`，与主窗口代码混在一起；
现在它们在这里，qt-pc 只保留主窗口需要的三个门面文件
（`src/source-scripts/` 的 `index.ts` / `playurl-line.ts` / `source-update.ts`）
与 Rust 的 `builtin_request`。

---

## 铁律：src/ 不 import 宿主代码

```json
// package.json —— 连 dependencies 字段都没有
"devDependencies": { "esbuild": "0.25.0", "typescript": "5.8.3",
                     "vite": "6.3.5", "vitest": "3.1.4" }
```

bundle 必须能在 QuickJS / JavaScriptCore / V8 里原样跑，所以
**`src/` 里不得 import 主应用或 Tauri 专有 API**。宿主能力一律靠注入：

| 宿主能力 | 注入点 | qt-pc 的实现 | qt-uniappx 的实现 |
|---|---|---|---|
| HTTP（`request`） | `createSourceLayer(deps)` / `registerQtEntries(host)` | 引擎页 → `invoke("builtin_request")`（Rust reqwest） | prelude → `__qtHost.request` |
| 平台号（`platform`） | 同上 | `PLATFORMS.WINDOWS` = 1103 | `PLATFORMS.ANDROID` = 1101 / iOS 1102 |
| chain.json 本地覆盖层 | `setChainOverlayReader(reader)` | 引擎页 → `invoke("source_chain_overlay")` | 不注入，改由宿主调 `__qtEntries.loadChain(json)` 灌链 |

未注入 overlay reader 时等同「无覆盖层」，回退内置默认链——这是安卓端与 Node
测试的正常路径。**当前 `src/` 的对外依赖数为 0**，请保持。

---

## 目录结构

```
src/
├── meta-entry.ts      # 数据包入口（vite 库模式打包目标）
├── play-entry.ts      # 播放包入口（vite 库模式打包目标）
├── meta-entries.ts    # 数据面运行时核心：globalThis.__qtEntries 注册
├── play-entries.ts    # 取链面运行时核心：createPlayPack
├── registry.ts        # 音源 / 音质清单的唯一真源
├── contract.ts        # 契约类型（MusicInfo / Source / Quality / RequestBuiltin…）
├── chain-config.ts    # 线路配置默认值与解析
├── chain-store.ts     # 线路配置缓存（loadChain 灌入、执行器读取）
├── layer.ts           # 源分层（createSourceLayer）
├── scheme.ts / schemes/  # 脚本方案与内置方案
├── lines/declarative.ts  # 声明式线路
├── budget.ts / timeout.ts
├── actions/           # 数据面动作（7 个）
└── platforms/         # 各平台实现（20 个文件）

examples/hello-play-pack.js   # 作者模板（手写免构建、可直接安装）
docs/PACK-AUTHORING.md        # 作者指南（与站点同源）
tests/                        # 5 个 vitest 用例
scripts/                      # 构建流水线 + 调试探针
```

### actions/ —— 数据面动作

| 文件 | 职责 |
|---|---|
| `aggregate.ts` | 跨源聚合：`searchAll` / `allCharts` / `allLatest` / `allHotWords`，单源失败跳过 |
| `lyric.ts` | 歌词取回（原文 + 翻译 + 逐字 + 罗马音） |
| `cover.ts` | 封面：优先平台接口，失败兜底搜索 |
| `play-url.ts` | 取链主流程，记录命中线路与 miss 轨迹 |
| `play-guard.ts` | **Range 预检**：结构 / 魔数 / 体积 / 码率四道判定 |
| `recommendations.ts` | 推荐歌单（含 sort 排序参数） |
| `sheet-import.ts` | 歌单分享链接 / 歌单 ID 解析（**零网络请求**） |

`play-guard.ts` 值得单说：它同时被**取链侧**和**宿主冒烟自检**调用。
2026-10-06 之前宿主自己写了一份简化判定（只看 status + content-type、连 Referer
都不带），与取链侧漂移过——于是「冒烟测过、正式取链判死」的链接会以「装包成功」
的口径放过去，属于假绿灯。现在两处共用 `probeMediaUrl` 的四道判定。

冒烟阶段有两点刻意取舍得：

- **不带 Referer** —— 冒烟时还不知道该源最终会命中哪条线路，无从取头；
  少一个头只会更严（B 站那类节点会 `403 text/html` → 判死），不会放水
- **durationSec / quality 传空** —— 冒烟只回答「这地址是不是音频字节」，
  试听与码率两道需要歌长 / 档位，此处无从得知，不猜

### platforms/ —— 20 个文件，按平台与能力拆分

| 分组 | 文件 |
|---|---|
| 数据面 | `wyy.ts` / `qq.ts` / `kw.ts` / `kg.ts` / `bili.ts` / `migu.ts` |
| 取链面 | `wyy-play.ts` / `qq-play.ts` / `kw-play.ts` / `kg-play.ts` / `bili-play.ts` / `migu-play.ts` |
| 平台专用算法 | `kw-auth.ts`（酷我鉴权）、`kw-des.ts`（DES 加解密）、`kg-md5.ts`（酷狗签名） |
| 编解码 | `inflate.ts`（解压）、`qrc-decode.ts`（逐字歌词解码） |
| 共用 | `haitang-core.ts`（线路核心）、`bili-shared.ts`、`utils.ts` |

---

## 常用命令

```bash
pnpm install

pnpm build            # node scripts/build-sources.mjs —— 完整构建流水线
pnpm typecheck        # tsc --noEmit
pnpm test             # vitest run（含真实网络用例）

pnpm gen:vendor       # 从脚本原文重新生成 vendor（混淆脚本体包装）
pnpm check:bodies     # 单独跑「同步忙循环挂死」看门狗
pnpm smoke:bundle     # bundle 可导入 + 导出面齐全
pnpm smoke:entries    # 逐个调用 __qtEntries 数据接口
pnpm verify:expr      # 官方包验签链路 Node 对照自检（装载/验签表达式 + KAT + 篡改负例）
```

::: tip 本机 pnpm 报 `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`
直接调 node 入口绕行：

```bash
node node_modules/vitest/vitest.mjs run
node node_modules/typescript/bin/tsc --noEmit
```
:::

`scripts/` 下除了流水线脚本，还有一批 **`probe-*.mjs` 调试探针**：
`probe-artist-*.mjs`（歌手作品分页 / hasMore / 尾页行为，11 个变体）、
`probe-qq-zhida-ua.mjs`、`dump-artistid.mjs`、`dump-ui.mjs`。
它们不参与发布，是排查线上问题时的现场取证工具。

---

## 构建流水线（6 步，带守卫）

```
1. Vite 库模式打包 src/meta-entry.ts 与 src/play-entry.ts
   （publicDir: false，dist/ 只留声明的产物）
        │
2. restore-lx-bodies   ← 把混淆脚本体恢复为逐字节原文
        │
3. ed25519 签名        ← 两个 bundle 追加 /*__QT_SIGN__{...}*/ 尾块
        │
4. 冒烟测试            ← meta 可 ESM 导入 + 导出面齐全 + 链可解析
        │
5. check-lx-bodies     ← worker 沙箱逐个执行脚本体，看门狗拦挂死
   + meta 敏感词闸门   ← meta 包取链面痕迹必须零命中
        │
6. 交付                ← artifacts 供上传；targets（可为空）拷贝调试
```

::: danger 第 2 步与第 5 步不可绕过
这两步是 **2026091905 线上事故**的直接产物：当时脚本自校验被破坏
（Rollup 重打印 AST → jsjiami 系自校验失败 → 字符串数组轮转不收敛 → **同步忙循环挂死**），
导致 PC 端所有接口超时、安卓端 QuickJS 线程卡死。现在任何一步异常都会中断构建。
:::

---

## 构建配置 `sources.config.json`

| 字段 | 值 |
|---|---|
| `meta.id` / `versionCode` / `versionName` | `meta-official` + 版本三元组（`YYYYMMDD` + 2 位序号） |
| `play.id` / `versionCode` / `versionName` | `play-official` + 同一套版本规则 |
| `signing.publicKey` | `mOti+JoaX2Tn6VaP91E+TaYrth4oGaUqASv9Ot4NDcE=` |
| `signing.keyFile` | 发布机私钥文件（**不入库**） |
| `artifacts` | `["meta-bundle.js", "play-bundle.js"]` |
| `targets` | `[]`（两端均已去内置，正式发布恒为空） |
| `outDir` | `dist` |

关于 `updateUrl`：

- 留空 = **不自管更新**，宿主仍可经后端 manifest 渠道发现官方更新；
- 填了则是该包**自管更新源**，宿主启动时探测新版头、**仅提示**，
  手动确认后才下载生效。

::: warning versionCode 必须单调递增
格式为 `YYYYMMDD` + 2 位序号（例如 `2026010101`），
且 play 包的 `versionCode` **不得低于后端 manifest 历史已发布的最大值**。
**忘了 +1，用户永远收不到更新。**
:::

签名私钥不入库。他人 clone 后构建：

- 用 `QT_SIGNING_KEY` 环境变量提供 base64 seed，或
- `QT_SKIP_SIGN=1` 跳过（产物会被宿主拒绝官方 id 安装，仅供本地调试）

---

## registry.ts：音源与音质的唯一真源

宿主两端**不再内置**任何音源清单或音质档位，全部经 `__qtEntries.sourceRegistry()`
从包里动态读取。改这个文件 + 重发 meta 包即可新增音源，两端无需发版。

```ts
SOURCES = [
  { id: "wyy",  name: "网易云音乐", short: "网易", color: "#e5484d" },
  { id: "qq",   name: "QQ音乐",     short: "QQ",   color: "#31c27c" },
  { id: "kw",   name: "酷我音乐",   short: "酷我", color: "#f08300" },
  { id: "kg",   name: "酷狗音乐",   short: "酷狗", color: "#2fa4e7" },
  { id: "bili", name: "哔哩哔哩",   short: "B 站", color: "#00aeec" },
  { id: "migu", name: "咪咕音乐",   short: "咪咕", color: "#008cd6" },
]

QUALITIES = [
  { id: "128",  name: "标准 128k" },
  { id: "320",  name: "高品 320k" },
  { id: "flac", name: "无损 FLAC" },
]
```

- `Source` 与 `Quality` 都是**开放字符串**，宿主不做 id 白名单校验，只当不透明字符串透传
- 唯一保留值：`LOCAL_SOURCE = "local"`（本地曲目，宿主硬编码实现）

### 能力自述字段

每个源还向宿主声明自己的能力与限制，避免把这些知识写死在客户端：

| 字段 | 回答什么问题 | 未声明时的宿主行为 |
|---|---|---|
| `latestUsesOffset` | 翻页参数是真分页还是摆设 | 不传 offset |
| `searchPageMax` | 每页最多几条 | 按 **50** 兜底 |
| `referer` | 下载时该带哪个 Referer | **不发**该头 |
| `features` | 有没有排行榜 / 歌单 / 歌手 / 专辑 / 新歌流 | 一律按「支持」处理 |
| `qualities` | 哪些音质档位真实可用 | 全部档位 |
| `playlistSorts` | 歌单广场有哪些排序 | 空数组 = 不渲染排序选择器 |

这些字段是**逐步演进**出来的，每一版都对应一个真实痛点：

- **v3** 加 `latestUsesOffset` / `searchPageMax` / `referer`。
  在此之前宿主写死了「只有 wyy/kg 才透传 offset」、「每源每页上限表」、
  「下载四路 Referer」，新增一个源就得改客户端。
- **v4** 加 `features`。在此之前所有源全量展示所有入口——而 B 站没有歌单载体，
  「歌单广场」对它永远是空的。改成按声明显隐后，没有的入口直接不渲染。
- **v5** 加 `qualities` / `playlistSorts`。B 站音频流没有真无损
  （flac 档实际是最高档 AAC），靠声明就不给 flac 选项。

实测的 `searchPageMax`：酷我 / 网易 **100**、QQ **50**、酷狗 **30**、B 站 / 咪咕 **20**。
网易实测 `limit=200` 会返回 **0 条**——所以这个上限不是保守估计，是接口硬边界。

### LX 脚本宿主

`src/schemes/lx-host/` 是本工程里最特别的一块：它让**符合 LX 自定义源协议的第三方脚本**
无需改动即可装载进播放包，且两端（Android / Windows）行为一致。

| 文件 | 职责 |
|---|---|
| `bridge.ts` | 通用 LX 宿主：`lx` mock（`on` / `send` / `request` / `currentScriptInfo`）、`utils.crypto`（md5 + AES）、`utils.buffer`、`process` / `window` 环境桩、定时器 try/catch 包装 |
| `crypto.ts` | 加密实现（含 NIST 向量测试） |
| `sources.ts` | **每个在用脚本一份宿主实例**（懒初始化、单飞）；维护脚本注册表 |
| `vendored/<id>.js` | 第三方脚本体**逐字节原文**（入库） |
| `vendored/<id>.wrapped.js` | 构建期生成的静态包装（同名参数遮蔽，不用 `eval` / `new Function`，以适配 CSP） |

脚本注册表当前装载六个：玉宁熙-Pro、屿溪-终章、stellarwave、墨澜、洛雪音乐源、全豆要。
另有若干已裁剪（体积与稳定性权衡）。打包口径是**只有被线路直引的脚本才进播放包**，
脚本体约占播放包体积一半。

`bridge.ts` 的关键约束（都来自真实脚本的依赖面实测）：

- `SCRIPT_MD5` 必须是**脚本原文**的 md5——脚本自己会校验它
- `process` 用桩而非真实现（多个脚本有 `process.exit` 反调试）
- `window` 遮蔽为 `globalThis` 的 Proxy
- `setTimeout` / `setInterval` 包 `try/catch`（混淆脚本有定时器反调试）

### 契约版本

`src/meta-entries.ts`：

```ts
export const META_REVISION = 5   // 数据面能力版本
const HOST_API_VERSION = 1        // 宿主注入接口版本
```

`META_REVISION` 随能力演进递增；**未声明旧字段的旧包按保守默认处理，行为不变**——
这是两端能平滑升级的原因。

---

## 产物清单

| 文件 | 体积 | 内容 | 何时重发 |
|---|---|---|---|
| `meta-bundle.js` | ~229 KB | 数据面 + 播放包安装 / 路由桩；ESM | 改元数据接口 / 改注册表 |
| `play-bundle.js` | ~1.4 MB | LX 脚本宿主 + 各平台官方接口 + chain 执行器；IIFE | 换脚本 / 改官方接口 / 加宿主能力 |
| `chain.json` | ~4.6 KB | 线路表（**仅本地留档**对比两次发布的线路变化，不交付） | — |

取链面与第三方脚本原文只在这个工程里，对外发布的是 [qt-sources-sdk](https://cnb.cool/canace/qt-sources-sdk) 里的类型契约、
宿主 API 与作者指南，取链由用户自行安装的播放包提供。
构建时 meta 包有一道**敏感词闸门**：取链面痕迹零命中才允许发布。

---

## 相关

- [音源包机制](/dev/source-pack) —— 包模型、签名、安全扫描的完整说明
- [音源包作者指南](/dev/pack-authoring) —— 从零写一个可安装的播放包
