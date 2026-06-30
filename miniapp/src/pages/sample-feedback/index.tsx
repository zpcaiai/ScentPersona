import { useState } from "react";
import { View, Text, Input, Textarea } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { sampleFeedback } from "../../lib/account";
import { THEME_CLASS } from "../../lib/theme";
import "../account/index.scss";
const LIKE: [string, string][] = [["love", "很喜欢"], ["like", "还不错"], ["neutral", "一般"], ["dislike", "不适合"]];
const TAGS: [string, string][] = [["tooSweet", "太甜"], ["tooStrong", "太浓"], ["tooCold", "太冷"], ["tooLight", "太淡"]];
export default function SampleFeedback() {
  const r = useRouter();
  const orderNo = r.params.orderNo || "";
  const token = r.params.token || Taro.getStorageSync(`proxyToken:${orderNo}`) || "";
  const [f, setF] = useState<any>({ productId: "", likeLevel: "love", tooSweet: false, tooStrong: false, tooCold: false, tooLight: false, comment: "" });
  const tog = (k: string) => setF((p: any) => ({ ...p, [k]: !p[k] }));
  async function submit() {
    if (!f.productId) { Taro.showToast({ title: "请填写商品ID", icon: "none" }); return; }
    try { const a = await sampleFeedback(orderNo, token, f); Taro.showToast({ title: a.ok ? (a.recommendation ? "已生成正装推荐与抵扣券" : "感谢反馈") : "失败", icon: "none" }); }
    catch { Taro.showToast({ title: "失败", icon: "none" }); }
  }
  return (
    <View className={`acc ${THEME_CLASS}`}>
      <Text className="acc-h">试香反馈</Text>
      <Text className="acc-muted">先别急着一次闻完，今天先试一支，告诉我们感受。</Text>
      <Input className="acc-input" placeholder="这支香的商品ID" value={f.productId} onInput={(e) => setF((p: any) => ({ ...p, productId: e.detail.value }))} />
      <View className="acc-grid">{LIKE.map(([v, l]) => <View key={v} className="acc-chip" style={f.likeLevel === v ? "background:#6b7d5e;color:#fff" : ""} onClick={() => setF((p: any) => ({ ...p, likeLevel: v }))}>{l}</View>)}</View>
      <View className="acc-grid">{TAGS.map(([k, l]) => <View key={k} className="acc-chip" style={f[k] ? "border-color:#c4a882;color:#967449" : ""} onClick={() => tog(k)}>{l}</View>)}</View>
      <Textarea className="acc-input" style="height:100rpx" placeholder="想多说两句（可选）" value={f.comment} onInput={(e) => setF((p: any) => ({ ...p, comment: e.detail.value }))} />
      <View className="acc-btn" onClick={submit}>提交反馈</View>
      <View className="acc-btn-ghost" onClick={() => Taro.navigateTo({ url: "/pages/coupons/index" })}>查看正装推荐与券</View>
    </View>
  );
}
