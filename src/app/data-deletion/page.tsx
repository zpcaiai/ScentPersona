"use client";

import { useState } from "react";
import PageShell from "@/components/layout/PageShell";

export default function DataDeletionPage() {
  const [contact, setContact] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/privacy/delete-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact, identifier, reason }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "提交失败");
      }

      setMessage(`删除请求已提交，编号：${data.requestId}`);
      setContact("");
      setIdentifier("");
      setReason("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "提交失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <article className="py-8">
        <h1 className="text-2xl font-serif text-stone-800">数据删除</h1>
        <div className="card mt-6">
          <p className="text-sm leading-relaxed text-stone-600">
            如果你希望删除问卷、订单或反馈数据，请提交以下请求。订单、支付、发票和法定留存数据会按适用法规保留必要期限。
          </p>
          <form onSubmit={submit} className="mt-5 grid gap-4">
            <div>
              <label className="mb-1 block text-sm text-stone-600">联系方式 *</label>
              <input
                required
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                placeholder="手机号或邮箱"
                className="w-full rounded-xl border border-cream-200 bg-white px-4 py-2 text-sm focus:outline-none focus:border-sage-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-stone-600">定位信息 *</label>
              <input
                required
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="订单号、手机号或结果链接"
                className="w-full rounded-xl border border-cream-200 bg-white px-4 py-2 text-sm focus:outline-none focus:border-sage-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-stone-600">说明（选填）</label>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={4}
                className="w-full rounded-xl border border-cream-200 bg-white px-4 py-2 text-sm focus:outline-none focus:border-sage-400"
              />
            </div>
            {message && (
              <div className="rounded-xl border border-cream-200 bg-cream-100 p-3 text-sm text-stone-600">
                {message}
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "提交中..." : "提交删除请求"}
            </button>
          </form>
        </div>
      </article>
    </PageShell>
  );
}
