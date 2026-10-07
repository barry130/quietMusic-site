import { defineConfig } from "vitepress";

// 站点基路径：GitHub Pages 项目站点挂在 https://barry130.github.io/qt-site/
// 若将来绑定自定义域（如 qt.canace.cn），把 base 改成 "/"。
const base = "/qt-site/";

export default defineConfig({
  base,
  title: "轻听",
  description:
    "轻听（QuietMusic）—— 本地音乐播放器 + 可选在线聚合。Android / Windows 双端，音源包热更新，接口失效无需重装。",
  lang: "zh-CN",
  cleanUrls: true,
  lastUpdated: true,

  head: [
    ["link", { rel: "icon", type: "image/png", href: "/qt-site/favicon.png" }],
    ["meta", { name: "theme-color", content: "#31c27c" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:title", content: "轻听 QuietMusic" }],
    [
      "meta",
      {
        property: "og:description",
        content: "本地音乐播放器 + 可选在线聚合，Android / Windows 双端",
      },
    ],
  ],

  themeConfig: {
    nav: [
      { text: "首页", link: "/" },
      { text: "功能介绍", link: "/features" },
      { text: "下载安装", link: "/download" },
      { text: "开发指南", link: "/dev/" },
      { text: "问题答疑", link: "/faq" },
      {
        text: "条款",
        items: [
          { text: "用户协议", link: "/agreement" },
          { text: "隐私政策", link: "/privacy" },
        ],
      },
    ],

    sidebar: {
      "/dev/": [
        {
          text: "开发指南",
          items: [
            { text: "总览与仓库边界", link: "/dev/" },
            { text: "音源包机制", link: "/dev/source-pack" },
            { text: "qt-pc（Windows）", link: "/dev/pc" },
            { text: "qt-uniappx（Android）", link: "/dev/mobile" },
            { text: "qt-sources（音源包工程）", link: "/dev/sources" },
            { text: "音源包作者指南", link: "/dev/pack-authoring" },
          ],
        },
      ],
      "/": [
        {
          text: "开始",
          items: [
            { text: "首页", link: "/" },
            { text: "功能介绍", link: "/features" },
            { text: "下载安装", link: "/download" },
          ],
        },
        {
          text: "帮助",
          items: [{ text: "问题答疑", link: "/faq" }],
        },
        {
          text: "条款",
          items: [
            { text: "用户协议", link: "/agreement" },
            { text: "隐私政策", link: "/privacy" },
          ],
        },
      ],
    },

    search: {
      provider: "local",
      options: {
        translations: {
          button: { buttonText: "搜索文档", buttonAriaLabel: "搜索文档" },
          modal: {
            noResultsText: "没有找到结果",
            resetButtonTitle: "清除查询条件",
            footer: {
              selectText: "选择",
              navigateText: "切换",
              closeText: "关闭",
            },
          },
        },
      },
    },

    outline: {
      level: [2, 3],
      label: "本页目录",
    },

    docFooter: {
      prev: "上一页",
      next: "下一页",
    },

    footer: {
      message:
        "仅供学习与技术交流使用。本项目不存储、不分发任何音乐内容，请尊重音乐版权。",
      copyright:
        'Copyright © 2026 轻听 · 代码以 <a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noreferrer">Apache-2.0</a> 发布',
    },

    editLink: {
      pattern: "https://github.com/barry130/qt-site/edit/master/docs/:path",
      text: "在 GitHub 上编辑此页",
    },

    socialLinks: [{ icon: "github", link: "https://github.com/barry130" }],
  },

  markdown: {
    lineNumbers: false,
  },
});
