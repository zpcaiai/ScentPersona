import { existsSync, readFileSync } from "fs";

export function loadDotEnv(path = ".env") {
  if (!existsSync(path)) return;

  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;

    const separatorIndex = trimmed.indexOf("=");
    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

export function isPlaceholderValue(key, value) {
  if (!value) return false;
  const lower = value.toLowerCase();
  const placeholderSnippets = [
    "change-me",
    "your-project",
    "user:password",
    "ep-xxx",
    "region.aws",
    "wx1234567890abcdef",
    "xhs_app_id",
    "xhs_app_secret",
    "xhs_merchant_id",
    "商户",
  ];

  if (key === "ADMIN_PASSWORD" && lower === "admin") return true;
  return placeholderSnippets.some((snippet) => lower.includes(snippet.toLowerCase()));
}

export function findMissing(keys) {
  return keys.filter((key) => !process.env[key]);
}

export function findPlaceholders(keys) {
  return keys.filter((key) => isPlaceholderValue(key, process.env[key]));
}
