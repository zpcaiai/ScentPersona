import { useEffect, useState } from "react";
import { View, Text, Input } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { getReferrals, redeemReferral } from "../../lib/account";
import { useLang, pick, useNavTitle } from "../../lib/i18n";
import { THEME_CLASS } from "../../lib/theme";
import "../account/index.scss";
export default function Referrals() {
  const { locale } = useLang();
  useNavTitle("邀请有礼", "Refer & earn");
  const [d, setD] = useState<any>(null);
  const [code, setCode] = useState("");
  function load() { getReferrals().then(setD).catch(() => undefined); }
  useEffect(() => { load(); }, []);
  async function redeem() {
    try { const r = await redeemReferral(code); Taro.showToast({ title: r.ok ? pick(locale, "已绑定邀请", "Referral linked") : pick(locale, "失败", "Failed"), icon: "none" }); if (r.ok) load(); }
    catch { Taro.showToast({ title: pick(locale, "失败", "Failed"), icon: "none" }); }
  }
  if (!d) return <View className={`acc ${THEME_CLASS}`}><Text className="acc-muted">{pick(locale, "加载中…", "Loading…")}</Text></View>;
  return (
    <View className={`acc ${THEME_CLASS}`}>
      <Text className="acc-h">{pick(locale, "邀请有礼", "Refer & earn")}</Text>
      <View className="acc-card" style="text-align:center">
        <Text className="acc-muted">{pick(locale, "我的邀请码", "My referral code")}</Text>
        <Text style="display:block;font-size:40rpx;color:#967449;letter-spacing:4rpx;font-family:Georgia,serif">{d.code}</Text>
        <Text className="acc-muted">{pick(locale, "好友用此码下单，双方各得优惠（订单完成后发放，防自邀）。", "When a friend orders with this code, you both get a reward (issued after the order completes; self-referrals don't count).")}</Text>
      </View>
      <Input className="acc-input" placeholder={pick(locale, "输入好友邀请码", "Enter a friend's code")} value={code} onInput={(e) => setCode(e.detail.value)} />
      <View className="acc-btn" onClick={redeem}>{pick(locale, "绑定", "Link")}</View>
      <Text className="acc-h" style="font-size:30rpx;margin-top:24rpx">{pick(locale, "我的奖励", "My rewards")}</Text>
      {(d.rewards || []).map((r: any, i: number) => (<View key={i} className="acc-card"><View className="acc-row" style="padding:0"><Text>{r.rewardType}</Text><Text className="acc-muted">{r.status}</Text></View></View>))}
      {(d.rewards || []).length === 0 && <Text className="acc-muted">{pick(locale, "还没有奖励。", "No rewards yet.")}</Text>}
    </View>
  );
}
