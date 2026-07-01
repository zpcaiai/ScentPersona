import { useState } from "react";
import { View, Text, Input, Textarea } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { sampleFeedback } from "../../lib/account";
import { useLang, pick, useNavTitle } from "../../lib/i18n";
import { THEME_CLASS } from "../../lib/theme";
import "../account/index.scss";
const LIKE: [string, string, string][] = [["love", "很喜欢", "Love it"], ["like", "还不错", "Like it"], ["neutral", "一般", "It's okay"], ["dislike", "不适合", "Not for me"]];
const TAGS: [string, string, string][] = [["tooSweet", "太甜", "Too sweet"], ["tooStrong", "太浓", "Too strong"], ["tooCold", "太冷", "Too cold"], ["tooLight", "太淡", "Too light"]];
export default function SampleFeedback() {
  const { locale } = useLang();
  useNavTitle("试香反馈", "Scent trial feedback");
  const r = useRouter();
  const orderNo = r.params.orderNo || "";
  const token = r.params.token || Taro.getStorageSync(`proxyToken:${orderNo}`) || "";
  const [f, setF] = useState<any>({ productId: "", likeLevel: "love", tooSweet: false, tooStrong: false, tooCold: false, tooLight: false, comment: "" });
  const tog = (k: string) => setF((p: any) => ({ ...p, [k]: !p[k] }));
  async function submit() {
    if (!f.productId) { Taro.showToast({ title: pick(locale, "请填写商品ID", "Please enter a product ID"), icon: "none" }); return; }
    try { const a = await sampleFeedback(orderNo, token, f); Taro.showToast({ title: a.ok ? (a.recommendation ? pick(locale, "已生成正装推荐与抵扣券", "Full-bottle pick and credit ready") : pick(locale, "感谢反馈", "Thanks for the feedback")) : pick(locale, "失败", "Failed"), icon: "none" }); }
    catch { Taro.showToast({ title: pick(locale, "失败", "Failed"), icon: "none" }); }
  }
  return (
    <View className={`acc ${THEME_CLASS}`}>
      <Text className="acc-h">{pick(locale, "试香反馈", "Scent trial feedback")}</Text>
      <Text className="acc-muted">{pick(locale, "先别急着一次闻完，今天先试一支，告诉我们感受。", "No need to try them all at once — start with one today and tell us how it felt.")}</Text>
      <Input className="acc-input" placeholder={pick(locale, "这支香的商品ID", "Product ID for this scent")} value={f.productId} onInput={(e) => setF((p: any) => ({ ...p, productId: e.detail.value }))} />
      <View className="acc-grid">{LIKE.map(([v, zh, en]) => <View key={v} className="acc-chip" style={f.likeLevel === v ? "background:#6b7d5e;color:#fff" : ""} onClick={() => setF((p: any) => ({ ...p, likeLevel: v }))}>{pick(locale, zh, en)}</View>)}</View>
      <View className="acc-grid">{TAGS.map(([k, zh, en]) => <View key={k} className="acc-chip" style={f[k] ? "border-color:#c4a882;color:#967449" : ""} onClick={() => tog(k)}>{pick(locale, zh, en)}</View>)}</View>
      <Textarea className="acc-input" style="height:100rpx" placeholder={pick(locale, "想多说两句（可选）", "Anything else to add (optional)")} value={f.comment} onInput={(e) => setF((p: any) => ({ ...p, comment: e.detail.value }))} />
      <View className="acc-btn" onClick={submit}>{pick(locale, "提交反馈", "Submit feedback")}</View>
      <View className="acc-btn-ghost" onClick={() => Taro.navigateTo({ url: "/pages/coupons/index" })}>{pick(locale, "查看正装推荐与券", "View full-bottle picks & coupons")}</View>
    </View>
  );
}
