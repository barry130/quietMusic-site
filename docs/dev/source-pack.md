# 音源包机制

理解这一层，就理解了轻听为什么能「接口失效不发版就修好」。

---

## 包模型

音源包就是一个 `.js` 文件，用户通过 **https 直链**或**本地文件**安装。
宿主**不执行**包体就能先读出它的身份。

| 类型 | id 示例 | 职责 | 谁可以发 |
|---|---|---|---|
| `kind:"play"` **播放包** | `play-official`、`my-cool-pack` | 给一首歌返回播放地址（`getPlayUrl`） | 官方 + 第三方作者 |
| `kind:"meta"` **数据包** | `meta-official` | 搜索 / 歌单 / 专辑 / 歌手 / 榜单 / 热词 / 歌词 / 封面 | 目前仅官方 |

每个包按 `id` 独立管理版本：同 `id` 的新 `versionCode` 覆盖旧版（更新），
不同 `id` 互不影响、可共存切换。

### 首行自述头（必须）

整个文件第 1 行必须是一条块注释，内嵌 JSON：

```js
/*__QT_PACK__{"kind":"play","id":"my-cool-pack","name":"我的音源包","versionCode":3,"versionName":"1.2.0","updateUrl":"https://example.com/my-cool-pack.js"}*/
```

| 字段 | 必填 | 规则 |
|---|---|---|
| `kind` | ✅ | 第三方包固定 `"play"` |
| `id` | ✅ | `^[a-z0-9-]{2,32}$`。**包的终身身份**，发布后不可改 |
| `name` | ✅ | 展示名（可中文） |
| `versionCode` | ✅ | ≥1 整数，**只增不减**。宿主拒绝降级，重复码视为「已装过」 |
| `versionName` | ✅ | 展示版本 |
| `updateUrl` | | 包自己的 https 直链。声明后宿主每次启动探测首行头，发现新版本提示用户 |
| `notes` | | 一句话说明（安装预览里展示） |

两处硬规则：

- JSON 里不能出现 `*/` 序列（会提前终止注释头）
- 头必须真的是**第 1 行**，前面不能有空行 / BOM

::: danger 保留 id
`play-official` / `meta-official` 是官方专用。用它们且没有官方私钥签名，
安装会**直接被拒绝**（不是警告）。
:::

---

## 双包拆分

2026-10 起拆成两个包，目的是把风险分层：

| 包 | 体积 | 内容 | 触发重发的改动 |
|---|---|---|---|
| `meta-bundle.js` | ~100 KB | ESM：数据面 + 播放包安装 / 路由桩 | 改元数据接口、改注册表 |
| `play-bundle.js` | ~1.2 MB | IIFE：LX 脚本宿主 + 各平台官方接口 + chain 执行器 | 换脚本、改官方接口、加宿主能力 |

数据面可随公开仓库分发（不含任何取链实现），取链面由用户自行安装。
构建时 meta 包有一道**敏感词闸门**：取链面痕迹零命中才允许发布。

---

## 生命周期

```
1. 安装预览
   下载/读文件 → 解析首行头 → 官方 id 先过签名硬校验
   → 内容安全扫描 → 展示身份供确认 → 用户确认
              │
2. 落盘 + 登记   ▼
   写入 install/<id>/，旧版本备份为 .prev
              │
3. 装配         ▼
   new Function(code)() 求值 → 工厂调用 → API 挂到引擎
              │
4. 冒烟自检     ▼
   几首真实歌调 getPlayUrl + Range 预检
   通过 → 生效（清播放地址缓存）
   不通过 → 更新场景自动回滚旧版；首次安装保留文件、标注「上次失败」
              │
5. 更新         ▼
   官方 manifest（仅官方包）/ 你声明的 updateUrl / 用户手动重装
   更新失败一律回滚
              │
6. 卸载 / 切换  ▼
   删目录出列表 / 热切换到别的包，包代码无需感知
```

---

## 官方包签名（ed25519）

官方发布渠道与第三方完全一样（https 直链 / 本地文件），所以**官方身份不靠渠道、
只靠内容签名**：

- 发布时由构建机用 ed25519 私钥对**包全文**（含身份头、剥掉尾部签名块）签名，
  文件末尾追加：

  ```js
  /*__QT_SIGN__{"alg":"ed25519","sig":"<base64 的 64 字节签名>"}*/
  ```

- 两端宿主内置官方公钥，对 `play-official` / `meta-official` 做硬校验：
  缺签名块、签名对不上（文件被改过一个字节）一律拒绝安装 / 更新，与来源渠道无关
- 签名块必须整个在文件**最末尾**（后面只允许空白）

密钥不入库。他人 clone 构建时用 `QT_SIGNING_KEY` 环境变量提供 base64 seed，
或 `QT_SKIP_SIGN=1` 跳过（产物会被宿主拒绝官方 id 安装，仅供本地调试）。

> 第三方包完全不受影响：不需要签名、不用申请密钥、流程一步没变。
> 也不要去伪造官方签名——没有私钥签不出来，公钥验签是单向的。

---

## 内容安全红线

签名只管官方身份；**内容安全对所有包一视同仁**。安装时宿主扫描包文本
（剥掉尾部签名块后的全文），第三方包命中下列任一特征**直接拒绝安装**：

| 类别 | 命中特征 |
|---|---|
| 宿主桥 | `__TAURI_INTERNALS__`、`__TAURI__`、`ipcRenderer`、`webkit.messageHandlers`、`UTSAndroid`、`io.dcloud` |
| 直连网络 | `WebSocket`、`EventSource`、`sendBeacon`、`new XMLHttpRequest`、全局 `fetch(`、`require(` |
| 后台执行体 | `importScripts`、`new Worker(`、`ServiceWorker`、`serviceWorker` |
| 本地 / Node 面 | `child_process`、`process.binding`、`content://` |

- `fetch(` / `require(` 认**调用形态**：前一字符是字母 / 数字 / `_` / `$` / `.` 的不算
- 其余按**纯文本子串**匹配——别在字符串字面量 / 注释 / 变量名里拼出这些 API 名
- 刻意**不拦** `eval(` / `Function(`：crypto-js 等加密库内联时的
  `Function("return this")()` 环境探测是标配
- 官方包（已过签名校验）命中只记日志不阻断——签名即内容背书

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

## 宿主契约

包侧 `registry.ts` 是音源 / 音质清单的**唯一真源**。宿主两端**不再内置**任何音源
清单或音质档位——新增一个源只改那个文件并重发 meta 包，两端经
`__qtEntries.sourceRegistry()` 动态读取，无需发版。

`Source` 与 `Quality` 都是**开放字符串**，宿主不做任何 id 白名单校验，只当不透明
字符串透传。唯一保留值是 `local`（本地曲目，宿主硬编码实现）。

宿主还会从包里读到每个源的**能力自述**，避免把这些知识写死在客户端：

| 字段 | 回答什么问题 |
|---|---|
| `latestUsesOffset` | 这个源的翻页参数是真分页还是摆设 |
| `searchPageMax` | 每页最多几条（网易实测 limit=200 返回 0 条） |
| `referer` | 下载时该带哪个 Referer（未知源**不发**该头，宁可少一个头也不冒充别的平台） |
| `features` | 有没有排行榜 / 歌单 / 歌手 / 专辑 / 新歌流（据此显隐入口） |
| `qualities` | 哪些音质档位真实可用（B 站无真无损就不展示 flac） |
| `playlistSorts` | 歌单广场有哪些排序（空数组 = 不支持排序，不渲染选择器） |

契约版本号 `META_REVISION` 随能力演进递增，未声明旧字段的旧包按保守默认处理，
行为不变。

---

## 相关

- [音源包作者指南](./pack-authoring) —— 从零写一个可安装的播放包
- [qt-sources（音源包工程）](./sources) —— 构建流水线与守卫
