# qt-uniappx（Android 移动端）

[UniAppX](https://uniapp.dcloud.net.cn/uni-app-x/)（UVue + UTS + Vapor 编译模式），一套代码同时
出 Android 与 iOS 包，目前以 Android 为主线。仓库 <https://github.com/barry130/qt-uniappx>，
包名 `com.qt.app`，appid `__UNI__7AC1B12`。定位是**本地音乐播放器**，在线聚合只是可选增强。

## 环境要求

| 依赖 | 要求 |
|---|---|
| HBuilderX | 5.x 或更高（README 推荐）；插件声明的引擎下限是 `^4.66` |
| Node.js | 任意 LTS，只用来跑 `tools/` 下的静态检查 |
| Android SDK | 通过 HBuilderX 配置；`minSdkVersion 26` / `targetSdkVersion 34` 在 `manifest.json` |
| 真机 / 模拟器 | **必须自定义基座或云端打包** |

仓库没有钉住 JDK 与 Android SDK 的具体版本，它们由 HBuilderX 的本地配置决定。

::: danger 标准基座跑不起来
项目依赖 5 个 UTS 原生插件，标准基座不含它们：

| 插件 | 职责 |
|---|---|
| `qt-app-native` | 原生能力桥：媒体扫描与删除、公共目录写入、权限查询、设置页跳转、安装 APK |
| `qt-audio-player` | 播放内核：media3 时间线 + 前台服务 + 原生通知栏 + 桌面歌词悬浮窗 |
| `qt-js-engine` | 音源包执行引擎（系统 WebView 的 V8） |
| `qt-stat` | 匿名统计采集与批量上报 |
| `qt-ui` | Qt UI 组件模块（`dcloudext.type: "component"`） |

`.hbuilderx/launch.json` 已把调试方式配成 `playground: "custom"`。用标准基座会在调用原生能力
时报错，出现「找不到悬浮窗授权入口」这类假故障。早期还有一个独立的 `qt-media-store` 负责公共
媒体库写入，现已**合并进 `qt-app-native`**；看到旧文档说「四个插件」时按上面五个理解。
:::

## 常用命令

```bash
npm install            # 首次克隆后装依赖（唯一运行时依赖是 pinia）
npm run check          # 静态检查 .uvue（提交前必跑）
npm run gen:tab-icons  # 重新生成 tabBar 图标
```

`npm run check` 实际是 `node tools/check-uvue.mjs`：用 `@vue/compiler-sfc` 解析每个页面 /
组件的 template、script、style 抓结构性问题；校验 `<QtIcon name="…">` 引用的图标都在
`uni_modules/qt-ui/services/icons.ts` 有定义，并报告**定义了却没人引用**的图标；扫描模板里
残留的「把符号当图标」字形（`♥` `▶` `×`）。基线：**checked 57 files, 0 with errors；
icons defined: 49, referenced: 49**。

::: warning 它不是编译器
脚本只覆盖 SFC 与模板语法层面。UTS 类型检查与 Vapor CSS 编译只有真跑一次 HBuilderX 构建才
知道——全绿不等于能编过。
:::

## 目录结构

```
pages/           页面（34 个，路由表 pages.json；tabBar 只有「发现」「我的」）
services/        服务层：网络、播放器、桌面歌词、音源包与引擎、升级、公告、统计入口…
stores/          Pinia 全局状态（player / downloads / dislikes / lyric-offset / source*…）
uni_modules/     qt-ui（唯一 UI 库）+ qt-app-native / qt-audio-player / qt-js-engine / qt-stat
composables/     页面级组合式函数        utils/   纯工具（lrc.uts 歌词解析）
types/           TS 类型定义             static/  静态资源（不含音源包）
styles/          全局样式（glass.css）   tools/   校验与生成脚本
docs/            设计文档               manifest.json / pages.json  应用与路由配置
```

## 开发流程

1. HBuilderX 打开仓库根目录；首次克隆先 `npm install`。
2. **运行 → 运行到手机或模拟器 → 制作自定义调试基座**（标准基座缺上面五个插件）。
3. 改 `.uvue` 的热重载在本项目表现为设备端**冷重启**，属正常现象。
4. 改过 `uni_modules/` 里任何 UTS 代码后必须重新编译插件并**重建基座**；HBuilderX 会按文件
   指纹跳过没变化的插件，必要时加 `--cleanCache true` 强制重编。

## 关键配置

### 版本号

`manifest.json` 是唯一真源：`versionName` `3.0.7`、`versionCode` `"307"`（字符串）。运行时由
`services/app-version.ts` 从 `uni.getAppBaseInfo()` 读回，代码里不维护第二份常量——**发版只改
manifest**。同一文件里开着 `uni-app-x.vapor: true`、`vapor-render-target: "bytecode"`、
`styleIsolationVersion: "2"`；打包相关是 `abiFilters ["arm64-v8a"]`、`minSdkVersion "26"`、
`targetSdkVersion "34"`，`nativePlugins` 里只有 `DCloud-UniAppX-FileProvider`。

第三方音乐接口与封面大量是 `http://`，而 Android 9+ 默认禁止明文流量，所以
`app-android/AndroidManifest.xml`（会与 DCloud 默认清单合并）显式放行
`android:usesCleartextTraffic="true"`；不放行的话发行包会直接报 `CLEARTEXT not permitted`。

### API 基地址

`services/config.ts` 按环境分离：`API_BASE_URL_DEV` 可提交，`USE_DEV` 是开关，实际生效的
`API_BASE_URL` 由 `services/http.ts` 取用。生产地址放在**不提交**的 `services/config.local.ts`：

```bash
cp services/config.local.example.ts services/config.local.ts   # 填入真实生产地址
```

### 请求头（三条红线）

`services/client-info.ts` 统一构造四个头，服务端两条链路消费它们：接口统计
（`stat_api_hourly` 的 ut / app_version）与反馈提交（`sys_feedback` 的
platform / app_version / device / os）。

| 头 | 取值 |
|---|---|
| `X-App-Ut` | `app-android` / `app-ios` / `app-windows`（qt-pc）/ `web`（管理台），条件编译选平台 |
| `X-App-Version` | `manifest.json` 的 `versionName` |
| `X-Device` | `uni.getDeviceInfo().deviceModel`，截断到 128 |
| `X-OS` | `osName + " " + osVersion`，截断到 64 |

1. **只给 astral 域名的请求加**——`services/http.ts` 先用 `isAstralUrl()` 判定，为真才调
   `mergeClientHeaders()`（刷新 Token 与主请求两处）
2. **对象存储预签名 PUT 绝不能带**——多一个头就 403 `SignatureDoesNotMatch`
3. **空值不写头**——取不到设备型号 / 系统版本时直接跳过

绕过 `http.ts` 直接用 `uni.request` 的调用点（`services/source-update.uts`、
`uni_modules/qt-stat` 上报器）必须自己调 `mergeClientHeaders()`。反过来，第三方直链与音源加速
探测**不要**带这些头——那是把本机信息送给别人。

`services/upgrade.ts` 负责应用自身升级：`checkAppUpdate` / `checkOfficialVersion`（非官方版本
提示后 3 秒退出）/ `isGithub` 加速探测 / `md5` 校验；`channel` 分 `stable|beta`，`updateType`
`1` 弹窗、`2` 红点、`3` 无提示。

## UVue 开发约束

::: warning 文字样式不继承
写在父级 `<view>` 上的 `font-size` / `color` / `font-weight` 永远到不了子 `<text>`，文字静默
回退到 css reset（`font-size: 16px`、`color: #000000`）。每个文字属性都必须写在 `<text>` 自身。
:::

| 约束 | 说明 |
|---|---|
| 选择器 | 不要后代 / 子 / 兄弟 / 复杂组合选择器；状态 class 直接绑到目标节点 |
| 宽度 | 不要 `max-width: 100%`；脚本算出最终宽度，内联绑 `width: Npx` |
| Web-only CSS | `linear-gradient`、`backdrop-filter`、CSS 变量在 Vapor 下不可用 |
| `box-shadow` | Android 上会导致点击穿透 / 命中丢失，层级用 `border` + surface 色差表达 |
| `aria-*` | 内置元素上会被拒绝并丢弃，当前没有无障碍标签 API |
| 尺寸单位 | 组件尺寸用 `rpx`，跟窗口相关的宽度用运行时算出的 `px` |
| SCSS 变量 | `uni.scss` 的 `$变量`只在 `uni.scss` 内有效；页面 / 组件 `<style>` 里写会报 `property value $x is not valid for color` 并静默丢弃属性。要随主题变化的值走 `uni_modules/qt-ui/stores/theme.ts` + `:class` |
| 页面外壳 | 页面根节点必须是 `qt-page-frame`，沉浸式媒体页可传 `:full-width="true"`；业务页面根节点不要再写不透明背景色，否则会盖住皮肤背景和壁纸 |
| 宽屏 | 默认断点 `720px`，但模拟器经高 DPI 缩放后 `windowWidth` 可能只有 400 左右，所以 `isWide` 同时也看**横屏**；响应式组件统一用 `uni_modules/qt-ui/composables/use-qt-layout.ts` |

## 新增一个页面

1. 建目录 `pages/<name>/index.uvue`，页面根节点用 `qt-page-frame`：

   ```vue
   <template>
     <qt-page-frame :max-width="960"><view class="page">…</view></qt-page-frame>
   </template>
   <script setup lang="ts">
   import QtPageFrame from "@/uni_modules/qt-ui/components/qt-page-frame/qt-page-frame.uvue";
   import { useQtLayout } from "@/uni_modules/qt-ui/composables/use-qt-layout";
   const layout = useQtLayout(720);
   </script>
   ```

2. 在 `pages.json` 的 `pages` 数组里登记，`style` 给 `navigationBarTitleText`；沉浸式页面用
   `"navigationStyle": "custom"`，此时用 `qtStatusBarPx()` 给内容让位。
3. 需要新图标就去 `uni_modules/qt-ui/services/icons.ts` 加定义，**并且确保有人引用**——只定义
   不引用会被 `npm run check` 判失败。UI 组件一律放
   `uni_modules/qt-ui/components/<name>/<name>.uvue`，不要在根级 `components/` 新建。
4. 跑 `npm run check`，再做一次真机 HBuilderX 构建，紧凑与宽屏两种视口都看一遍。

## 音源包引擎

Android 端在 `qt-js-engine`（系统 WebView 的 V8）里执行音源包，宿主契约版本
`HOST_API_VERSION = 1`，包侧 `bundleInfo()` 报回的版本对不上就拒绝装载。宿主通过 prelude 注入
`__qtHost.request`，包里所有网络请求都经宿主转发，包侧拿不到 `fetch` / `XMLHttpRequest` /
`WebSocket`（已收缴，调用即抛错）。

- JS→原生的通信是**轮询队列**：JS 把待办推进队列，原生每 20ms 拉一次；`evaluateJavascript`
  拿不到 Promise 的值也不回传异常，所以只求值**同步版**，错误靠信封回传。进出引擎的字符串强制
  ASCII，出引擎的中文在 UTS 侧还原
- 包体与状态落在 `filesDir/source-bundle/`（`state.json` schema 3 + `install/<packId>/`），
  不放 uni storage——包体约 2MB，storage 是给小数据的
- 官方包身份靠 ed25519 尾部签名块（`__QT_SIGN__`）+ 内置公钥硬校验，与安装渠道无关
- 更新发现走「各包自述 `updateUrl` 探测 + astral manifest」两条路，按包独立节流 4 小时，
  **只提示不安装**：确认后下载 → 校验头 → 替换 → 生效，失败回滚 `.prev`

启动时 `App.uvue` 的 `onLaunch` 先 `applyLegacyInsets()`（三星 One UI 手势导航的 edge-to-edge
首屏竞态）、`refreshQtLayout(720)`、恢复各 store，再 `prewarmSourceEngine()` 把已安装的包装进
引擎（全程失败静默），3 秒后开始探测更新，8 秒还没挂载则触发启动守卫。

::: details 性能教训：UTS 里不要逐字符处理字符串
UTS 把 `number` 装箱成 `kotlin.Number`，逐字符循环实测 **~3.3 µs / 字符**；把转义交给
`String.replace(RegExp, replacer)` 更糟——它落到 `kotlin.text.Regex.replace`，**每次命中跨 UTS
调一次闭包（150–370 µs）**，405 KB 要 20.5 s。终方案「单引号字面量 + `search()` 空扫短路」实测
4 ms（原 1238 ms），首屏中位 4915 ms → 1249 ms。
:::

## 常见问题

**改了文件 App 就冷重启**——热重载对本项目表现为设备端冷启动，正常。

**原生插件改动不生效**——必须重新打自定义基座 / 云端打包。

**`npm run check` 报图标错**——新增图标后跑 `npm run gen:tab-icons`；如果是「定义了却没引用」，
删掉定义或补上引用，两者必须一一对应。

## 下一步

- 音源包怎么装、怎么签名 → [音源包机制](/dev/source-pack)
- 想自己写一个播放包 → [音源包作者指南](/dev/pack-authoring)
- 桌面端怎么构建 → [qt-pc（Windows）](/dev/pc)
- 连不上、装不上、取不到链 → [问题答疑](/faq)
