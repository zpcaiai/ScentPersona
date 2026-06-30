"use client";

import { useState } from "react";
import PageShell from "@/components/layout/PageShell";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";

const SAMPLE_CSV = `platform,platformProductId,title,brand,price,originalPrice,rating,reviewCount,salesCount,shopName,shopType,imageUrl,sourceUrl,volume,concentration,scentFamily,topNotes,middleNotes,baseNotes,description
manual,sp-white-tea-50,白茶清晨 EDP 50ml 清新白茶木质香水,ScentPersona,268,328,4.8,218,1200,ScentPersona 官方样品店,authorized,,https://example.com/white-tea,50ml,EDP,白茶 木质,白茶、柑橘,纸张、白麝香,雪松、琥珀,干净安静适合通勤`;

export default function AdminImportPage() {
  const { locale } = useLang();
  const [csv, setCsv] = useState(SAMPLE_CSV);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);

  const callImport = async (dryRun: boolean) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/import-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, dryRun }),
      });
      const data = await res.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <div className="py-8">
        <h1 className="text-2xl font-serif text-stone-800 text-center">{pick(locale, "商品 CSV 导入", "Product CSV import")}</h1>
        <p className="mt-2 text-center text-sm text-stone-500">
          {pick(locale, "MVP 阶段优先使用 CSV / 手动导入，不接入未授权抓取。", "In the MVP, prefer CSV / manual import; no unauthorized scraping.")}
        </p>
      </div>

      <div className="card">
        <label className="block text-sm text-stone-600">
          {pick(locale, "上传 CSV", "Upload CSV")}
          <input
            type="file"
            accept=".csv,text/csv"
            className="mt-2 block w-full text-sm"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (file) setCsv(await file.text());
            }}
          />
        </label>
        <textarea
          value={csv}
          onChange={(event) => setCsv(event.target.value)}
          rows={12}
          className="mt-4 w-full rounded-xl border border-cream-200 bg-white px-4 py-3 text-xs text-stone-700"
        />
        <div className="mt-4 flex gap-3">
          <button className="btn-secondary" disabled={loading} onClick={() => callImport(true)}>
            {pick(locale, "预览校验", "Preview & validate")}
          </button>
          <button className="btn-primary" disabled={loading} onClick={() => callImport(false)}>
            {pick(locale, "导入商品", "Import products")}
          </button>
        </div>
      </div>

      {result !== null && (
        <div className="card mt-6">
          <h2 className="font-serif text-lg text-stone-800">{pick(locale, "结果", "Result")}</h2>
          <pre className="mt-3 overflow-auto rounded-xl bg-stone-900 p-4 text-xs text-cream-50">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </PageShell>
  );
}
