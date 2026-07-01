"use client";
import { useEffect, useRef } from "react";
import { useLang } from "@/lib/i18n/LangProvider";
import { pick } from "@/lib/i18n/config";

interface Props {
  funnel: { starts: number; completions: number; paid: number };
  orderTypes: { proxy: number; sample: number };
  profit: { revenue: number; gross: number; net: number };
  fulfillment: Record<string, number>;
  products: Record<string, number>;
}

const GREEN = "#6b7d5e";
const CLAY = "#b08d5e";
const CREAM = "#e4d8c0";

export default function DashboardCharts(props: Props) {
  const { locale } = useLang();
  const funnel = useRef<HTMLCanvasElement>(null);
  const types = useRef<HTMLCanvasElement>(null);
  const profit = useRef<HTMLCanvasElement>(null);
  const fulfil = useRef<HTMLCanvasElement>(null);
  const products = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const charts: Array<{ destroy: () => void }> = [];
    function render() {
      const Chart = (window as unknown as { Chart?: any }).Chart;
      if (!Chart) return;
      const noLegend = { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } }, maintainAspectRatio: false };
      const mk = (ref: React.RefObject<HTMLCanvasElement>, cfg: any) => { if (ref.current) charts.push(new Chart(ref.current, cfg)); };

      mk(funnel, { type: "bar", data: { labels: [pick(locale, "测试开始", "Quiz started"), pick(locale, "测试完成", "Quiz completed"), pick(locale, "支付订单", "Paid orders")], datasets: [{ data: [props.funnel.starts, props.funnel.completions, props.funnel.paid], backgroundColor: GREEN, borderRadius: 6 }] }, options: noLegend });
      mk(types, { type: "doughnut", data: { labels: [pick(locale, "代下单", "Proxy order"), pick(locale, "小样套装", "Sample kit")], datasets: [{ data: [props.orderTypes.proxy, props.orderTypes.sample], backgroundColor: [GREEN, CLAY] }] }, options: { maintainAspectRatio: false } });
      mk(profit, { type: "bar", data: { labels: [pick(locale, "收入", "Revenue"), pick(locale, "毛利", "Gross"), pick(locale, "净利", "Net")], datasets: [{ data: [props.profit.revenue / 100, props.profit.gross / 100, props.profit.net / 100], backgroundColor: [CLAY, GREEN, "#8a9a7b"], borderRadius: 6 }] }, options: noLegend });
      const fk = Object.keys(props.fulfillment);
      mk(fulfil, { type: "bar", data: { labels: fk, datasets: [{ data: fk.map((k) => props.fulfillment[k]), backgroundColor: GREEN, borderRadius: 6 }] }, options: noLegend });
      const pk = ["view", "favorite", "outbound_click", "dislike", "click_offer"].filter((k) => props.products[k] != null);
      mk(products, { type: "bar", data: { labels: pk, datasets: [{ data: pk.map((k) => props.products[k] || 0), backgroundColor: CLAY, borderRadius: 6 }] }, options: noLegend });
    }
    if ((window as unknown as { Chart?: unknown }).Chart) render();
    else {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js";
      s.onload = render;
      document.body.appendChild(s);
    }
    return () => { charts.forEach((c) => c.destroy()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const Card = ({ title, r }: { title: string; r: React.RefObject<HTMLCanvasElement> }) => (
    <div className="rounded-xl border border-cream-200 p-3">
      <p className="mb-1 text-sm text-clay-500">{title}</p>
      <div style={{ position: "relative", height: 160 }}><canvas ref={r} /></div>
    </div>
  );
  void CREAM;
  return (
    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card title={pick(locale, "转化漏斗", "Conversion funnel")} r={funnel} />
      <Card title={pick(locale, "订单类型", "Order types")} r={types} />
      <Card title={pick(locale, "利润（元，累计）", "Profit (¥, cumulative)")} r={profit} />
      <Card title={pick(locale, "代下单履约分布", "Proxy fulfillment")} r={fulfil} />
      <Card title={pick(locale, "商品互动", "Product engagement")} r={products} />
    </div>
  );
}
