import { copyFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const files = [
  "copy.ts",
  "personas.ts",
  "products.ts",
  "quizQuestions.ts",
  "scentTags.ts",
];

for (const file of files) {
  const from = join(root, "src/data", file);
  const to = join(root, "miniapp/src/data", file);
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
  console.log(`synced ${file}`);
}
