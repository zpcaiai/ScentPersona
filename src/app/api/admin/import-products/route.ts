import { NextRequest, NextResponse } from "next/server";
import { csvRowToRaw, parseCsv, validateCsvRow } from "@/lib/platforms/csvImportAdapter";
import type { CsvImportRow } from "@/lib/platforms/csvImportAdapter";
import { importPlatformProducts } from "@/lib/products/importCatalog";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const csv = typeof body?.csv === "string" ? body.csv : "";
    const dryRun = !!body?.dryRun;

    if (!csv.trim()) {
      return NextResponse.json({ error: "csv is required" }, { status: 400 });
    }

    const rows = parseCsv(csv);
    const parsed = rows.map((row, index) => validateCsvRow(row, index + 2));
    const errors = parsed
      .filter((item): item is { ok: false; error: string; index: number } => !item.ok)
      .map((item) => ({ index: item.index, error: item.error }));
    const rawProducts = parsed
      .filter((item): item is { ok: true; row: CsvImportRow } => item.ok)
      .map((item) => csvRowToRaw(item.row));

    if (dryRun) {
      return NextResponse.json({
        preview: rows.slice(0, 20),
        totalRows: rows.length,
        validRows: rawProducts.length,
        errors,
      });
    }

    const result = await importPlatformProducts(rawProducts);
    return NextResponse.json({
      ...result,
      failed: result.failed + errors.length,
      errors: [...errors, ...result.errors],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Import failed" },
      { status: 500 }
    );
  }
}
