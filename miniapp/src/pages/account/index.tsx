import { useEffect, useState } from "react";
import { View, Text, Input } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { isLoggedIn, accountLogin, accountLogout, accountMe } from "../../lib/account";
import { THEME_CLASS } from "../../lib/theme";
import "./index.scss";

const NAV: [string, string][] = [
  ["/pages/scent-profile/index", "气味资产"], ["/pages/addresses/index", "地址簿"], ["/pages/wardrobe/index", "香味衣橱"],
  ["/pages/coupons/index", "我的券"], ["/pages/referrals/index", "邀请"], ["/pages/membership/index", "会员"],
  ["/pages/notifications/index", "通知"], ["/pages/invoices/index", "发票"], ["/pages/support/index", "客服"],
  ["/pages/privacy-center/index", "隐私"],
];

export default function Account() {
  const [me, setMe] = useState<any>(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    if (!isLoggedIn()) { setMe(null); setLoading(false); return; }
    accountMe().then(setMe).catch(() => setMe(null)).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function login() {
    if (!/^1\d{10}$/.test(phone)) { Taro.showToast({ title: "请输入有效手机号", icon: "none" }); return; }
    try {
      const r = await accountLogin(phone);
      if (r.ok) { setLoading(true); load(); } else Taro.showToast({ title: "登录失败", icon: "none" });
    } catch { Taro.showToast({ title: "登录失败", icon: "none" }); }
  }

  if (loading) return <View className={`acc ${THEME_CLASS}`}><Text className="acc-muted">加载中…</Text></View>;

  if (!me) {
    return (
      <View className={`acc ${THEME_CLASS}`}>
        <Text className="acc-h">登录 / 注册</Text>
        <Text className="acc-sub">用手机号沉淀你的气味人格、订单、收藏与复购推荐，匿名记录会自动合并。</Text>
        <Input className="acc-input" type="number" placeholder="手机号" value={phone} onInput={(e) => setPhone(e.detail.value)} />
        <View className="acc-btn" onClick={login}>登录 / 注册</View>
        <Text className="acc-muted">登录即表示同意隐私政策与服务协议。</Text>
      </View>
    );
  }

  return (
    <View className={`acc ${THEME_CLASS}`}>
      <View className="acc-row">
        <View>
          <Text className="acc-h" style="font-size:34rpx">{me.user.displayName || me.user.phone}</Text>
          <Text className="acc-muted">{me.user.phone}</Text>
        </View>
        <Text className="acc-chip" onClick={() => { accountLogout(); setMe(null); }}>退出</Text>
      </View>
      <View className="acc-grid">
        {NAV.map(([url, label]) => <View key={url} className="acc-chip" onClick={() => Taro.navigateTo({ url })}>{label}</View>)}
      </View>
      <Text className="acc-h" style="font-size:30rpx;margin-top:24rpx">我的订单</Text>
      {(me.orders || []).map((o: any) => (
        <View key={o.id} className="acc-card" onClick={() => Taro.navigateTo({ url: o.orderType === "proxy" ? `/pages/proxy-order/index?orderNo=${o.orderNo}` : `/pages/order-detail/index?id=${o.id}` })}>
          <View className="acc-row" style="padding:0"><Text className="acc-muted">{o.orderNo}</Text><Text>¥{(((o.finalTotalCents ?? o.amount)) / 100).toFixed(2)}</Text></View>
          <Text>{o.productTitle || (o.orderType === "proxy" ? "代下单" : "小样套装")}</Text>
          <Text className="acc-muted">{o.status}</Text>
        </View>
      ))}
      {(!me.orders || me.orders.length === 0) && <Text className="acc-muted">还没有订单。</Text>}
    </View>
  );
}
