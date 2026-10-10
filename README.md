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
npm run build       # 产物在 docs/.vitepress/dist
npm run preview
npm run check:links # 校验站内链接与锚点（需先 build）
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
    ├── source-pack.md          音源包机制
    ├── pack-authoring.md       音源包作者指南
    └── lx-pack.md              洛雪（LX）音源脚本打包与使用
docs/.vitepress/config.mts      站点配置
.cnb.yml                        CNB 流水线：push main → EdgeOne Makers Webhook（方式 A'）
edgeone.json                    EdgeOne Git 集成的构建配置（方式 A）
scripts/check-links.mjs         站内链接与锚点校验（只读，不参与构建）
scripts/deploy.mjs              EdgeOne CLI 部署（手工兜底方式 B）
```

改 `docs/.vitepress/config.mts` 里的 nav / sidebar 即可增删页面。改完链接后跑一次
`npm run build && npm run check:links`，它会把解析不到的页面与锚点全部列出来。

## 部署

站点部署在 **EdgeOne Pages** 免费档（服务器头 `Server: edgeone makers`），挂腾讯云默认
域名 `quietmusic.canace.cn`。push 到 `main` 即自动部署，**无需任何手工操作**，
两条并存的触发路径：

| 路径 | 触发链路 | 说明 |
| --- | --- | --- |
| 方式 A | push → GitHub → EdgeOne Git 集成代构建 | 控制台「导入 Git 仓库」绑 `barry130/quietMusic-site` |
| 方式 A' | push → CNB `.cnb.yml` → EdgeOne Makers Webhook | 仓库根目录 `.cnb.yml`，与方式 A 互不冲突 |

手工方式（本地构建 + CLI 上传）只在上面两条都不可用时才需要。

base 为 `/`，挂在默认域名根目录；将来若改绑子路径，需要同步改
`docs/.vitepress/config.mts` 里的 `base`。

### 方式 A：Git 集成，腾讯云代构建（推荐）

控制台 → 创建项目 → **导入 Git 仓库** → 选 GitHub 的
`barry130/quietMusic-site`，生产分支填 `main`。构建配置已写在仓库根目录的
`edgeone.json` 里，导入时会自动读取：

```json
{
  "installCommand": "npm install",
  "buildCommand": "npm run build",
  "outputDirectory": "docs/.vitepress/dist",
  "nodeVersion": "20.18.0"
}
```

四项在控制台都能覆盖（项目设置 → 构建部署配置）。注意两点：

- **输出目录**是 `docs/.vitepress/dist`，不是默认的 `dist`。这是 VitePress 的
  `vitepress build docs` 产物位置，填错会 404。
- **Node 版本**选 20.18.0。腾讯云预装 14.21.3 / 16.20.2 / 18.20.4 / 20.18.0 /
  22.11.0 / 22.17.1 / 22.21.1 / 24.5.0 / 24.11.0 / 24.18.0，20 和 22 都能跑
  VitePress；仓库里另有 `.nvmrc`（20.18.0）作兜底，平台见到 `.nvmrc` 会自动
  切版本。

**不需要任何环境变量** —— 站点是纯静态的，构建过程不读密钥。以后 push 到
`main` 即自动重新构建发布。

选了 Git 集成就**不能**再改成直接上传，反之亦然；要换得新建项目。

### 方式 B：本地构建 + CLI 上传

不用 Git 集成时用这条。先拿 token：打开
[Makers 控制台](https://console.cloud.tencent.com/edgeone/pages) → **API Token**
→ Create API Token，然后：

```bash
cp .env.example .env.local     # 填入 EDGEONE_PAGES_API_TOKEN
npm run build                  # 必须先构建
npm run deploy                 # 生产环境
npm run deploy:preview         # 预发环境（先预览再上生产）
```

`scripts/deploy.mjs` 只做三件事：读 `.env.local`、校验 `index.html` 已生成、
调用项目内的 `edgeone` CLI 执行 `makers deploy docs/.vitepress/dist`。缺少
token 或未构建时会直接报错退出，不会带着残缺产物上生产。`.env.local` 已被
`.gitignore` 忽略，token 不会入库。

### 直接上传（网页拖拽）

控制台 → 创建项目 → 直接上传，把 `docs/.vitepress/dist` 整个目录拖进去。
**`index.html` 必须在最外层**，不能多套一层 `dist/index.html`，否则首页 404。
此方式平台侧不执行构建。

### 源码仓库

本仓库双推到两个远端（GitHub 主、CNB 备），沿用 astral 的惯例把 CNB 配成
origin 的第二条 pushurl：

```bash
git remote add origin https://github.com/barry130/quietMusic-site.git
git remote set-url --add --push origin https://cnb.cool/canace/quietMusic-site.git
```

一次 `git push origin main` 会同时推到两个远端。**站内所有对外链接（下载直链、源码、
提交反馈）都指向 CNB**，GitHub 这条仅作为备份远端。GitHub 在本机需要走代理、
CNB 需要直连，可以按远端单独配：

```bash
git config --local remote.origin.proxy socks5h://127.0.0.1:10808
```

均已配好，`git remote -v` 可见 origin 有两条 push 地址。

### 方式 A'：CNB 流水线 Webhook 触发（配合 EdgeOne Makers 模板）

仓库根目录的 `.cnb.yml` 照抄
[EdgeOne-Makers-Webhook 模板](https://cnb.cool/EdgeOne-Makers/EdgeOne-Makers-Webhook)：
push 到 `main` 时 CNB 跑 `notify` 阶段，用 `cnbcool/webhook` 插件向固定地址
`https://api.edgeone.ai/eo/pages/hook/cnb` 发一个 `POST`，把 CNB 内置变量
（仓库名、分支、commit、构建人等）以 JSON 交给 EdgeOne，EdgeOne 自己拉代码构建。
**Webhook 地址是平台指定的，不可改。**

因此一次 `git push origin main`（双推 GitHub + CNB）会同时命中方式 A 与方式 A'，
任一条通都能发布；两者都在时是一次 push 触发两次构建，产物一致，无副作用。

CNB 侧流水线记录：仓库 → **Events** 标签页。`notify` 阶段变绿即表示 EdgeOne 已收
到触发请求（端点对未登记仓库同样返回 `{"code":0,"message":"ok"}`，所以绿灯只
保证投递成功，是否真的重新构建以站点 `Last-Modified` 变化为准）。

想换触发分支就改 `.cnb.yml` 顶部的 `main`，但 `settings.urls` 保持原样。

## 相关仓库

| 仓库 | 内容 |
|---|---|
| [qt-uniappx](https://cnb.cool/canace/qt-uniappx) | Android / iOS 客户端 |
| [qt-pc](https://cnb.cool/canace/qt-pc) | Windows 桌面端 |

## 许可

站点文字内容沿用项目的 Apache-2.0 许可（含补充条款）。
