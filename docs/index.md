---
layout: home

hero:
  name: 轻听
  text: 用音乐连接每一刻
  tagline: 本地音乐播放器 + 可选在线聚合 · Android / Windows 双端
  image:
    src: /logo.png
    alt: 轻听
    width: 128
    height: 128
  actions:
    - theme: brand
      text: 下载安装
      link: /download
    - theme: alt
      text: 功能介绍
      link: /features
    - theme: alt
      text: 开发指南
      link: /dev/

features:
  - icon: 💿
    title: 本地优先
    details: 扫描本地目录即成音乐库，播放、歌词、下载、收藏全部开箱可用，不依赖任何在线音源。
  - icon: 🔌
    title: 音源包热更新
    details: 在线取链逻辑以「音源包」形式下发，接口失效无需重装客户端，装个新包就修好。
  - icon: 🖥️
    title: 双端同源
    details: Android 与 Windows 共用同一份音源包产物，一份实现两端生效。
  - icon: 🎚️
    title: 音质可选
    details: 标准 128k / 高品 320k / 无损 FLAC，播放与下载音质相互独立。
  - icon: 📝
    title: 桌面歌词
    details: 系统悬浮窗逐行歌词，可拖动、可锁定，字号颜色字体即时生效。
  - icon: 🔒
    title: 边界清晰
    details: 仓库不内置、不分发任何第三方音源实现；风险与责任边界写在补充条款里。
---

## 这是什么

**轻听**是一个以**本地音乐播放**为核心的播放器。装上就能用：扫描你的音乐目录，
播放、歌词、收藏、下载、统计全部可用，全程不需要联网。

在线能力是**可选增强**，而且被设计成一层可插拔的东西——**音源包**。
音源包不是本项目的组成部分，它由使用者自行获取与安装，取链逻辑（把一首歌变成
一个可播放地址）全部封装在里面。这样设计带来两个直接好处：

- 第三方平台的接口随时可能变动，**改接口不用发新版客户端**，推一个音源包就行；
- 本仓库因此可以只包含纯客户端代码，**不分发任何第三方取链实现**。

## 三个仓库

| 仓库 | 平台 | 说明 |
|---|---|---|
| [qt-uniappx](https://github.com/barry130/qt-uniappx) | Android / iOS | UniAppX（UVue + UTS）客户端，含音频内核、悬浮窗歌词、音源包引擎等原生插件 |
| [qt-pc](https://github.com/barry130/qt-pc) | Windows | Tauri 2 + React 19 + Rust 桌面端 |
| [qt-sources](https://github.com/barry130/qt-sources) | 平台无关 | 音源实现与打包流程，产物同时服务上面两端 |

## 立刻开始

<div class="start-grid">

### 普通用户

从 [下载安装](/download) 拿到客户端，装好后按引导安装音源包。
遇到问题先看 [问题答疑](/faq)。

### 开发者

想跑起来改代码、或写自己的音源包，看 [开发指南](/dev/)。
音源包作者请直接读 [音源包作者指南](/dev/pack-authoring)。

</div>

<style>
.start-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-top: 20px;
}
.start-grid > div {
  border: 1px solid var(--vp-c-border);
  border-radius: 10px;
  padding: 4px 18px 14px;
  background: var(--vp-c-bg-soft);
}
.start-grid h3 {
  margin-top: 14px;
  border-top: none;
  padding-top: 0;
}
</style>

## 声明

> 仅供学习与技术交流使用。本项目不存储、不分发任何音乐内容；音源包由使用者自行
> 获取并自担风险，请勿用于商业用途，并请尊重音乐版权。
> 「QQ 音乐」「网易云音乐」「酷我」「酷狗」「咪咕」等名称与商标归各自权利人所有，
> 本项目仅在描述兼容性时作合理引用，与上述平台无任何隶属或合作关系。
