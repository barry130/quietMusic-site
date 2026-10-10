import { defineConfig } from "vitepress";

// 站点基路径：站点的输出目录就是根，部署在域名根目录（如 EdgeOne Pages 的
// *.edgeone.app 默认域名，或绑定的自定义域）。
// 若将来要挂在某个子路径下（如 GitHub Pages 项目站点 /<repo>/），把 base 改成对应前缀。
const base = "/";

export default defineConfig({
  base,
  title: "轻听",
  description:
    "轻听（QuietMusic）—— Android / Windows 双端音乐应用。音源包热更新，兼容 LX 音源脚本，接口失效无需重装客户端。",
  lang: "zh-CN",
  cleanUrls: true,
  lastUpdated: true,

  head: [
    ["link", { rel: "icon", type: "image/png", href: "/favicon.png" }],
    ["meta", { name: "theme-color", content: "#31c27c" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:title", content: "轻听 QuietMusic" }],
    [
      "meta",
      {
        property: "og:description",
        content:
          "Android / Windows 双端音乐应用，音源包热更新，兼容 LX 音源脚本",
      },
    ],
  ],

  themeConfig: {
    nav: [
      { text: "首页", link: "/" },
      { text: "功能介绍", link: "/features" },
      { text: "下载安装", link: "/download" },
      { text: "如何设置音源", link: "/source-setup" },
      { text: "开发指南", link: "/dev/" },
      { text: "问题答疑", link: "/faq" },
      {
        text: "更多",
        items: [
          { text: "反馈与贡献", link: "/feedback" },
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
            { text: "音源包作者指南", link: "/dev/pack-authoring" },
            { text: "洛雪脚本打包", link: "/dev/lx-pack" },
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
            { text: "如何设置音源", link: "/source-setup" },
          ],
        },
        {
          text: "帮助",
          items: [
            { text: "问题答疑", link: "/faq" },
            { text: "反馈与贡献", link: "/feedback" },
          ],
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
        '仅供学习与技术交流使用。本项目不存储、不分发任何音乐内容，请尊重音乐版权。<br />本站由 <a href="https://edgeone.ai/products/pages" target="_blank" rel="noreferrer">腾讯云 EdgeOne Pages</a> 提供构建与托管支持，谨致谢意。',
      copyright:
        'Copyright © 2026 轻听 · 代码以 <a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noreferrer">Apache-2.0</a> 发布',
    },

    editLink: {
      pattern: "https://cnb.cool/canace/quietMusic-site/-/edit/main/docs/:path",
      text: "在 CNB 上编辑此页",
    },

    socialLinks: [
      {
        // CNB 在内置图标集里没有对应项，直接用内联 SVG（Simple Icons 的 git 标记），
        // 避免运行时去 iconify CDN 取图。
        icon: {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M23.546 10.93L13.067.452c-.604-.603-1.582-.603-2.188 0L8.708 2.627l2.76 2.76c.645-.215 1.379-.07 1.889.441.516.515.658 1.258.438 1.9l2.658 2.66c.645-.223 1.387-.078 1.9.435.721.72.721 1.884 0 2.604-.719.719-1.881.719-2.6 0-.539-.541-.674-1.337-.404-1.996L12.86 8.955v6.525c.176.086.342.203.488.348.713.721.713 1.883 0 2.6-.719.721-1.889.721-2.609 0-.719-.719-.719-1.879 0-2.598.182-.18.387-.316.605-.406V8.835c-.217-.091-.424-.222-.6-.401-.545-.545-.676-1.342-.396-2.009L7.636 3.7.45 10.881c-.6.605-.6 1.584 0 2.189l10.48 10.477c.604.604 1.582.604 2.186 0l10.43-10.43c.605-.603.605-1.582 0-2.187"/></svg>',
        },
        link: "https://cnb.cool/canace/quietMusic-site",
        ariaLabel: "CNB",
      },
      {
        // GitHub 图标指向真正的 GitHub 镜像（代码同样托管在这里，以 CNB 为准）。
        icon: "github",
        link: "https://github.com/barry130",
        ariaLabel: "GitHub 镜像",
      },
    ],
  },

  markdown: {
    lineNumbers: false,
  },
});
