#!/usr/bin/env node
/**
 * 部署到 EdgeOne Pages（免费档）。
 *
 * 用法：
 *   1. cp .env.example .env.local，填入 EDGEONE_PROJECT_NAME 与 EDGEONE_PAGES_API_TOKEN
 *   2. npm run build
 *   3. npm run deploy                # 生产环境
 *      npm run deploy:preview        # 预发环境
 *
 * 说明：token 只从 .env.local / 环境变量读取，绝不写入 git。
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readEnvFile(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const rawLine of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return out;
}

const fileEnv = {
  ...readEnvFile(path.join(root, ".env")),
  ...readEnvFile(path.join(root, ".env.local")),
};

const projectName =
  process.env.EDGEONE_PROJECT_NAME || fileEnv.EDGEONE_PROJECT_NAME || "";
const token =
  process.env.EDGEONE_PAGES_API_TOKEN || fileEnv.EDGEONE_PAGES_API_TOKEN || "";

const args = process.argv.slice(2);
const envFlag = args.includes("--env")
  ? args[args.indexOf("--env") + 1]
  : args.includes("--preview") || args.includes("-p")
    ? "preview"
    : "production";

if (envFlag !== "production" && envFlag !== "preview") {
  console.error(
    `[deploy] --env 只能是 production 或 preview，收到：${envFlag}`,
  );
  process.exit(1);
}

if (!projectName) {
  console.error(
    "[deploy] 缺少 EDGEONE_PROJECT_NAME。请在 .env.local 里配置，或传环境变量。",
  );
  process.exit(1);
}
if (!token) {
  console.error(
    "[deploy] 缺少 EDGEONE_PAGES_API_TOKEN。请在 .env.local 里配置（Makers 控制台 → API Token → Create API Token）。",
  );
  process.exit(1);
}

const dist = path.join(root, "docs", ".vitepress", "dist");
if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.error(
    `[deploy] ${dist} 里没有 index.html，请先执行 npm run build。`,
  );
  process.exit(1);
}

// 用项目内安装的 CLI，避免依赖全局安装
const cli = path.join(root, "node_modules", "edgeone", "edgeone-bin", "edgeone.js");
if (!fs.existsSync(cli)) {
  console.error("[deploy] 未找到 edgeone CLI，请先执行 npm install。");
  process.exit(1);
}

const cmdArgs = [
  cli,
  "makers",
  "deploy",
  dist,
  "-n",
  projectName,
  "-t",
  token,
  "-e",
  envFlag,
  "--json",
];

console.log(
  `[deploy] 项目=${projectName} 环境=${envFlag} 目录=${path.relative(root, dist)}`,
);

const r = spawnSync(process.execPath, cmdArgs, {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, FORCE_COLOR: "1" },
});

if (r.error) {
  console.error("[deploy] 启动 CLI 失败：", r.error.message);
  process.exit(1);
}
process.exit(r.status ?? 0);
