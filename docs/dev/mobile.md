# qt-uniappx（Android 移动端）

[UniAppX](https://uniapp.dcloud.net.cn/uni-app-x/)（UVue + UTS + Vapor 编译模式）。

- 仓库：<https://github.com/barry130/qt-uniappx>
- 包名 `com.qt.app`，appid `__UNI__7AC1B12`

---

## 环境要求

| 依赖 | 说明 |
|---|---|
| HBuilderX | 最新 alpha 版（UTS / Vapor 需要） |
| Android SDK | 通过 HBuilderX 配置 |
| 真机 | **必须用自定义基座或云端打包才能跑**（见下） |
| Node.js | 跑校验脚本用 |

::: danger 标准基座跑不起来
项目依赖四个 **UTS 原生插件**，标准基座不包含它们：

| 插件 | 职责 |
|---|---|
| `qt-app-native` | 原生能力桥（悬浮窗权限、`MANAGE_EXTERNAL_STORAGE`、文件删除等） |
| `qt-media-store` | 本地媒体扫描（MediaStore） |
| `qt-audio-player` | 音频播放 |
| `qt-js-engine` | 音源包执行引擎（WebView / V8） |

请用 **云端打包** 或 **自定义基座** 运行。用标准基座会在调用原生能力时报错。
:::

---

## 常用命令

```bash
npm run check          # 校验 uvue 文件（提交前必跑）
npm run gen:tab-icons  # 重新生成 tabBar 图标
```

`npm run check` 实际是 `node tools/check-uvue.mjs`。当前基线：
**checked 57 files, 0 with errors；icons defined: 49, referenced: 49**。
CI 会跑，失败即红。

---

## 关键配置

### 版本号

`manifest.json`：`versionName` `3.0.7` / `versionCode` `307`，并开启了
`vapor: true` 与 `vapor-render-target: bytecode`。

### API 基地址

`services/config.ts` 按环境分离：

```ts
export const API_BASE_URL_DEV = "http://192.168.1.117:27000/api/v1/"
export const USE_DEV = false
export const API_BASE_URL_PROD = /* 来自 config.local.ts */
```

生产地址放在 **不提交** 的 `services/config.local.ts`。首次克隆：

```bash
cp services/config.local.example.ts services/config.local.ts
# 填入真实生产地址
```

### 请求头（三条红线）

`services/client-info.ts` 负责 `X-App-Ut` / `X-App-Version` / `X-Device` / `X-OS`
四个头（`MAX_DEVICE` 128、`MAX_OS` 64）。改这里请遵守：

1. **只给 astral 域名的请求加**
2. **对象存储预签名 PUT 绝不能带** —— 多一个头就会 403 `SignatureDoesNotMatch`
3. **空值不写头**

### 更新检查

`services/upgrade.ts`：`checkAppUpdate` / `checkOfficialVersion`（非官方版本提示后
3 秒退出）/ `isGithub` 加速探测 / `md5` 校验 / `channel` `stable|beta` /
`updateType` `1` 弹窗 `2` 红点 `3` 无提示。

---

## UVue 开发约束

::: warning 文字样式不继承
UVue 的**文字样式不会继承**。`font-size` / `color` / `font-weight` 等必须直接写在
`<text>` 组件上，写在父级 `<view>` 上无效。
:::

- 页面在 `pages/`，路由表在 `pages.json`（当前 38 页，tabBar 为「发现」「我的」）
- Vapor 模式下 CSS 有子集限制，复杂选择器不生效
- 改完务必跑 `npm run check`

---

## 音源包引擎

Android 端在 `qt-js-engine`（WebView / V8）里执行音源包。宿主通过 prelude 注入
`__qtHost.request`，包里的网络请求全部经宿主转发，包侧拿不到 `fetch` /
`XMLHttpRequest` / `WebSocket`（已收缴，调用即抛错）。

::: details 性能教训：UTS 里不要逐字符处理字符串
引擎曾有一个严重的首屏性能问题，根因在 UTS 层的字符串转义：

- UTS 把 `number` 装箱成 `kotlin.Number`，逐字符循环实测 **~3.3 µs / 字符**，
  405 KB 的响应体光转义就 1.2 s
- 更糟的是把转义交给 `String.replace(RegExp, replacer)` → 落到
  `kotlin.text.Regex.replace(CharSequence, Function1)`，**每次命中跨 UTS 调一次闭包
  （150–370 µs）**，405 KB 有 5.5 万次回调 → **20.5 s**，比逐字符还慢 16.5×

最终方案是「单引号字面量 + `search()` 空扫短路」：先用一次纯 Kotlin 扫描判断有没有
需要转义的字符，干净串直接拼字面量，**0 次逐字符 UTS 调用、0 次回调**。
405 KB 实测 **4 ms**（原 1238 ms），首屏中位从 4915 ms 降到 1249 ms。

**结论：UTS 里任何逐字符循环都要警惕；JVM 上纯 Java 的基准不能外推到 UTS 回调路径。**
:::

---

## 常见问题

**改了文件 App 就冷重启** —— HBuilderX 的热重载对本项目表现为设备端冷启动，
这是正常的。

**原生插件改动不生效** —— 必须重新打自定义基座 / 云端打包。

**`npm run check` 报图标错** —— 新增图标后跑 `npm run gen:tab-icons`。
