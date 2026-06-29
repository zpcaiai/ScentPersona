import { spawnSync } from "child_process";
import { findMissing, findPlaceholders, loadDotEnv } from "./env-utils.mjs";

loadDotEnv();

const required = ["DATABASE_URL", "DIRECT_URL", "ADMIN_PASSWORD"];
const missing = findMissing(required);
const placeholders = findPlaceholders(required);

if (missing.length > 0 || placeholders.length > 0) {
  if (missing.length > 0) {
    console.error(`Missing required production environment variables: ${missing.join(", ")}`);
  }
  if (placeholders.length > 0) {
    console.error(`Required production variables still look like placeholders: ${placeholders.join(", ")}`);
  }
  console.error("Set real values in Vercel Project Settings -> Environment Variables before deploying.");
  process.exit(1);
}

run("npx", ["prisma", "generate"]);
run("npx", ["prisma", "migrate", "deploy"]);
run("npx", ["next", "build"]);

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
