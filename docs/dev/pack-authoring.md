# 音源包作者指南

面向想给轻听写**播放音源包**的作者。读完后你应该能：从零写出一个可安装、
可更新、可被宿主信任的 `.js` 音源包。

::: tip 先跑通模板
配套模板
[`examples/hello-play-pack.js`](https://github.com/barry130/qt-sources/blob/main/examples/hello-play-pack.js)
（[CNB 镜像](https://cnb.cool/canace/qt-sources/-/blob/main/examples/hello-play-pack.js)）
—— 手写免构建、可直接安装。装上后任何歌都会播放同一段 CC0 演示音频，
**听到声音就说明整条链路走通了**。
:::

---

## 1. 30 秒理解包模型

- 音源包就是一个 `.js` 文件，用户通过 **https 直链**或**本地文件**安装
  （设置 → 音源包管理）。宿主不执行包体就能先读出「自述身份头」。
- 两种包：

  | 类型 | 职责 | 谁能发 |
  |---|---|---|
  | `kind:"play"` **播放包** | 给一首歌返回播放地址（`getPlayUrl`） | **第三方作者写的就是这种** |
  | `kind:"meta"` **数据包** | 搜索 / 歌单 / 歌词 / 封面等元数据面 | 目前仅官方，暂不对第三方开放 |

- 每个包按 `id` 独立管理版本：同 `id` 的新 `versionCode` 覆盖旧版（更新），
  不同 `id` 互不影响、可共存切换。
- 安装时宿主会**冒烟自检**（真取链 + Range 预检），失败自动回滚；包代码跑在
  沙箱引擎里，只有宿主注入的 `request` 能力可用（无 fetch / DOM / 文件系统）。

**为什么播放包要单独安装？** 因为它是唯一带版权风险的那一层。数据面可以随公开
仓库分发，取链面由用户自选来源。这个拆分是刻意的，不是工程偷懒。

---

## 1.5 想直接用 LX 音源脚本？

如果你的实现本来就是 **LX 自定义源协议**的脚本，那你不一定要按上面的工厂契约重写——
官方播放包里内置了一个 **LX 自定义源脚本宿主**，这类脚本**无需改动即可被装载**，
并且在 Android 与 Windows 两端行为一致。

宿主提供的兼容面（都写在 `qt-sources/src/schemes/lx-host/` 里）：

| 提供物 | 说明 |
|---|---|
| `lx` 对象 | `lx.on(EVENT_NAMES.request, handler)`、`lx.send(...)`、`lx.request(...)`、`lx.currentScriptInfo`、`lx.EVENT_NAMES` |
| 请求回调形态 | `{ action: "musicUrl", source, info: { musicInfo, type } }`，脚本按协议回吐结果 |
| `utils.crypto` | `md5` + `aesEncrypt`（网易 eapi 用的是 aes-128-ecb） |
| `utils.buffer` | `from` / `bufToString`（utf8 / hex / base64） |
| `SCRIPT_MD5` | **脚本原文**的 md5——脚本自己会拿它做自校验，必须对得上 |
| 环境桩 | `process`（多个脚本有 `process.exit` 反调试）、`window`（遮蔽为 `globalThis`）、`setTimeout` / `setInterval`（包 try/catch） |

::: warning 两条不能碰的约束
1. **脚本体必须逐字节保全**。混淆脚本在构建期会被恢复为逐字节原文——打包器重打印
   语法树会破坏脚本的自校验，导致解密轮转不收敛、陷入同步忙循环挂死。
   官方流水线为此有专门的守卫步骤，挂死即中止构建。
2. **再兼容也跑在沙箱里**。脚本能用的只有宿主注入的 `request` 通道，
   `fetch` / `XMLHttpRequest` / `WebSocket` / `Worker` / 文件系统全是 `undefined`。
:::

具体装载哪些脚本、按什么规则打包，见 [qt-sources（音源包工程）](/dev/sources)
的「LX 脚本宿主」一节；面向使用者的说明见 [如何设置音源](/source-setup)。

---

## 2. 首行自述头（必须）

整个文件第 1 行必须是一条块注释，内嵌 JSON：

```js
/*__QT_PACK__{"kind":"play","id":"my-cool-pack","name":"我的音源包","versionCode":3,"versionName":"1.2.0","updateUrl":"https://example.com/my-cool-pack.js"}*/
```

| 字段 | 必填 | 规则 |
|---|---|---|
| `kind` | ✅ | 第三方包固定 `"play"` |
| `id` | ✅ | `^[a-z0-9-]{2,32}$`（小写字母 / 数字 / 连字符）。**包的终身身份**，发布后不可改 |
| `name` | ✅ | 展示名（可中文） |
| `versionCode` | ✅ | ≥1 整数，**只增不减**。宿主拒绝降级，重复码视为「已装过」 |
| `versionName` | ✅ | 展示版本（如 `"1.2.0"`），与 `versionCode` 无强制对应 |
| `updateUrl` | | 包自己的 https 直链。声明后宿主**每次启动**探测该链接的首行头，发现新 `versionCode` 就提示用户更新（用户确认才下载）。不填 = 纯手动安装 |
| `notes` | | 一句话说明（安装预览里展示） |

规则：

- JSON 里不能出现 `*/` 序列（会提前终止注释头）——`updateUrl` 带路径没问题，别带 `*/`
- 头必须真的是**第 1 行**，前面不能有空行 / BOM
- **`versionCode` 纪律：每次发布新文件必 +1。忘了 +1，用户永远收不到更新**
- 宿主探测更新时只拉前 **4 KB**（`PROBE_RANGE_BYTES`，超时 10 s），所以头行
  越短越省流量；别在头里塞长文案

::: danger 保留 id
`play-official` / `meta-official` 是官方包专用，带发布方 ed25519 签名，
宿主对这两个 id 做硬校验。你用了它们且没有官方私钥签名，安装会**直接被拒绝**
（不是警告，是装不上）。别用。
:::

---

## 3. play 包代码契约

### 形态

- **普通脚本**（IIFE 或顶层代码），顶层**不能**有 `import` / `export`
  （宿主用 `new Function(code)()` 求值，不是当模块编译）
- 求值后的唯一顶层副作用：把工厂挂到全局

```js
globalThis.__qtPlayPackFactory = function (host) {
  // host = { request, log?, platform? }
  return {
    name: "my-cool-pack",
    version: "1.2.0",
    getPlayUrl: async function (args) { /* 见下 */ },
    loadChain: function (chainJson) { /* 见下 */ },
    bundleInfo: function () { /* 可选，诊断 */ },
  };
};
```

工厂会被立即调用一次，返回值被宿主持有；包被更新 / 切换时旧实例直接丢弃，
**无需**（也无法）处理卸载逻辑。

宿主在求值前会做一次形态检查：play 包正文必须含 `__qtPlayPackFactory`
标记，否则直接拒装（报「该文件不是有效的播放包」）。这是最省事的一道
防呆——把 HTML 错误页、被网盘改过的文件、别的东西误当包提交时，
你在安装预览阶段就会看到明确拒绝，而不是装完才发现不对。

### 宿主注入的能力 `host`

| 字段 | 类型 | 说明 |
|---|---|---|
| `request` | `(url, options?) => Promise<response>` | **唯一的联网通道** |
| `log` | `(message: string) => void` | 调试日志通道（缺失时自行忽略） |
| `platform` | `number` | 宿主平台号：`1101` 安卓 / `1102` iOS / `1103` Windows；缺省按安卓 |

`options`：

```js
{ method: "GET" | "POST",        // 默认 GET
  headers?: Record<string,string>,
  body?: string,
  timeoutMs?: number }            // 默认 15000
```

`response`：

```js
{ statusCode: number,
  headers: Record<string,string>, // 名全小写，Set-Cookie 会透传
  body: unknown }                 // 宿主已尝试按 JSON 解析
```

::: warning 别按 content-type 判断响应格式
上游普遍用 `text/plain` 装 JSON 体。直接按已解析的对象处理，解析失败才是字符串。
:::

需要伪造 Referer / UA 就在 `options.headers` 里传——宿主统一执行，你只负责拼参数
和解析响应。

`host.log` 的落点两端不同：Android 进引擎侧 `console.log`（logcat 可见，不落盘），
Windows 端引擎面板可见。别把它当持久化日志用。

---

### `getPlayUrl(args)` —— 唯一的核心

入参（宿主把正在播放的歌映射过来）：

```json
{ "platform": "kw", "id": "234567", "name": "晴天", "singer": "周杰伦",
  "album": "叶惠美", "quality": "320", "duration": 269 }
```

- `platform`：源 id。当前注册表是 `wyy` / `qq` / `kw` / `kg` / `bili` / `migu`，
  但官方数据包经 `__qtEntries.sourceRegistry()` 动态声明源与音质清单，宿主 UI 与
  入参枚举都随数据包版本变化——**你的包应把它当作任意字符串处理，遇到不认识的
  id 抛错即可**
- `quality`：当前档位 `128` / `320` / `flac`，同样按任意字符串处理
- `id` 是这首歌在 `platform` 源上的 id。跨源兜底场景下建议先按
  `name` / `singer` 搜索定位

成功：resolve **JSON 文本**

```json
{ "url": "https://...", "source": "kw", "quality": "320",
  "line": { "id": "kw-free", "name": "酷我免费", "kind": "free", "targetSong": null } }
```

- `url` 必须是**可直接播放**的音频地址（宿主会先发 Range 预检，预检不过等于失败）
- `line` 描述本次命中的线路（没有线路概念就传 `null`，宿主显示「未知」）
- `targetSong` 仅在跨源命中（返回的其实是别的平台上的这首歌）时传
  `{ platform, id, name, singer }`，宿主用它精确取词

失败：**`throw Error`**。

::: danger 宁可抛错，不要返回空串或假地址
错误文本是用户在界面能看到的唯一诊断信息，**请写清死因**
（如 `"kw 线路A：签名超时"`），别只写「失败」。

宿主收到错误后会回退内置取链，用户播放不中断——所以抛错是安全的选择，
返回假地址才是灾难。
:::

### 关于「实际音质」：不要虚标档位

宿主对取回的地址会做一次 **Range 预检**，其中含**码率判定**。若你请求的是
`flac` 但实际拿到的是 320k 流，宿主会按实测码率**只降不升**地重标档位，
下载文件名也用它而不是请求档位。所以：

- 别为了讨好用户硬报高档位——虚标的代价是下载文件名 `.flac` 而内容是 320k
- 拿不到真无损就老实返回 `quality` 与实际相符的值，或直接抛错

### `loadChain(chainJson)` —— 可选

宿主会把用户导入的链路配置（JSON 文本）递给你。不需要配置的包返回
`JSON.stringify({ ok: true, lines: 0 })` 即可；配置非法时抛错。

一个容易踩的坑：宿主在安装**直链 / 本地**的 play 包时，会顺手删掉同目录下
可能残留的旧 `chain.json`。原因是直链/本地安装的包自包含（内嵌默认链），
残留的旧链路会造成「新播放层配旧线路」。所以你**不能**假设磁盘上一定有一份
外部 chain 文件——把它当可选的覆盖层，默认链必须内嵌。

### `bundleInfo()` —— 可选

返回 JSON 文本（你自己的结构），装配后调试用，宿主不透传给界面。

---

## 4. 生命周期：你的包会经历什么

```
1. 安装预览
   下载 / 读文件 → 解析首行头 → 官方 id 先过签名硬校验
   （假官方包直接报错，到不了预览）→ 内容安全扫描
   （第三方包命中红线直接拒绝）→ 形态检查（play 必须含工厂标记）
   → 给用户看类型 / 名称 / 版本 / id / 来源
   （官方包展示「已验签」）→ 用户确认
              │
2. 落盘 + 登记   ▼
   写入 install/<id>/，旧版本备份为 .prev
              │
3. 装配         ▼
   new Function(code)() 求值 → 工厂调用 → API 挂到引擎
              │
4. 冒烟自检     ▼
   拿几首真实歌调 getPlayUrl + Range 预检
   通过 → 生效（清播放地址缓存）
   不通过 → 更新场景自动回滚旧版本；首次安装保留文件、列表标注「上次失败」
              │
5. 更新         ▼
   官方 manifest（仅官方包）/ 你声明的 updateUrl / 用户手动重装
   更新失败一律回滚
              │
6. 卸载 / 切换  ▼
   删目录出列表 / 热切换到别的包，你的代码无需感知
```

关于第 4 步的**冒烟自检**，有三个设计细节值得知道（它们直接决定你的包
在边界情况下会不会被误判）：

- **候选曲目不是写死的 ID**。宿主按固定关键词在酷我搜前 5 首
  （搜索走数据包，不需要播放包），逐个尝试。不写死歌曲 ID 是因为歌会下架、
  接口会变，搜索结果更抗老化；列表里有没有免费歌都能兜住
- **每首最多试 2 次**。网络抖动不该判死一个好包
- **任一成功即算通过**。所以你的包只要对**部分**曲目能取到链，就能过冒烟
- **没有候选曲目就跳过自检**（`无候选曲目，跳过冒烟`）——宁可不检，
  也不能凭空判失败

冒烟失败分两种后果，差别很大：

| 场景 | 后果 |
|---|---|
| **更新**失败 | 自动回滚到 `.prev`，并把新版本号**拉黑**（不再反复提示更新） |
| **首次安装**失败 | 文件保留在列表里，标注「上次失败」，由用户决定重试还是卸载 |
| 生效中的是**别的**包 | 只落盘、不抢生效位，等用户手动切换 |

第 5 步的更新探测有**节流**：自管 `updateUrl` 与后端 manifest 渠道各自
**4 小时**一次（`PROBE_INTERVAL_MS` / `CHECK_INTERVAL_MS`，按包独立）。
设置页的「检查更新」按钮会强制跳过这两道节流。

---

## 5. 发布检查单

- [ ] 首行头在第 1 行，JSON 可解析，`*/` 恰好一个
- [ ] `id` 合规（`^[a-z0-9-]{2,32}$`）且不撞 `play-official` / `meta-official`
- [ ] `versionCode` 比上一版 +1
- [ ] 顶层无 `import` / `export`（打包工具配置成 IIFE 输出，`formats:["iife"]`）
- [ ] 含 `__qtPlayPackFactory` 标记（宿主形态检查会找它）
- [ ] 不含红线词（含字符串字面量里的）；联网只走 `host.request`
- [ ] 请求头按需伪造；响应体别按 content-type 猜格式
- [ ] `getPlayUrl` 失败抛带死因的 Error，绝不返回假地址
- [ ] 返回的 `quality` 与地址实际码率相符（不虚标 flac）
- [ ] 用真机装一遍：能过冒烟、能播放、再发一版能收到更新提示
- [ ] 分发链接是 **https 直链**（宿主拒绝 http）；`updateUrl` 指向同一文件的最新版

---

## 6. 内容安全红线

签名只管官方身份；**内容安全对所有包一视同仁**。安装时宿主扫描包文本（剥掉尾部
签名块后的全文），第三方包命中下列任一特征**直接拒绝安装**，错误信息会给出
命中词与行号：

| 类别 | 命中特征 | 说明 |
|---|---|---|
| 宿主桥 | `__TAURI_INTERNALS__`、`__TAURI__`、`ipcRenderer`、`webkit.messageHandlers`、`UTSAndroid`、`io.dcloud` | 尝试触碰宿主 / 系统原生桥 |
| 直连网络 | `WebSocket`、`EventSource`、`sendBeacon`、`new XMLHttpRequest`、全局 `fetch(`、`require(` | 绕过 `host.request` 的自由外联面 |
| 后台执行体 | `importScripts`、`new Worker(`、`ServiceWorker`、`serviceWorker` | 引擎生命周期管不到的执行体 |
| 本地 / Node 面 | `child_process`、`process.binding`、`content://` | 引擎环境本就不该出现的系统能力 |

**形态说明与误报规避：**

- `fetch(` / `require(` 认**调用形态**：前一字符是字母 / 数字 / `_` / `$` / `.` 的不算。
  所以 `backend.fetch(songId)`、`prefetch(url)`、`myrequire(x)` 这类**不会**误伤；
  裸 `fetch(url)`、`await fetch(url)` 才拦
- 其余按**纯文本子串**匹配——别在字符串字面量 / 注释 / 变量名里拼出这些 API 名
- **刻意不拦** `eval(` / `Function(`：crypto-js 等加密库内联时的
  `Function("return this")()` 环境探测是标配，拦了会误杀一批主流第三方包；
  而且引擎里上面那些能力全是空的，动态执行也提不了权
- 官方包（已过签名校验）命中只记日志不阻断——签名即内容背书

两端的规则表**逐条一致**（Android 的 `pack-safety.uts` 与 Windows 的
`pack_safety.rs`），改一边必须同步另一边，否则同一个包会在两端得到不同裁决。

### 运行时能力收缴

静态扫描不是唯一防线。就算某条规则被绕过，引擎里也没有第二条路：

| 运行时能力 | 有无 |
|---|---|
| `host.request`（受管控 HTTP，协议 / 内网校验在宿主侧） | ✅ 唯一网络出口 |
| `host.log` / `host.platform`、纯 JS 计算、`JSON` / `Date` / 正则 / 定时器 | ✅ |
| `fetch` / `XMLHttpRequest` / `WebSocket` / `EventSource` / `sendBeacon` | ❌ 已收缴（调用即抛错） |
| `Worker` / `SharedWorker` / `ServiceWorker` / `importScripts` | ❌ 已收缴 |
| 宿主桥（Tauri IPC / 原生 bridge / `plus` / Node API / 文件系统） | ❌ 不存在 |
| `eval` / `Function` | ⚠️ 可用但无利可图——上面全是空的 |

---

## 7. 官方包签名（第三方作者可忽略）

官方发布渠道与第三方完全一样（https 直链 / 本地文件），所以官方身份**不靠渠道、
只靠内容签名**：

- 发布时由构建机用 ed25519 私钥对**包全文**（含首行身份头、剥掉尾部签名块）签名，
  文件最后追加：

  ```js
  /*__QT_SIGN__{"alg":"ed25519","sig":"<base64 的 64 字节签名>"}*/
  ```

- 宿主内置官方公钥，对 `play-official` / `meta-official` 做硬校验：缺签名块、
  签名对不上（文件被改过一个字节）一律拒绝安装 / 更新，与来源渠道无关
- 签名块必须整个在文件**最末尾**（后面只允许空白）
- 验证器本身带**已知答案自检**（RFC 8032 §7.1 Ed25519 空消息测试向量）：
  自检不过就整体不启用验签，不会假装验过

**第三方包完全不受影响**：不需要签名、不用申请密钥、流程一步没变。
也不要去伪造官方签名——没有私钥签不出来，公钥验签是单向的。

---

## 8. 常见问题

**Q：我的包能改搜索 / 歌单 / 歌词吗？**
不能。那些属于 `kind:"meta"` 数据包，目前仅官方发布。播放包只管取链。

**Q：加密算法 / zlib 要自己带吗？**
要。包是一个自包含脚本，依赖全部内联（官方包也是这么做的：加密模块原样内联）。
宿主不提供任何第三方库。

**Q：一次安装多个播放包会怎样？**
共存且可随时切换，同一时刻只有一个生效。列表里每行能看到来源（链接 / 本地 / 官方）
与最近失败原因。装新包**不会**抢走已有生效位——首个包自动生效，之后要用户手动切。

**Q：用户怎么信任我的包？**
安装预览会展示完整身份（id / 版本 / 来源）供用户确认；安装期内容安全扫描 +
运行时能力收缴兜底，包做不了取链以外的事。请在 `notes` 里写清包的用途。

**Q：用了官方 id 会怎样？**
宿主直接拒绝安装（明确报「官方包签名校验失败」）。这是防仿冒设计，
正常作者不受影响。

**Q：我能用顶层 `await` 吗？**
不行。宿主把整个文件喂给 `new Function(code)()`，产物必须是普通脚本。
所有异步都在 `getPlayUrl` 里做。

**Q：包被更新时我的旧实例会收到通知吗？**
不会，也不需要。旧实例被直接丢弃，播放层换成新工厂的返回值。所以别在
包外存全局状态（引擎生命周期内它可能残留），状态放在工厂闭包里。

**Q：`request` 有并发 / 频率限制吗？**
宿主不额外限制并发，但引擎的求值通道是**单线程串行**的——一次重型同步计算
会挡住所有已到达的响应。取链实现里别做同步大循环。

---

## 相关

- [音源包机制](/dev/source-pack) —— 包模型、签名、安全扫描的完整说明
- [qt-sources（音源包工程）](/dev/sources) —— 官方包的构建流水线与 LX 脚本宿主
- [如何设置音源](/source-setup) —— 面向使用者的安装与换源说明
- [反馈与贡献](/feedback) —— 提 Issue / PR 的双渠道入口
