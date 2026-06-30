import { useEffect, useState } from "react";
import { View, Text, Textarea } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { afterSalesGet, afterSalesPost } from "../../lib/account";
import { proxyDetail } from "../../lib/proxy";
import { THEME_CLASS } from "../../lib/theme";
import "../account/index.scss";
const TYPES: [string, string][] = [["damaged", "破损"], ["wrong_item", "错发"], ["authenticity", "真假"], ["missing", "未收到"], ["logistics", "物流"], ["allergy", "过敏"], ["dislike", "不喜欢"], ["other", "其他"]];
export default function AfterSales() {
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
    if (!orderId || !desc) { Taro.showToast({ title: "请填写描述", icon: "none" }); return; }
    const evidence = ev.trim() ? [{ evidenceType: "text", text: ev.trim() }] : [];
    try { const a = await afterSalesPost(orderId, { token, type, userDescription: desc, evidence }); Taro.showToast({ title: a.ok ? `已提交 ${a.caseNo}` : "失败", icon: "none" }); if (a.ok) { setDesc(""); setEv(""); afterSalesGet(orderId, token).then((x: any) => setCases(x.cases || [])); } }
    catch { Taro.showToast({ title: "失败", icon: "none" }); }
  }
  return (
    <View className={`acc ${THEME_CLASS}`}>
      <Text className="acc-h">申请售后</Text>
      <Text className="acc-muted">订单 {orderNo}。如实描述问题，我们会尽快处理。</Text>
      <View className="acc-grid">{TYPES.map(([v, l]) => <View key={v} className="acc-chip" style={type === v ? "background:#6b7d5e;color:#fff" : ""} onClick={() => setType(v)}>{l}</View>)}</View>
      {reqs[type] && <View className="acc-card"><Text className="acc-muted">建议提供：{(reqs[type] || []).join("、")}</Text></View>}
      <Textarea className="acc-input" style="height:140rpx" placeholder="问题描述" value={desc} onInput={(e) => setDesc(e.detail.value)} />
      <Textarea className="acc-input" style="height:100rpx" placeholder="补充证据说明（运单号/签收情况等）" value={ev} onInput={(e) => setEv(e.detail.value)} />
      <View className="acc-btn" onClick={submit}>提交售后</View>
      {cases.length > 0 && (
        <View>
          <Text className="acc-h" style="font-size:30rpx;margin-top:24rpx">历史售后</Text>
          {cases.map((c: any) => <View key={c.caseNo} className="acc-card"><View className="acc-row" style="padding:0"><Text>{c.caseNo}</Text><Text className="acc-muted">{c.status}</Text></View></View>)}
        </View>
      )}
    </View>
  );
}
