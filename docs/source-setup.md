# 如何设置音源

轻听的在线能力（搜索、歌单、排行榜、新歌速递、每日推荐、在线播放）**全部来自音源包**，
客户端本身不内置任何第三方取链实现。所以「设置音源」这一步，本质上就是**装音源包**。

没装音源包时应用依然完整可用——本地音乐、播放、歌词、下载、收藏、统计照常工作，
只是不会出现在线入口。

::: tip 一句话流程
**首页「去安装」→ 音源包管理 → 从链接安装**（或检查更新 / 选本地文件）→ 装完自动冒烟自检 → 生效。

只想照着做一遍，直接跳到图文教程：[手机端](#三、手机端图文教程-从链接安装) / [桌面端](#四、桌面端图文教程-从链接安装)；
不想找链接，直接复制[官方音源直链](#二、官方音源直链-可直接复制)。
:::

---

## 一、先分清两种包

音源包是一个 `.js` 文件，按职责分成两类。装的时候**建议两个都装**：只有数据包时能搜不能播，
只有播放包时能播但没内容可浏览。

| 包 | 职责 | 不装的后果 |
|---|---|---|
| **数据包**（`kind:"meta"`） | 搜索、歌单、专辑、歌手、榜单、热词、歌词、封面 | 在线搜索、歌单、榜单、歌词、封面不可用 |
| **播放包**（`kind:"play"`） | 取链——把一首歌解析成可播放的地址 | 在线播放不可用（能搜到、点不开） |

**分成两个包是刻意的**：取链那一层是版权风险较高的一半，拆出去之后它可以独立更换，
搜索与歌单这些体验不受牵连。在线功能失效时，你几乎总是只需要换一个播放包。

---

## 二、官方音源直链（可直接复制）

下面两条就是**当前官方音源包**的直链，按图文教程（[手机端](#三、手机端图文教程-从链接安装) /
[桌面端](#四、桌面端图文教程-从链接安装)）粘贴进输入框即可。
数据包和播放包**两个都要装**，点各自代码框右上角的复制按钮**分别单独复制**，别复制混了。

> 链接挂在 CNB Release 上，**官方发新版本后旧链接会失效（404）**，到时回本页复制新的即可。

<div class="link-cards">

<div class="link-card">

<p class="link-card-head"><span class="link-card-badge">数据包</span> <code>meta-official</code> · 搜索 / 歌单 / 榜单 / 歌词 / 封面</p>

```text
https://cnb.cool/canace/qt-sources-sdk/-/releases/download/2026100703/meta-bundle.js
```

</div>

<div class="link-card">

<p class="link-card-head"><span class="link-card-badge">播放包</span> <code>play-official</code> · 在线播放取链</p>

```text
https://cnb.cool/canace/qt-sources-sdk/-/releases/download/2026100703/play-bundle.js
```

</div>

</div>

---

## 三、手机端图文教程：从链接安装

下面以 **Android 手机端**为例，走一遍「从链接安装」的完整流程。整个过程五步，
**数据包与播放包各装一次**（顺序不限，建议先数据包后播放包）。
链接直接复制[上面那两条](#二、官方音源直链-可直接复制)，不用去别处找。

<div class="shot-grid">

<figure class="shot">
<img src="/source-setup/step-1-home-entry.png" alt="首页弹窗「安装数据包，启用在线功能」，箭头指向红色的「去安装」按钮" loading="lazy" />
<figcaption><b>① 首页点「去安装」</b>未装数据包时，首页会弹窗提示在线功能不可用，点「去安装」直接进音源包管理页。</figcaption>
</figure>

<figure class="shot">
<img src="/source-setup/step-2-source-manage.png" alt="音源包管理页滑到最底部，「安装音源包」区域里的「从链接安装」按钮" loading="lazy" />
<figcaption><b>② 滑到最底下</b>进入音源包管理页后，向下滑到页面底部，找到「安装音源包」区域。</figcaption>
</figure>

<figure class="shot">
<img src="/source-setup/step-3-paste-link.png" alt="「从链接安装」弹窗，输入框里已粘贴音源包的 https 直链，右下角是「下载并校验」" loading="lazy" />
<figcaption><b>③ 选择「从链接安装」</b>粘贴对应的音源包 https 直链，点「下载并校验」。</figcaption>
</figure>

<figure class="shot">
<img src="/source-setup/step-4-meta-pack.png" alt="安装确认弹窗：类型 数据包、名称 官方数据包、id meta-official，显示「官方签名校验通过」" loading="lazy" />
<figcaption><b>④ 安装数据包</b>确认弹窗会列出类型 / 名称 / 版本 / id / 来源，并标注「官方签名校验通过」，点「安装」。</figcaption>
</figure>

<figure class="shot">
<img src="/source-setup/step-5-play-pack.png" alt="安装确认弹窗：类型 播放包、名称 官方播放包、id play-official，显示「官方签名校验通过」" loading="lazy" />
<figcaption><b>⑤ 安装播放包</b>再用同样的方式粘贴播放包链接，装完数据包与播放包，在线功能才完整。</figcaption>
</figure>

</div>

::: warning 数据包与播放包是两个包，都要装
只装**数据包**能搜到内容但点不开（在线播放不可用）；只装**播放包**能播但没内容可浏览
（搜索、歌单、歌词、封面不可用）。两个包的 id 不同——`meta-official` 是数据包，
`play-official` 是播放包——粘贴链接时别搞混。
:::

::: tip 装完怎么确认
安装后会**自动冒烟自检**，通过即生效。列表里能看到「官方数据包」与「官方播放包」都处于
**生效中**，就说明装好了。详见[怎么确认装好了](#九、怎么确认装好了)。
:::

---

## 四、桌面端图文教程：从链接安装

Windows 桌面端的路径与手机端完全一致，只是入口文案与版式不同：首页按钮叫**「去设置页安装」**，
安装区在**「设置 → 音源包」**页签的最下方。同样**数据包与播放包各装一次**。

链接直接复制[上面那两条](#二、官方音源直链-可直接复制)，两个包分别单独复制，别粘混了。

<div class="shot-grid desktop">

<figure class="shot">
<img src="/source-setup/desktop-1-install-prompt.png" alt="桌面端首页弹窗「安装数据包，使用在线功能」，蓝色按钮写着「去设置页安装」" loading="lazy" />
<figcaption><b>① 首页点「去设置页安装」</b>未装数据包时首页会弹窗说明：搜索 / 歌单 / 歌词 / 封面由数据包提供，应用未内置，需自行安装一次，未安装不影响本地音乐播放。点蓝色按钮直接进设置页。</figcaption>
</figure>

<figure class="shot">
<img src="/source-setup/desktop-2-source-tab.png" alt="桌面端「设置 · 音源包」页，红框标出最下方的「安装音源包」区域，含「从链接」「从本地文件」两个按钮与链接输入框" loading="lazy" />
<figcaption><b>② 找到「安装音源包」区域</b>在「设置 → 音源包」页签向下滑到最底部（图中红框）。左侧「从链接」已选中，把 https 直链粘进输入框，再点「安装」。</figcaption>
</figure>

<figure class="shot">
<img src="/source-setup/desktop-3-meta-pack.png" alt="桌面端安装确认弹窗：类型 数据包、名称 官方数据包、包 id meta-official、来源 meta-bundle.js，并标注「官方签名校验通过」" loading="lazy" />
<figcaption><b>③ 安装数据包</b>确认弹窗会列出类型 / 名称 / 版本 / 包 id / 来源，并标注「官方签名校验通过（ed25519，与官方发布密钥匹配）」，核对无误后点「安装」。</figcaption>
</figure>

<figure class="shot">
<img src="/source-setup/desktop-4-play-pack.png" alt="桌面端安装确认弹窗：类型 播放包、名称 官方播放包、包 id play-official、来源 play-bundle.js，并标注「官方签名校验通过」" loading="lazy" />
<figcaption><b>④ 安装播放包</b>再用同样方式粘贴播放包链接。两个都装完后，左上角的「音源」会从「未知」变成实际音源名，在线搜索与在线播放同时可用。</figcaption>
</figure>

</div>

::: tip 桌面端与手机端只是入口不同
两端的安装区界面、确认弹窗字段、签名校验与冒烟自检**完全一致**——同一份音源包，两端通用。
手机端的五步截图见[上一节](#三、手机端图文教程-从链接安装)。
:::

---

## 五、三种安装方式

上面演示的是**方式二（https 直链）**。三种方式任选其一即可，效果完全一样。

### 方式一：官方包（推荐）

1. 打开「**设置 → 音源包管理**」
2. 点「**检查更新**」
3. 客户端从官方清单拉取直链并下载，安装前展示包的身份
   （**类型 / 名称 / 版本 / id / 来源**），官方包会标注「已验签」
4. 确认后落盘并**自动冒烟自检**，通过即生效

官方包支持自动更新：**启动预热 + 4 小时节流**的静默检查，发现有新版本会提示你，
确认后才下载。设置页的「检查更新」按钮会跳过这层节流，立即去查。

### 方式二：https 直链

在音源包管理页粘贴一个 **https** 直链。规则是**只收 https，明文 http 一律拒绝**——
包体是被求值执行的代码，明文链路存在被中间人整体替换的可能。

- 进页面时会**自动检测剪贴板**：如果剪贴板里像是一条音源包直链，会弹出询问，一键安装
- 自定义直链装的包**不参与自动更新**；升级需要重新粘贴新的链接
  （除非这个包自己声明了 `updateUrl`，那时宿主会在启动时帮你探测新版头）

### 方式三：本地文件

已经拿到 `.js` 文件时直接从本地导入（微信 / QQ / 网盘下载的都行），列表里会标注来源为「本地」。

::: tip 多包并存
可以同时装多份播放包，**同一时刻只有一个生效**。列表里每行显示来源（链接 / 本地 / 官方）
与最近失败原因，切换时即时热装载并重新冒烟自检——**试错成本很低，装坏了切回去就行**。
:::

---

## 六、兼容 LX 音源脚本

这是轻听音源体系里最实用的一点：**播放包内置一个 LX 自定义源脚本宿主**。

只要一个脚本是按 **LX 自定义源协议**写的（注册 `lx.on(...)` 事件、通过 `lx.send` 回数据、
用 `utils.crypto` / `utils.buffer` 做加解密），它就能在轻听里被装载、并在两端（Android / Windows）
跑出同样的结果——**同一份脚本，两端可用**。

宿主为了跑通这些脚本做过的事（都写在开源仓库里）：

- **协议模拟**：提供符合 LX 自定义源协议的 `lx` 对象（事件注册、请求回调、脚本自述信息），
  以及 `utils.crypto`（md5 / AES）、`utils.buffer`（utf8 / hex / base64 互转）
- **环境桩**：脚本里常见的 `process`、`window` 探测与定时器反调试都会被安全地接住，
  不会因为环境差异直接崩掉
- **逐字节保全**：混淆脚本体在构建流水线里被**逐字节还原**，因为打包器重打印语法树会破坏
  脚本自身的完整性自校验，导致字符串解密轮转不收敛、陷入同步忙循环
- **挂死守卫**：每条脚本在沙箱里被实际执行一遍，看门狗盯住挂死，挂死即**中止构建**，
  不会把坏脚本发到你手上

::: warning 脚本仍然跑在沙箱里
兼容不等于放权。脚本运行时能用的**只有宿主注入的 `request` 通道**——
`fetch` / `XMLHttpRequest` / `WebSocket` / `Worker` / 文件系统全部是 `undefined`，
也够不到宿主与系统的任何原生桥。安装前还会先做一次内容安全扫描，命中红线直接拒绝并给出
命中词与行号。
:::

一个播放包里可以同时包含**多条线路**，线路类型有 LX 脚本、平台官方接口、以及聚合脚本几种。
某条线路不通时会自动换下一条；本档线路全灭时还会跨源兜底救回，尽量不让你听到失败。

细节见 [音源包机制](/dev/source-pack)；想自己写包，看 [音源包作者指南](/dev/pack-authoring)。

### 手上有洛雪源脚本？自己打包装进来

上面说的是**官方包**内置一个 LX 宿主，能装载官方收录的脚本。
如果你自己手里有一份洛雪源脚本（`.js`），不用等收录——
`qt-sources-sdk` 里有一个打包器，一条命令就能把它变成可安装的播放包：

```bash
node scripts/build-lx-pack.mjs "我的洛雪源.js" --id my-lx-source
```

然后按 [第四节](#四、桌面端图文教程-从链接安装) 里的「从本地文件」装进去即可。
完整步骤、参数与排错见 [洛雪脚本打包](/dev/lx-pack)。

---

## 七、设置默认音源与音质

装好包之后，在「设置」里还有两处需要调：

| 设置项 | 说明 |
|---|---|
| **默认音源** | 搜索与每日推荐优先使用哪个平台。清单由音源包声明，客户端不内置白名单 |
| **播放音质 / 下载音质** | 标准 128k / 高品 320k / 无损 FLAC 三档，**两者相互独立** |

关于音质有两点值得知道：

- 界面上**只展示当前音源真实支持的档位**。某个平台没有真无损，就不会给你 flac 选项，
  而不是让你选了一个永远拿不到的档位
- 客户端会按**实测码率重标档位，只降不升**。所以请求无损却只拿到 320k 时，
  下载文件不会虚标成 `.flac`

播放页还可以**同歌多源**：一首歌在多个平台有资源时，当场切换音源。

---

## 八、启用、切换与卸载

- **启用**：多个播放包并存时，点一下「启用」即可热切换，立即重新做一次取链冒烟自检
- **卸载**：列表里删除即可
- **卸载之后**在线能力消失，应用剩下的一切照常工作

---

## 九、怎么确认装好了

安装或启用播放包后，客户端会自动做一次**冒烟自检**：拿真实歌曲调用取链 + Range 预检。

- 通过 → 立即生效
- 不通过 → **自动回滚**（更新场景回滚到上一个版本；首次安装则保留文件并标注「上次失败」，
  由你决定重试还是删掉）

**手动验证**：随便搜一首歌 → 播放 → 能出声就说明整条链路通了。

---

## 十、装不上 / 不生效怎么办

| 现象 | 先试什么 |
|---|---|
| 首页提示「未安装播放音源包」 | 设置 → 音源包管理 → 检查更新；确认列表里有播放包且处于生效状态 |
| 搜索能用但播放失败 | 播放包不是最新的；检查更新，或换个音源、换首歌 |
| 提示签名校验失败 | 官方保留 id 只有带官方签名才能占用；自己写的包请使用自己的 id |
| 提示命中内容安全红线 | 报错里会给出**命中词与行号**；按提示改包，或联系包作者 |
| 装完标着「上次失败」 | 冒烟自检没过。多数是当时网络不通，重试一次即可 |
| 剪贴板提示没出现 | 部分系统限制后台读取剪贴板；直接把链接粘贴进输入框即可 |

更多问题见[问题答疑](/faq)。反馈渠道见[反馈与贡献](/feedback)。

---

## 相关

- [音源包机制](/dev/source-pack) —— 包模型、签名、安全扫描、生命周期
- [音源包作者指南](/dev/pack-authoring) —— 从零写一个自己的音源包
- [下载安装](/download) —— 先拿到客户端
- [问题答疑](/faq) —— 播放、音质、歌词、权限等问题

<style>
.link-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(320px, 100%), 1fr));
  gap: 16px;
  margin: 20px 0 8px;
}

.link-cards .link-card {
  padding: 14px 16px 4px;
  border: 1px solid var(--vp-c-divider);
  border-left: 4px solid var(--vp-c-brand-1);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
}

.link-cards .link-card-head {
  margin: 0 0 6px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
}

.link-cards .link-card-head code {
  color: var(--vp-c-text-1);
  font-weight: 600;
}

.link-cards .link-card-badge {
  display: inline-block;
  padding: 1px 8px;
  margin-right: 4px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: var(--vp-c-brand-1);
}

.link-cards .link-card div[class*="language-"] {
  margin: 8px 0 10px;
}

.link-cards .link-card div[class*="language-"] pre {
  margin: 0;
}

.link-cards .link-card div[class*="language-"] code {
  font-size: 12.5px;
  /* 只在 / 等可断处折行，别把文件名从中间劈开 */
  white-space: pre-wrap;
  word-break: normal;
  overflow-wrap: anywhere;
  /* 给右上角复制按钮让位 */
  padding-right: 46px;
}

/* 手机上没有 hover，VitePress 默认的复制按钮（opacity:0）永远不出现，
   这两条链接正是给手机用的，所以卡片里的按钮常驻显示。 */
.link-cards .link-card div[class*="language-"] > button.copy {
  top: 8px;
  right: 8px;
  width: 34px;
  height: 34px;
  background-size: 18px;
  opacity: 1;
}

/* 语言角标（text）在卡片里没有信息量，去掉省地方 */
.link-cards .link-card div[class*="language-"] > span.lang {
  display: none;
}

.shot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
  margin: 24px 0;
}

.shot-grid .shot {
  margin: 0;
  padding: 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}

.shot-grid .shot img {
  display: block;
  width: 100%;
  max-width: 320px;
  margin: 0 auto 12px;
  border-radius: 8px;
}

.shot-grid .shot figcaption {
  font-size: 14px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
}

.shot-grid .shot figcaption b {
  display: block;
  margin-bottom: 2px;
  color: var(--vp-c-text-1);
}

/* 桌面端截图是 16:10 横图，手机端的 320px 窄栏会把界面缩得看不清，
   这里放开到整栏宽。 */
.shot-grid.desktop {
  grid-template-columns: repeat(auto-fit, minmax(min(420px, 100%), 1fr));
}

.shot-grid.desktop .shot img {
  max-width: 100%;
}
</style>
