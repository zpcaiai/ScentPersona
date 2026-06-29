import { findPlaceholders, loadDotEnv } from "./env-utils.mjs";

loadDotEnv();

const required = ["DATABASE_URL", "DIRECT_URL"];
const recommended = [
  "ADMIN_PASSWORD",
  "WECHAT_APPID",
  "WECHAT_APP_SECRET",
  "WECHAT_MCHID",
  "WECHAT_SERIAL_NO",
  "WECHAT_PRIVATE_KEY",
  "WECHAT_APIV3_KEY",
  "WECHAT_PLATFORM_PUBLIC_KEY",
  "WECHAT_NOTIFY_URL",
];

const missingRequired = required.filter((key) => !process.env[key]);
const missingRecommended = recommended.filter((key) => !process.env[key]);
const placeholderRequired = findPlaceholders(required);
const placeholderRecommended = findPlaceholders(recommended);

if (missingRequired.length > 0) {
  console.error(`Missing required environment variables: ${missingRequired.join(", ")}`);
  process.exit(1);
}

if (placeholderRequired.length > 0) {
  console.error(`Required environment variables still look like example placeholders: ${placeholderRequired.join(", ")}`);
  process.exit(1);
}

if (missingRecommended.length > 0) {
  console.warn(`Missing recommended production variables: ${missingRecommended.join(", ")}`);
}

if (placeholderRecommended.length > 0) {
  console.warn(`Recommended production variables still look like example placeholders: ${placeholderRecommended.join(", ")}`);
}

console.log("Environment check passed.");
