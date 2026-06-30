import { useEffect, useState } from "react";
import { View, Text, Input, Picker } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { listInvoices, createInvoice } from "../../lib/account";
import { THEME_CLASS } from "../../lib/theme";
import "../account/index.scss";
const TYPES: [string, string][] = [["personal", "个人"], ["company", "企业"]];
export default function Invoices() {
  const [list, setList] = useState<any[]>([]);
  const [f, setF] = useState({ orderNo: "", title: "", taxNo: "", email: "" });
  const [ti, setTi] = useState(0);
  function load() { listInvoices().then((r) => setList(r.invoices || [])).catch(() => undefined); }
  useEffect(() => { load(); }, []);
  const set = (k: string) => (e: any) => setF((p) => ({ ...p, [k]: e.detail.value }));
  async function submit() {
    try { const r = await createInvoice({ ...f, invoiceType: TYPES[ti][0] }); Taro.showToast({ title: r.ok ? "已提交开票申请" : (r.error || "失败"), icon: "none" }); if (r.ok) load(); }
    catch { Taro.showToast({ title: "失败", icon: "none" }); }
  }
  return (
    <View className={`acc ${THEME_CLASS}`}>
      <Text className="acc-h">发票</Text>
      <View className="acc-card">
        <Input className="acc-input" placeholder="订单号" value={f.orderNo} onInput={set("orderNo")} />
        <Picker mode="selector" range={TYPES.map((t) => t[1])} value={ti} onChange={(e) => setTi(Number(e.detail.value))}><View className="acc-input">抬头类型：{TYPES[ti][1]}</View></Picker>
        <Input className="acc-input" placeholder="抬头" value={f.title} onInput={set("title")} />
        {TYPES[ti][0] === "company" && <Input className="acc-input" placeholder="税号" value={f.taxNo} onInput={set("taxNo")} />}
        <Input className="acc-input" placeholder="接收邮箱" value={f.email} onInput={set("email")} />
        <View className="acc-btn" onClick={submit}>申请开票</View>
      </View>
      {list.map((i) => (<View key={i.id} className="acc-card"><View className="acc-row" style="padding:0"><Text>{i.title} · ¥{(i.amountCents / 100).toFixed(2)}</Text><Text className="acc-muted">{i.status}</Text></View></View>))}
    </View>
  );
}
