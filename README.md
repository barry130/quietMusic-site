# quietMusic-site

轻听（QuietMusic）官方站点源码 —— 功能介绍、下载安装、开发指南、问题答疑、
用户协议与隐私政策。

基于 [VitePress](https://vitepress.dev/)，产物上传到
[EdgeOne Pages](https://pages.edgeone.ai/)（免费档）。

## 本地预览

```bash
npm install
npm run dev        # http://localhost:5173/
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

站点部署在 **EdgeOne Pages** 免费档（免费计划官方承诺长期可用），直接用 CLI
上传构建产物。base 为 `/`，挂在默认域名根目录；将来若改绑子路径，需要同步
改 `docs/.vitepress/config.mts` 里的 `base`。

### 首次配置

1. 打开 [Makers 控制台](https://console.cloud.tencent.com/edgeone/pages) →
   **API Token** → Create API Token，生成一个 token。
2. 复制环境变量模板并填入：

   ```bash
   cp .env.example .env.local
   ```

   ```ini
   EDGEONE_PROJECT_NAME=quietmusic-site      # 首次部署会创建同名项目，之后同名即更新
   EDGEONE_PAGES_API_TOKEN=<你的 token>
   ```

   `.env.local` 已被 `.gitignore` 忽略，token 不会入库。

### 发布

```bash
npm run build
npm run deploy            # 生产环境
npm run deploy:preview    # 预发环境（先预览再上生产）
```

`scripts/deploy.mjs` 只做三件事：读 `.env.local`、校验 `index.html` 已生成、
调用项目内的 `edgeone` CLI 执行 `makers deploy docs/.vitepress/dist`。缺少
token 或未构建时会直接报错退出，不会带着残缺产物上生产。

### 源码仓库

本仓库双推到两个远端（GitHub 主、CNB 备），沿用 astral 的惯例把 CNB 配成
origin 的第二条 pushurl：

```bash
git remote add origin https://github.com/barry130/quietMusic-site.git
git remote set-url --add --push origin https://cnb.cool/canace/quietMusic-site.git
```

一次 `git push origin main` 会同时推到两个远端。GitHub 在本机需要走代理、
CNB 需要直连，可以按远端单独配：

```bash
git config --local remote.origin.proxy socks5h://127.0.0.1:10808
```

均已配好，`git remote -v` 可见 origin 有两条 push 地址。**注意：这两个只是
源码仓库，站点本身不走 Git 自动发布**，仍需按上面的步骤执行 `npm run deploy`。

## 相关仓库

| 仓库 | 内容 |
|---|---|
| [qt-uniappx](https://github.com/barry130/qt-uniappx) | Android / iOS 客户端 |
| [qt-pc](https://github.com/barry130/qt-pc) | Windows 桌面端 |
| [qt-sources](https://github.com/barry130/qt-sources) | 音源包工程 |

## 许可

站点文字内容沿用项目的 Apache-2.0 许可（含补充条款）。
