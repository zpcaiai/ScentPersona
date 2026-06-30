import { BasePlatformAdapter } from "./baseAdapter";
import type { Platform, PlatformProductRaw } from "./types";

export interface CsvImportRow {
  platform: string;
  platformProductId?: string;
  title: string;
  brand?: string;
  price?: string;
  originalPrice?: string;
  rating?: string;
  reviewCount?: string;
  salesCount?: string;
  shopName?: string;
  shopType?: string;
  imageUrl?: string;
  sourceUrl: string;
  affiliateUrl?: string;
  volume?: string;
  concentration?: string;
  scentFamily?: string;
  topNotes?: string;
  middleNotes?: string;
  baseNotes?: string;
  description?: string;
}

const ALLOWED_PLATFORMS = new Set(["pdd", "taobao", "tmall", "jd", "manual", "mock"]);

export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(current);
      current = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }
  if (current || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  const [headers = [], ...dataRows] = rows.filter((item) => item.some((cell) => cell.trim()));
  return dataRows.map((cells) => Object.fromEntries(headers.map((header, index) => [header.trim(), (cells[index] || "").trim()])));
}

export function splitNotes(value?: string): string[] {
  if (!value) return [];
  return value.split(/[、,，/|]/).map((item) => item.trim()).filter(Boolean);
}

export function parsePriceToCents(value?: string): number | undefined {
  if (!value) return undefined;
  const normalized = value.replace(/[¥￥,\s]/g, "");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? Math.round(amount * 100) : undefined;
}

export function validateCsvRow(row: Record<string, string>, index: number): { ok: true; row: CsvImportRow } | { ok: false; error: string; index: number } {
  if (!row.platform || !ALLOWED_PLATFORMS.has(row.platform)) {
    return { ok: false, index, error: "platform 必填且必须是 pdd/taobao/tmall/jd/manual/mock" };
  }
  if (!row.title) return { ok: false, index, error: "title 必填" };
  if (!row.sourceUrl) return { ok: false, index, error: "sourceUrl 必填" };
  return { ok: true, row: row as unknown as CsvImportRow };
}

export function csvRowToRaw(row: CsvImportRow): PlatformProductRaw {
  return {
    platform: row.platform as Platform,
    platformProductId: row.platformProductId || undefined,
    title: row.title,
    brand: row.brand || undefined,
    priceCents: parsePriceToCents(row.price),
    originalPriceCents: parsePriceToCents(row.originalPrice),
    rating: row.rating ? Number(row.rating) : undefined,
    reviewCount: row.reviewCount ? Number(row.reviewCount) : undefined,
    salesCount: row.salesCount ? Number(row.salesCount) : undefined,
    shopName: row.shopName || undefined,
    shopType: row.shopType || undefined,
    imageUrl: row.imageUrl || undefined,
    sourceUrl: row.sourceUrl,
    affiliateUrl: row.affiliateUrl || undefined,
    rawData: { ...row },
    fetchedAt: new Date(),
    volume: row.volume,
    concentration: row.concentration,
    scentFamily: row.scentFamily,
    topNotes: splitNotes(row.topNotes),
    middleNotes: splitNotes(row.middleNotes),
    baseNotes: splitNotes(row.baseNotes),
    description: row.description,
  };
}

export class CsvImportAdapter extends BasePlatformAdapter {
  platform = "manual" as const;

  isConfigured() {
    return true;
  }

  async searchProducts() {
    return [];
  }

  async getProductDetail() {
    return null;
  }
}
