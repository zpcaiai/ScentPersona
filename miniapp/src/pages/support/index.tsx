import { useEffect, useState } from "react";
import { View, Text, Input, Picker, Textarea } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { supportList, supportCreate } from "../../lib/account";
import { THEME_CLASS } from "../../lib/theme";
import "../account/index.scss";
const CATS: [string, string][] = [["order_question", "订单咨询"], ["shipping_issue", "物流"], ["refund", "退款"], ["product_authenticity", "真假"], ["scent_recommendation", "选香"], ["invoice", "发票"], ["other", "其他"]];
export default function Support() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [ci, setCi] = useState(0);
  const [f, setF] = useState({ subject: "", message: "", orderNo: "" });
  function load() { supportList().then((r) => setTickets(r.tickets || [])).catch(() => undefined); }
  useEffect(() => { load(); }, []);
  const set = (k: string) => (e: any) => setF((p) => ({ ...p, [k]: e.detail.value }));
  async function submit() {
    if (!f.subject || !f.message) { Taro.showToast({ title: "请填写主题和描述", icon: "none" }); return; }
    try { const r = await supportCreate({ category: CATS[ci][0], ...f }); Taro.showToast({ title: r.ok ? `已提交 ${r.ticketNo}` : "失败", icon: "none" }); if (r.ok) { setF({ subject: "", message: "", orderNo: "" }); load(); } }
    catch { Taro.showToast({ title: "失败", icon: "none" }); }
  }
  return (
    <View className={`acc ${THEME_CLASS}`}>
      <Text className="acc-h">联系客服</Text>
      <View className="acc-card">
        <Picker mode="selector" range={CATS.map((c) => c[1])} value={ci} onChange={(e) => setCi(Number(e.detail.value))}><View className="acc-input">分类：{CATS[ci][1]}</View></Picker>
        <Input className="acc-input" placeholder="订单号（可选）" value={f.orderNo} onInput={set("orderNo")} />
        <Input className="acc-input" placeholder="主题" value={f.subject} onInput={set("subject")} />
        <Textarea className="acc-input" style="height:140rpx" placeholder="问题描述" value={f.message} onInput={set("message")} />
        <View className="acc-btn" onClick={submit}>提交工单</View>
      </View>
      {tickets.map((t) => (<View key={t.ticketNo} className="acc-card" onClick={() => Taro.navigateTo({ url: `/pages/support-thread/index?ticketNo=${t.ticketNo}` })}><View className="acc-row" style="padding:0"><Text>{t.subject}</Text><Text className="acc-muted">{t.status}</Text></View></View>))}
    </View>
  );
}
