# qt-site

轻听（QuietMusic）官方站点源码 —— 功能介绍、下载安装、开发指南、问题答疑、
用户协议与隐私政策。

基于 [VitePress](https://vitepress.dev/)，通过 GitHub Actions 自动部署到
GitHub Pages。

线上地址：https://barry130.github.io/qt-site/

## 本地预览

```bash
npm install
npm run dev        # http://localhost:5173/qt-site/
```

## 构建

```bash
npm run build      # 产物在 docs/.vitepress/dist
npm run preview
```

## 结构

```
docs/
├── index.md                    首页
├── features.md                 功能介绍
├── download.md                 下载与安装
├── faq.md                      问题答疑
├── agreement.md                用户协议
├── privacy.md                  隐私政策
└── dev/
    ├── index.md                开发指南总览
    ├── pc.md                   qt-pc（Windows）
    ├── mobile.md               qt-uniappx（Android）
    ├── sources.md              qt-sources（音源包工程）
    ├── source-pack.md          音源包机制
    └── pack-authoring.md       音源包作者指南
docs/.vitepress/config.mts      站点配置
```

改 `docs/.vitepress/config.mts` 里的 nav / sidebar 即可增删页面。

## 部署

推送到 `main` 分支即触发 `.github/workflows/deploy.yml`：构建 → 上传 Pages
产物 → 部署。首次需要在仓库 Settings → Pages 里把 Source 设为
**GitHub Actions**。

## 相关仓库

| 仓库 | 内容 |
|---|---|
| [qt-uniappx](https://github.com/barry130/qt-uniappx) | Android / iOS 客户端 |
| [qt-pc](https://github.com/barry130/qt-pc) | Windows 桌面端 |
| [qt-sources](https://github.com/barry130/qt-sources) | 音源包工程 |

## 许可

站点文字内容沿用项目的 Apache-2.0 许可（含补充条款）。
