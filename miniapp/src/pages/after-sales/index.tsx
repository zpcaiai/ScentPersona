import { useEffect, useState } from "react";
import { View, Text, Textarea } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { afterSalesGet, afterSalesPost } from "../../lib/account";
import { proxyDetail } from "../../lib/proxy";
import { useLang, pick, useNavTitle } from "../../lib/i18n";
import { THEME_CLASS } from "../../lib/theme";
import "../account/index.scss";
const TYPES: [string, string, string][] = [["damaged", "破损", "Damaged"], ["wrong_item", "错发", "Wrong item"], ["authenticity", "真假", "Authenticity"], ["missing", "未收到", "Not received"], ["logistics", "物流", "Shipping"], ["allergy", "过敏", "Allergy"], ["dislike", "不喜欢", "Didn't like it"], ["other", "其他", "Other"]];
export default function AfterSales() {
  const { locale } = useLang();
  useNavTitle("申请售后", "Request after-sales");
  const r = useRouter();
  const orderNo = r.params.orderNo || "";
  const token = r.params.token || Taro.getStorageSync(`proxyToken:${orderNo}`) || "";
  const [orderId, setOrderId] = useState("");
  const [reqs, setReqs] = useState<any>({});
  const [cases, setCases] = useState<any[]>([]);
  const [type, setType] = useState("damaged");
  const [desc, setDesc] = useState("");
  const [ev, setEv] = useState("");
  useEffect(() => {
    proxyDetail({ orderNo, token }).then((d: any) => {
      if (d.orderId) { setOrderId(d.orderId); afterSalesGet(d.orderId, token).then((a: any) => { setReqs(a.requirements || {}); setCases(a.cases || []); }).catch(() => undefined); }
    }).catch(() => undefined);
  }, [orderNo, token]);
  async function submit() {
    if (!orderId || !desc) { Taro.showToast({ title: pick(locale, "请填写描述", "Please add a description"), icon: "none" }); return; }
    const evidence = ev.trim() ? [{ evidenceType: "text", text: ev.trim() }] : [];
    try { const a = await afterSalesPost(orderId, { token, type, userDescription: desc, evidence }); Taro.showToast({ title: a.ok ? pick(locale, `已提交 ${a.caseNo}`, `Submitted ${a.caseNo}`) : pick(locale, "失败", "Failed"), icon: "none" }); if (a.ok) { setDesc(""); setEv(""); afterSalesGet(orderId, token).then((x: any) => setCases(x.cases || [])); } }
    catch { Taro.showToast({ title: pick(locale, "失败", "Failed"), icon: "none" }); }
  }
  return (
    <View className={`acc ${THEME_CLASS}`}>
      <Text className="acc-h">{pick(locale, "申请售后", "Request after-sales")}</Text>
      <Text className="acc-muted">{pick(locale, `订单 ${orderNo}。如实描述问题，我们会尽快处理。`, `Order ${orderNo}. Describe the issue honestly and we'll handle it as soon as we can.`)}</Text>
      <View className="acc-grid">{TYPES.map(([v, zh, en]) => <View key={v} className="acc-chip" style={type === v ? "background:#6b7d5e;color:#fff" : ""} onClick={() => setType(v)}>{pick(locale, zh, en)}</View>)}</View>
      {reqs[type] && <View className="acc-card"><Text className="acc-muted">{pick(locale, "建议提供", "Suggested to include")}：{(reqs[type] || []).join(pick(locale, "、", ", "))}</Text></View>}
      <Textarea className="acc-input" style="height:140rpx" placeholder={pick(locale, "问题描述", "Describe the issue")} value={desc} onInput={(e) => setDesc(e.detail.value)} />
      <Textarea className="acc-input" style="height:100rpx" placeholder={pick(locale, "补充证据说明（运单号/签收情况等）", "Extra evidence (tracking number, delivery status, etc.)")} value={ev} onInput={(e) => setEv(e.detail.value)} />
      <View className="acc-btn" onClick={submit}>{pick(locale, "提交售后", "Submit request")}</View>
      {cases.length > 0 && (
        <View>
          <Text className="acc-h" style="font-size:30rpx;margin-top:24rpx">{pick(locale, "历史售后", "Past requests")}</Text>
          {cases.map((c: any) => <View key={c.caseNo} className="acc-card"><View className="acc-row" style="padding:0"><Text>{c.caseNo}</Text><Text className="acc-muted">{c.status}</Text></View></View>)}
        </View>
      )}
    </View>
  );
}
