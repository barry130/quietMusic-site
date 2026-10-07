// 站内链接与锚点校验：只读，不参与构建。
// 用法：node scripts/check-links.mjs（需先 npm run build 生成 dist）
import fs from "node:fs";
import path from "node:path";

const DOCS = "docs";
const DIST = "docs/.vitepress/dist";
const norm = (p) => p.split(path.sep).join("/");

function walkMd(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".vitepress", "public"].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkMd(p, out);
    else if (e.name.endsWith(".md")) out.push(p);
  }
  return out;
}

// 把 dist 内的 html 相对路径归一成站点路径：/dev/source-pack
function pageOf(rel) {
  let r = rel.replace(/\.(md|html)$/, "");
  if (r.endsWith("/index")) r = r.slice(0, -6) || "/";
  return r === "" ? "/" : r;
}

function joinUrl(base, rel) {
  const trimmed = base.replace(/\/+$/, "");
  const stack = trimmed === "" ? [] : trimmed.slice(1).split("/");
  if (!base.endsWith("/")) stack.pop(); // 末段按「文件名」处理
  for (const part of rel.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return "/" + stack.join("/");
}

// 1) 收集所有页面（源 .md）
const files = walkMd(DOCS);
const pages = new Set();
for (const f of files) pages.add(pageOf(norm(f).replace(/^docs/, "")));

// 2) 若有 dist，收集每页的锚点 id
const anchors = new Map();
function walkDist(dir, prefix) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      walkDist(p, prefix + "/" + e.name);
      continue;
    }
    if (!e.name.endsWith(".html")) continue;
    const page = pageOf(prefix + "/" + e.name);
    const html = fs.readFileSync(p, "utf8");
    const ids = new Set();
    const re = /id="([^"]+)"/g;
    let m;
    while ((m = re.exec(html))) ids.add(m[1]);
    anchors.set(page, ids);
  }
}
walkDist(DIST, "");

// 3) 校验（只查站内链接：以 / 开头、./、../ 或纯 #）
let badPage = 0;
let badAnchor = 0;
let checkedAnchor = 0;
let checked = 0;
for (const f of files) {
  const from = pageOf(norm(f).replace(/^docs/, ""));
  const src = fs.readFileSync(f, "utf8");
  const re = /\]\(([^)\s]+)\)/g;
  let m;
  while ((m = re.exec(src))) {
    const raw = m[1];
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith("//")) continue; // 外链
    if (raw.startsWith("mailto:")) continue;
    const [pathPart, frag] = raw.split("#");
    let target;
    if (pathPart === "") target = from; // 纯锚点
    else if (pathPart.startsWith("/")) target = pathPart;
    else target = joinUrl(from, pathPart);
    target = target.replace(/\.html$/, "");
    if (target.length > 1 && target.endsWith("/")) target = target.slice(0, -1);
    if (target === "") target = "/";
    checked++;
    if (!pages.has(target)) {
      console.log(`BAD PAGE   ${norm(f)} -> ${raw}   (resolved ${target})`);
      badPage++;
      continue;
    }
    if (!frag || anchors.size === 0) continue;
    checkedAnchor++;
    const set = anchors.get(target);
    if (!set) continue;
    let decoded = frag;
    try {
      decoded = decodeURIComponent(frag);
    } catch {
      /* 保留原文 */
    }
    if (!set.has(decoded) && !set.has(frag)) {
      console.log(`BAD ANCHOR ${norm(f)} -> ${raw}`);
      badAnchor++;
    }
  }
}

console.log(
  `pages: ${pages.size}  links checked: ${checked}  bad links: ${badPage}  anchors checked: ${checkedAnchor}  bad anchors: ${badAnchor}`,
);
if (badPage || badAnchor) process.exitCode = 1;
