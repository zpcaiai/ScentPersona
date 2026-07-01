import { useEffect, useState } from "react";
import { View, Text, Input, Picker } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { listInvoices, createInvoice } from "../../lib/account";
import { useLang, pick, useNavTitle } from "../../lib/i18n";
import { THEME_CLASS } from "../../lib/theme";
import "../account/index.scss";
const TYPES: [string, string, string][] = [["personal", "个人", "Personal"], ["company", "企业", "Company"]];
export default function Invoices() {
  const { locale } = useLang();
  useNavTitle("发票", "Invoices");
  const [list, setList] = useState<any[]>([]);
  const [f, setF] = useState({ orderNo: "", title: "", taxNo: "", email: "" });
  const [ti, setTi] = useState(0);
  function load() { listInvoices().then((r) => setList(r.invoices || [])).catch(() => undefined); }
  useEffect(() => { load(); }, []);
  const set = (k: string) => (e: any) => setF((p) => ({ ...p, [k]: e.detail.value }));
  async function submit() {
    try { const r = await createInvoice({ ...f, invoiceType: TYPES[ti][0] }); Taro.showToast({ title: r.ok ? pick(locale, "已提交开票申请", "Invoice request submitted") : (r.error || pick(locale, "失败", "Failed")), icon: "none" }); if (r.ok) load(); }
    catch { Taro.showToast({ title: pick(locale, "失败", "Failed"), icon: "none" }); }
  }
  return (
    <View className={`acc ${THEME_CLASS}`}>
      <Text className="acc-h">{pick(locale, "发票", "Invoices")}</Text>
      <View className="acc-card">
        <Input className="acc-input" placeholder={pick(locale, "订单号", "Order number")} value={f.orderNo} onInput={set("orderNo")} />
        <Picker mode="selector" range={TYPES.map((t) => pick(locale, t[1], t[2]))} value={ti} onChange={(e) => setTi(Number(e.detail.value))}><View className="acc-input">{pick(locale, "抬头类型", "Invoice type")}：{pick(locale, TYPES[ti][1], TYPES[ti][2])}</View></Picker>
        <Input className="acc-input" placeholder={pick(locale, "抬头", "Invoice title")} value={f.title} onInput={set("title")} />
        {TYPES[ti][0] === "company" && <Input className="acc-input" placeholder={pick(locale, "税号", "Tax ID")} value={f.taxNo} onInput={set("taxNo")} />}
        <Input className="acc-input" placeholder={pick(locale, "接收邮箱", "Email to receive it")} value={f.email} onInput={set("email")} />
        <View className="acc-btn" onClick={submit}>{pick(locale, "申请开票", "Request invoice")}</View>
      </View>
      {list.map((i) => (<View key={i.id} className="acc-card"><View className="acc-row" style="padding:0"><Text>{i.title} · ¥{(i.amountCents / 100).toFixed(2)}</Text><Text className="acc-muted">{i.status}</Text></View></View>))}
    </View>
  );
}
