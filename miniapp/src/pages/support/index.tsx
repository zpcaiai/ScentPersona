import { useEffect, useState } from "react";
import { View, Text, Input, Picker, Textarea } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { supportList, supportCreate } from "../../lib/account";
import { useLang, pick, useNavTitle } from "../../lib/i18n";
import { THEME_CLASS } from "../../lib/theme";
import "../account/index.scss";
const CATS: [string, string, string][] = [["order_question", "订单咨询", "Order question"], ["shipping_issue", "物流", "Shipping"], ["refund", "退款", "Refund"], ["product_authenticity", "真假", "Authenticity"], ["scent_recommendation", "选香", "Scent advice"], ["invoice", "发票", "Invoice"], ["other", "其他", "Other"]];
export default function Support() {
  const { locale } = useLang();
  useNavTitle("客服", "Support");
  const [tickets, setTickets] = useState<any[]>([]);
  const [ci, setCi] = useState(0);
  const [f, setF] = useState({ subject: "", message: "", orderNo: "" });
  function load() { supportList().then((r) => setTickets(r.tickets || [])).catch(() => undefined); }
  useEffect(() => { load(); }, []);
  const set = (k: string) => (e: any) => setF((p) => ({ ...p, [k]: e.detail.value }));
  async function submit() {
    if (!f.subject || !f.message) { Taro.showToast({ title: pick(locale, "请填写主题和描述", "Please add a subject and description"), icon: "none" }); return; }
    try { const r = await supportCreate({ category: CATS[ci][0], ...f }); Taro.showToast({ title: r.ok ? pick(locale, `已提交 ${r.ticketNo}`, `Submitted ${r.ticketNo}`) : pick(locale, "失败", "Failed"), icon: "none" }); if (r.ok) { setF({ subject: "", message: "", orderNo: "" }); load(); } }
    catch { Taro.showToast({ title: pick(locale, "失败", "Failed"), icon: "none" }); }
  }
  return (
    <View className={`acc ${THEME_CLASS}`}>
      <Text className="acc-h">{pick(locale, "联系客服", "Contact support")}</Text>
      <View className="acc-card">
        <Picker mode="selector" range={CATS.map((c) => pick(locale, c[1], c[2]))} value={ci} onChange={(e) => setCi(Number(e.detail.value))}><View className="acc-input">{pick(locale, "分类", "Category")}：{pick(locale, CATS[ci][1], CATS[ci][2])}</View></Picker>
        <Input className="acc-input" placeholder={pick(locale, "订单号（可选）", "Order number (optional)")} value={f.orderNo} onInput={set("orderNo")} />
        <Input className="acc-input" placeholder={pick(locale, "主题", "Subject")} value={f.subject} onInput={set("subject")} />
        <Textarea className="acc-input" style="height:140rpx" placeholder={pick(locale, "问题描述", "Describe the issue")} value={f.message} onInput={set("message")} />
        <View className="acc-btn" onClick={submit}>{pick(locale, "提交工单", "Submit ticket")}</View>
      </View>
      {tickets.map((t) => (<View key={t.ticketNo} className="acc-card" onClick={() => Taro.navigateTo({ url: `/pages/support-thread/index?ticketNo=${t.ticketNo}` })}><View className="acc-row" style="padding:0"><Text>{t.subject}</Text><Text className="acc-muted">{t.status}</Text></View></View>))}
    </View>
  );
}
