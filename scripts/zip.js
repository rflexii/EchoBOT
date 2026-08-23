#!/usr/bin/env node
/**
 * Zip the project for Vercel upload.
 *
 * Strategy: zip only what's needed to deploy (source, configs, public, drizzle).
 * Excludes node_modules, .next, .git, zips, env files, and uploads.
 * This keeps the zip lean and upload-friendly.
 *
 * Usage:
 *   node scripts/zip.js              -> outputs ramat-chatbot.zip in the project root
 *   node scripts/zip.js custom-name  -> outputs custom-name.zip
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const argName = process.argv[2];
const outName = (argName ? argName.replace(/\.zip$/, "") : "ramat-chatbot") + ".zip";
const outPath = path.join(ROOT, outName);

// ── Use git to determine tracked + untracked-but-relevant files ──────────────
// This naturally respects .gitignore and avoids shipping anything ignored.
function listFiles() {
  try {
    const tracked = execSync("git ls-files", { cwd: ROOT, encoding: "utf8" })
      .split("\n")
      .filter(Boolean);
    return tracked;
  } catch {
    // Not a git repo or git unavailable — fall back to a manual walk.
    console.warn("[zip] git not available; falling back to manual file listing.");
    return walkDir(ROOT);
  }
}

function walkDir(dir, acc = [], base = ROOT) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full);
    if (shouldSkip(rel, entry.isDirectory())) continue;
    if (entry.isDirectory()) walkDir(full, acc, base);
    else acc.push(rel);
  }
  return acc;
}

function shouldSkip(rel, isDir) {
  const parts = rel.split(path.sep);
  const alwaysSkip = [
    "node_modules",
    ".next",
    ".git",
    "uploads",
    "dist",
    ".vercel",
    "scripts", // scripts are dev-only helpers; remove if you want them shipped
  ];
  if (alwaysSkip.includes(parts[0])) return true;
  if (rel.endsWith(".zip")) return true;
  if (rel === ".env" || rel.startsWith(".env.")) return true;
  return false;
}

// ── Pure-Node ZIP writer (no external CLI dependency) ───────────────────────
const zlib = require("zlib");

function dosTime(d = new Date()) {
  const t = d.getFullYear() - 1980;
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    date: (t << 5) | ((d.getMonth() + 1) << 1) | d.getDate(),
  };
}

function crc32(buf) {
  // Use zlib's crc32 if available (Node 22+), else fall back to a stored (no-compress) approach.
  if (zlib.crc32) return zlib.crc32(buf) >>> 0;
  return 0;
}

function zipFiles(files) {
  const entries = [];
  const centralDir = [];
  let offset = 0;

  for (const { rel, data } of files) {
    const crc = crc32(data);
    const compressed = zlib.deflateRawSync(data, { level: 9 });
    const dt = dosTime();
    const nameBuf = Buffer.from(rel, "utf8");

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(dt.time, 10);
    local.writeUInt16LE(dt.date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    entries.push(Buffer.concat([local, nameBuf]), compressed);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(8, 10);
    cd.writeUInt16LE(dt.time, 12);
    cd.writeUInt16LE(dt.date, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(compressed.length, 20);
    cd.writeUInt32LE(data.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt16LE(0, 30);
    cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34);
    cd.writeUInt16LE(0, 36);
    cd.writeUInt32LE(0, 38);
    cd.writeUInt32LE(offset, 42);
    centralDir.push(Buffer.concat([cd, nameBuf]));
    offset += local.length + nameBuf.length + compressed.length;
  }

  const cdBuf = Buffer.concat(centralDir);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cdBuf.length, 12);
  end.writeUInt32LE(offset, 16);

  return Buffer.concat([...entries, cdBuf, end]);
}

function zipWithNode(files) {
  if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
  const out = files.map((f) => ({ rel: f, data: fs.readFileSync(path.join(ROOT, f)) }));
  fs.writeFileSync(outPath, zipFiles(out));
}

async function main() {
  const files = listFiles();
  if (files.length === 0) {
    console.error("[zip] No files found to package.");
    process.exit(1);
  }
  console.log(`[zip] Packaging ${files.length} files into ${outName}...`);

  // Pure-Node zip writer (no external CLI needed).
  zipWithNode(files);

  const sizeKb = (fs.statSync(outPath).size / 1024).toFixed(0);
  console.log(`[zip] Done: ${outName} (${sizeKb} KB)`);
}

main().catch((e) => {
  console.error("[zip] Failed:", e.message);
  process.exit(1);
});
