const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const IGNORE_DIRS = ['node_modules', '.git', 'tools'];
const OLD_BRAND = ['Roo', 'haniyat'].join('');
const OLD_BRAND_LOWER = OLD_BRAND.toLowerCase();
const OLD_BRAND_UPPER = OLD_BRAND.toUpperCase();

const urlTokenPrefix = '__URL_TOKEN_';
const emailTokenPrefix = '__EMAIL_TOKEN_';

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    if (ent.isDirectory()) {
      if (IGNORE_DIRS.includes(ent.name)) continue;
      walk(path.join(dir, ent.name));
    } else if (ent.isFile()) {
      if (ent.name.endsWith('.html') || ent.name.endsWith('.json')) {
        patchFile(path.join(dir, ent.name));
      }
    }
  }
}

function patchFile(filePath) {
  let txt = fs.readFileSync(filePath, 'utf8');
  const urlTokens = [];
  const emailTokens = [];

  // Protect URLs that contain the old brand token (domains, image src, etc.)
  txt = txt.replace(/https?:\/\/[^"'\s>]+/gi, (m) => {
    if (m.toLowerCase().includes(OLD_BRAND_LOWER)) {
      const tok = urlTokenPrefix + urlTokens.length + '__';
      urlTokens.push({ tok, val: m });
      return tok;
    }
    return m;
  });

  // Protect emails containing the old brand token
  txt = txt.replace(/[a-zA-Z0-9._%+-]+@[^\s"'<>]+/g, (m) => {
    if (m.toLowerCase().includes(OLD_BRAND_LOWER)) {
      const tok = emailTokenPrefix + emailTokens.length + '__';
      emailTokens.push({ tok, val: m });
      return tok;
    }
    return m;
  });

  // Replace visible brand variants
  txt = txt.replace(new RegExp(`\\b${OLD_BRAND} Jaipur\\b`, 'gi'), 'SSCreation');
  txt = txt.replace(new RegExp(`\\b${OLD_BRAND_UPPER} JAIPUR\\b`, 'g'), 'SSCreation');
  txt = txt.replace(new RegExp(`\\b${OLD_BRAND}\\b`, 'gi'), 'SSCreation');
  txt = txt.replace(new RegExp(`\\b${OLD_BRAND_UPPER}\\b`, 'g'), 'SSCreation');

  // Restore protected tokens
  for (const t of urlTokens) txt = txt.replace(t.tok, t.val);
  for (const t of emailTokens) txt = txt.replace(t.tok, t.val);

  if (txt !== fs.readFileSync(filePath, 'utf8')) {
    fs.writeFileSync(filePath, txt, 'utf8');
    console.log('Patched', path.relative(ROOT, filePath));
  }
}

walk(ROOT);
console.log('Done replace-brand');
