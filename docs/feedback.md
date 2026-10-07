# 反馈与贡献

轻听是开源项目，**代码托管在两个平台，两边都接受反馈与贡献**：
[GitHub](https://github.com/barry130) 与 [CNB](https://cnb.cool/canace)。
两个仓库内容一致、同步推送，你可以挑网速更好、访问更顺的那个用。

::: tip 最快的通道
只是遇到问题、想吐槽或者提建议？用**应用内的「意见反馈」**就够了——
它会自动带上设备型号、系统版本与应用版本号，定位问题最省事。
要讨论代码、提交改动，再走下面的 Issue / PR 通道。
:::

---

## 仓库入口

| 仓库 | GitHub | CNB |
|---|---|---|
| **qt-uniappx**（Android / iOS 客户端） | [github.com/barry130/qt-uniappx](https://github.com/barry130/qt-uniappx) | [cnb.cool/canace/qt-uniappx](https://cnb.cool/canace/qt-uniappx) |
| **qt-pc**（Windows 桌面端） | [github.com/barry130/qt-pc](https://github.com/barry130/qt-pc) | [cnb.cool/canace/qt-pc](https://cnb.cool/canace/qt-pc) |
| **qt-sources**（音源包工程） | [github.com/barry130/qt-sources](https://github.com/barry130/qt-sources) | [cnb.cool/canace/qt-sources](https://cnb.cool/canace/qt-sources) |
| **quietMusic-site**（本站） | [github.com/barry130/quietMusic-site](https://github.com/barry130/quietMusic-site) | [cnb.cool/canace/quietMusic-site](https://cnb.cool/canace/quietMusic-site) |

---

## 问题反馈（Issues）

**提 Issue 之前**，先看一眼[问题答疑](/faq)——九成的疑问在那里已经有答案
（换源、失效、音质、歌词、桌面歌词、权限、账号同步都覆盖了）。

### 双渠道入口

| 仓库 | GitHub Issues | CNB Issues |
|---|---|---|
| **qt-uniappx** | [Issues](https://github.com/barry130/qt-uniappx/issues) | [Issues](https://cnb.cool/canace/qt-uniappx/-/issues) |
| **qt-pc** | [Issues](https://github.com/barry130/qt-pc/issues) | [Issues](https://cnb.cool/canace/qt-pc/-/issues) |
| **qt-sources** | [Issues](https://github.com/barry130/qt-sources/issues) | [Issues](https://cnb.cool/canace/qt-sources/-/issues) |
| **quietMusic-site** | [Issues](https://github.com/barry130/quietMusic-site/issues) | [Issues](https://cnb.cool/canace/quietMusic-site/-/issues) |

不知道该提到哪个仓库？**Android 端的问题 → qt-uniappx，Windows 端的问题 → qt-pc**，
不确定就随便挑一个，我们会移动它。

### 怎么写一个好 Issue

一个能快速定位的问题报告，通常只需要四行：

```text
平台与安装方式   Android 14 / APK 直装（或 Windows 11 / NSIS 安装包）
复现步骤         打开首页 → 搜索「晴天」→ 点第一首 → 一直转圈
预期与实际       预期能播放，实际停在缓冲，换第二首正常
提示原文         照抄界面上出现的报错文字（错误信息里常带关键线索）
```

补充这些会更快：

- **音源包版本**（设置 → 音源包管理里能看到）与**应用版本**（关于页）
- 具体**歌曲名 + 音源**（例如「《晴天》 / 网易云」）
- **偶发还是必现**；换源 / 换歌之后是否还复现
- 在线取链类问题，说明当时的**网络环境**（移动网络 / 家庭宽带 / 是否开了代理）

::: warning 请勿在 Issue 里粘贴敏感信息
**不要**贴账号密码、token、手机号、邮箱验证码，也不要上传完整的音源包文件——
那类内容我们无法处理，也不希望它出现在公开页面。
:::

---

## 代码贡献（Pull Requests）

欢迎提交改进。四个仓库都接受 PR，两个平台都可以提：

| 仓库 | GitHub PR | CNB PR |
|---|---|---|
| **qt-uniappx** | [Pull requests](https://github.com/barry130/qt-uniappx/pulls) | [Pull requests](https://cnb.cool/canace/qt-uniappx/-/pulls) |
| **qt-pc** | [Pull requests](https://github.com/barry130/qt-pc/pulls) | [Pull requests](https://cnb.cool/canace/qt-pc/-/pulls) |
| **qt-sources** | [Pull requests](https://github.com/barry130/qt-sources/pulls) | [Pull requests](https://cnb.cool/canace/qt-sources/-/pulls) |
| **quietMusic-site** | [Pull requests](https://github.com/barry130/quietMusic-site/pulls) | [Pull requests](https://cnb.cool/canace/quietMusic-site/-/pulls) |

### 动手之前

1. **先开一个 Issue 说清楚你要做什么**——尤其是较大的改动。
   避免你写完了才发现方向不合，或者已经有人在做同一件事。
2. **读对应仓库的说明与文档**：移动端 → [qt-uniappx（Android）](/dev/mobile)，
   桌面端 → [qt-pc（Windows）](/dev/pc)，音源包 → [qt-sources](/dev/sources)，
   开发总览 → [开发指南](/dev/)。
3. **保持改动聚焦**：一个 PR 解决一件事。顺手的大重构请单独提。

### 几条硬性约定

这些不是风格偏好，是仓库的构建门槛，**提交前请务必满足**：

- **`qt-sources/src/` 不得 import 主应用或任何宿主 API**。
  这一层要保持**零运行时依赖**，产物才能在两端原样跑。当前对外依赖数是 0，请保持
- **不要绕过 qt-sources 的构建守卫**。其中两步是线上事故的直接产物：一步把混淆脚本体
  恢复为逐字节原文，另一步在沙箱里逐个执行脚本体、用看门狗拦挂死。跳过它们会导致
  脚本自校验被破坏，进而在真机上死循环
- **不要手写派生文件**。桌面端的版本号 / 产品名 / 应用 ID 只在唯一配置源里改，
  其余文件由同步脚本生成；手改会被校验拦下
- **移动端改完 `.uvue` / UTS 后跑一次静态检查**，并确认图标定义与引用一一对应
- **音源包的安全规则表两端逐条一致**（Android 与 Windows 各一份实现），改一边必须同步另一边，
  否则同一个包会在两端得到不同裁决

### PR 描述里写清楚

- 解决了什么问题（关联的 Issue 编号）
- 怎么验证的（跑了什么命令 / 在什么设备上试过）
- 有没有影响已有行为，特别是**音源包契约、签名校验、安全扫描**这几处

---

## 文档与站点

本站源码在 [quietMusic-site](https://github.com/barry130/quietMusic-site)
（[CNB 镜像](https://cnb.cool/canace/quietMusic-site)）。发现错别字、过时描述、
不准确的说明，直接提 Issue 或者改一版 PR 都很欢迎——每页右上角有「在 GitHub 上编辑此页」。

---

## 行为准则

参与讨论与贡献时，请保持基本的技术礼貌：

- 对事不对人。指出问题可以尖锐，但不必刻薄
- 提供信息而不是情绪。「不能用」很难定位，「复现步骤 + 提示原文」可以
- 尊重音乐版权。**请勿在仓库、Issue 或 PR 里请求或分享任何受版权保护的内容**——
  这类内容会被直接删除

---

## 相关

- [问题答疑](/faq) —— 提 Issue 前先看这里
- [如何设置音源](/source-setup) —— 装包、换源、音质设置
- [开发指南](/dev/) —— 环境准备与仓库边界
- [用户协议](/agreement) · [隐私政策](/privacy)
