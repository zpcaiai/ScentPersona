import { MockAdapter } from "./mockAdapter";
import { CsvImportAdapter } from "./csvImportAdapter";
import { jdAdapter, pddAdapter, taobaoAdapter, tmallAdapter } from "./apiAdapters";
import type { Platform, PlatformAdapter } from "./types";

export const adapters: PlatformAdapter[] = [
  new MockAdapter(),
  new CsvImportAdapter(),
  jdAdapter,
  taobaoAdapter,
  tmallAdapter,
  pddAdapter,
];

export function getAdapter(platform: Platform): PlatformAdapter | undefined {
  return adapters.find((adapter) => adapter.platform === platform);
}

export type * from "./types";
