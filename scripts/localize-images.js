const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const assetDir = path.join(root, "assets", "images");
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".svg"]);
const urlPattern = /https?:\/\/[^\s"'<>\\)]+/g;

const sourceFiles = [
  "data/products.json",
  "data/shop-the-look.json",
  "build-site.js",
  "styles.css",
];

const contentTypeExtensions = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "image/svg+xml": ".svg",
};

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules" || entry.name === "assets") continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (/\.(html|js|css|json)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function normalizeUrl(raw) {
  return raw
    .replace(/&amp;/g, "&")
    .replace(/[.,;:]+$/g, "")
    .replace(/["')\]]+$/g, "");
}

function isImageUrl(raw) {
  try {
    const url = new URL(normalizeUrl(raw));
    const ext = path.extname(url.pathname).toLowerCase();
    return imageExtensions.has(ext);
  } catch {
    return false;
  }
}

function assetNameFor(rawUrl, contentType) {
  const url = new URL(rawUrl);
  const extFromPath = path.extname(url.pathname).toLowerCase();
  const ext = imageExtensions.has(extFromPath) ? extFromPath : contentTypeExtensions[contentType?.split(";")[0]] || ".img";
  const base = path
    .basename(url.pathname, extFromPath)
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "image";
  const hash = crypto.createHash("sha1").update(rawUrl).digest("hex").slice(0, 10);
  return `${base}-${hash}${ext}`;
}

async function download(url, target) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 local static-site asset downloader",
    },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(target, buffer);
  return response.headers.get("content-type") || "";
}

function replaceAll(content, from, to) {
  return content.split(from).join(to).split(from.replace(/&/g, "&amp;")).join(to);
}

async function main() {
  fs.mkdirSync(assetDir, { recursive: true });

  const files = walk(root);
  const urls = new Map();
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    for (const match of content.matchAll(urlPattern)) {
      const normalized = normalizeUrl(match[0]);
      if (isImageUrl(normalized)) urls.set(normalized, null);
    }
  }

  const mapping = new Map();
  let downloaded = 0;
  let reused = 0;
  let failed = 0;

  const queue = [...urls.keys()];
  let cursor = 0;
  const workers = Array.from({ length: 12 }, async () => {
    while (cursor < queue.length) {
      const url = queue[cursor++];
      let contentType = "";
      let fileName = assetNameFor(url, contentType);
      let target = path.join(assetDir, fileName);

      try {
        if (!fs.existsSync(target)) {
          contentType = await download(url, target);
          const contentTypeName = assetNameFor(url, contentType);
          if (contentTypeName !== fileName) {
            const contentTypeTarget = path.join(assetDir, contentTypeName);
            fs.renameSync(target, contentTypeTarget);
            fileName = contentTypeName;
            target = contentTypeTarget;
          }
          downloaded += 1;
        } else {
          reused += 1;
        }
        mapping.set(url, `/assets/images/${fileName}`);
        const done = downloaded + reused + failed;
        if (done % 25 === 0 || done === queue.length) {
          console.log(`Processed ${done}/${queue.length}`);
        }
      } catch (error) {
        failed += 1;
        console.error(`Failed: ${url}\n  ${error.message}`);
      }
    }
  });

  await Promise.all(workers);

  for (const relativeFile of sourceFiles) {
    const file = path.join(root, relativeFile);
    let content = fs.readFileSync(file, "utf8");
    const isCss = relativeFile.endsWith(".css");
    for (const [url, rootPath] of mapping.entries()) {
      const replacement = isCss ? rootPath.replace(/^\//, "") : rootPath;
      content = replaceAll(content, url, replacement);
    }
    fs.writeFileSync(file, content, "utf8");
  }

  const manifest = Object.fromEntries([...mapping.entries()].sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(path.join(assetDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(`\nImages found: ${urls.size}`);
  console.log(`Downloaded: ${downloaded}`);
  console.log(`Already present: ${reused}`);
  console.log(`Failed: ${failed}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
