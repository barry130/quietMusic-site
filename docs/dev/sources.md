# qt-sources（音源包工程）

平台无关的 TypeScript 工程，**产物同时服务 Windows 与 Android 两端**。

- 仓库：<https://github.com/barry130/qt-sources>

---

## 铁律：src/ 不 import 宿主代码

```json
"dependencies": {}   // 当前对外依赖数为 0
```

bundle 必须能在 QuickJS / JavaScriptCore / V8 里原样跑，所以
**`src/` 里不得 import 主应用或 Tauri 专有 API**。宿主能力一律靠注入
（`host.request` / `host.log` / `host.platform`）。请保持这个依赖数为 0。

---

## 常用命令

```bash
pnpm install

pnpm build            # node scripts/build-sources.mjs —— 完整构建流水线
pnpm typecheck        # tsc --noEmit
pnpm test             # vitest

pnpm gen:vendor       # 重新生成 vendor（混淆脚本体）
pnpm check:bodies     # 校验脚本体完整性
pnpm smoke:bundle     # bundle 冒烟
pnpm smoke:entries    # 入口冒烟
pnpm verify:expr      # 表达式校验
```

devDeps：esbuild 0.25.0、typescript 5.8.3、vite 6.3.5、vitest 3.1.4。

::: tip 本机 pnpm 报 `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`
直接调 node 入口绕行：

```bash
node node_modules/vitest/vitest.mjs run
node node_modules/typescript/bin/tsc --noEmit
```
:::

---

## 构建流水线（6 步，带守卫）

```
1. Vite 库模式打包
        │
2. restore-lx-bodies   ← 把混淆脚本体恢复为逐字节原文
        │
3. ed25519 签名        ← 追加 /*__QT_SIGN__{...}*/
        │
4. 冒烟测试
        │
5. check-lx-bodies     ← worker 沙箱逐个执行脚本体，看门狗拦挂死
   + meta 敏感词闸门   ← meta 包取链面痕迹必须零命中
        │
6. 交付
```

::: danger 第 2 步与第 5 步不可绕过
这两步是 **2026091905 线上事故**的直接产物：当时脚本自校验被破坏，导致
PC 端所有接口超时、安卓端 QuickJS 卡死。现在任何一步异常都会中断构建。
:::

---

## 构建配置

`sources.config.json`：

| 字段 | 值 |
|---|---|
| `meta.id` / `versionCode` / `versionName` | `meta-official` / `2026100701` / `2026.10.07.1` |
| `play.id` / `versionCode` / `versionName` | `play-official` / `2026100701` / `2026.10.07.1` |
| `signing.publicKey` | `mOti+JoaX2Tn6VaP91E+TaYrth4oGaUqASv9Ot4NDcE=` |
| `signing.keyFile` | `F:/qtMusic/_backup/qt-signing/signing-key.json` |
| `artifacts` | `["meta-bundle.js", "play-bundle.js"]` |
| `targets` | `[]` |

::: warning versionCode 必须单调递增
格式为 `YYYYMMDD` + 2 位序号（如 `2026100701`），且不得低于已发布的最大值。
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
  { id: "wyy",  name: "网易云音乐", color: "#e5484d" },
  { id: "qq",   name: "QQ音乐",     color: "#31c27c" },
  { id: "kw",   name: "酷我音乐",   color: "#f08300" },
  { id: "kg",   name: "酷狗音乐",   color: "#2fa4e7" },
  { id: "bili", name: "哔哩哔哩",   color: "#00aeec" },
  { id: "migu", name: "咪咕音乐",   color: "#008cd6" },
]

QUALITIES = [
  { id: "128",  name: "标准128k" },
  { id: "320",  name: "高品320k" },
  { id: "flac", name: "无损FLAC" },
]
```

- `Source` 与 `Quality` 都是**开放字符串**，宿主不做 id 白名单校验，只当不透明字符串透传
- 唯一保留值：`LOCAL_SOURCE = "local"`（本地曲目，宿主硬编码实现）

### 能力自述字段

每个源还向宿主声明自己的能力与限制，避免把这些知识写死在客户端：

| 字段 | 回答什么问题 |
|---|---|
| `latestUsesOffset` | 翻页参数是真分页还是摆设 |
| `searchPageMax` | 每页最多几条（网易实测 `limit=200` 返回 **0 条**） |
| `referer` | 下载时该带哪个 Referer（未知源**不发**该头） |
| `features` | 有没有排行榜 / 歌单 / 歌手 / 专辑 / 新歌流 |
| `qualities` | 哪些音质档位真实可用（B 站无真无损就不展示 flac） |
| `playlistSorts` | 歌单广场有哪些排序（空数组 = 不支持排序） |

### 契约版本

`src/meta-entries.ts`：

```ts
export const META_REVISION = 5
```

`HOST_API_VERSION = 1`。`META_REVISION` 随能力演进递增；未声明旧字段的旧包按保守
默认处理，行为不变。

---

## platforms/ 目录

21 个文件，按平台与能力拆分：

```
wyy.ts / qq.ts / kw.ts / kg.ts / bili.ts / migu.ts     # 数据面
*-play.ts                                              # 各平台取链
kw-auth.ts / kw-des.ts                                 # 酷我鉴权与 DES 加解密
kg-md5.ts                                              # 酷狗签名
inflate.ts / qrc-decode.ts                             # 解压与逐字歌词解码
haitang-core.ts / utils.ts                             # 线路核心与公用
```

---

## 相关

- [音源包机制](./source-pack) —— 包模型、签名、安全扫描
- [音源包作者指南](./pack-authoring) —— 从零写一个可安装的播放包
