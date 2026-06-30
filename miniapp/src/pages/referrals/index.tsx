import { useEffect, useState } from "react";
import { View, Text, Input } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { getReferrals, redeemReferral } from "../../lib/account";
import { THEME_CLASS } from "../../lib/theme";
import "../account/index.scss";
export default function Referrals() {
  const [d, setD] = useState<any>(null);
  const [code, setCode] = useState("");
  function load() { getReferrals().then(setD).catch(() => undefined); }
  useEffect(() => { load(); }, []);
  async function redeem() {
    try { const r = await redeemReferral(code); Taro.showToast({ title: r.ok ? "已绑定邀请" : "失败", icon: "none" }); if (r.ok) load(); }
    catch { Taro.showToast({ title: "失败", icon: "none" }); }
  }
  if (!d) return <View className={`acc ${THEME_CLASS}`}><Text className="acc-muted">加载中…</Text></View>;
  return (
    <View className={`acc ${THEME_CLASS}`}>
      <Text className="acc-h">邀请有礼</Text>
      <View className="acc-card" style="text-align:center">
        <Text className="acc-muted">我的邀请码</Text>
        <Text style="display:block;font-size:40rpx;color:#967449;letter-spacing:4rpx;font-family:Georgia,serif">{d.code}</Text>
        <Text className="acc-muted">好友用此码下单，双方各得优惠（订单完成后发放，防自邀）。</Text>
      </View>
      <Input className="acc-input" placeholder="输入好友邀请码" value={code} onInput={(e) => setCode(e.detail.value)} />
      <View className="acc-btn" onClick={redeem}>绑定</View>
      <Text className="acc-h" style="font-size:30rpx;margin-top:24rpx">我的奖励</Text>
      {(d.rewards || []).map((r: any, i: number) => (<View key={i} className="acc-card"><View className="acc-row" style="padding:0"><Text>{r.rewardType}</Text><Text className="acc-muted">{r.status}</Text></View></View>))}
      {(d.rewards || []).length === 0 && <Text className="acc-muted">还没有奖励。</Text>}
    </View>
  );
}
