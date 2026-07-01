import { useEffect, useState } from "react";
import { View, Text, Input } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { isLoggedIn, accountLogin, accountLogout, accountMe } from "../../lib/account";
import { useLang, pick, useNavTitle } from "../../lib/i18n";
import { THEME_CLASS } from "../../lib/theme";
import "./index.scss";

const NAV: [string, string, string][] = [
  ["/pages/scent-profile/index", "气味资产", "Scent Profile"], ["/pages/addresses/index", "地址簿", "Addresses"], ["/pages/wardrobe/index", "香味衣橱", "Wardrobe"],
  ["/pages/coupons/index", "我的券", "Coupons"], ["/pages/referrals/index", "邀请", "Referrals"], ["/pages/membership/index", "会员", "Membership"],
  ["/pages/notifications/index", "通知", "Notifications"], ["/pages/invoices/index", "发票", "Invoices"], ["/pages/support/index", "客服", "Support"],
  ["/pages/privacy-center/index", "隐私", "Privacy"],
];

export default function Account() {
  const { locale } = useLang();
  useNavTitle("我的", "Me");
  const [me, setMe] = useState<any>(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    if (!isLoggedIn()) { setMe(null); setLoading(false); return; }
    accountMe().then(setMe).catch(() => setMe(null)).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function login() {
    if (!/^1\d{10}$/.test(phone)) { Taro.showToast({ title: pick(locale, "请输入有效手机号", "Please enter a valid phone number"), icon: "none" }); return; }
    try {
      const r = await accountLogin(phone);
      if (r.ok) { setLoading(true); load(); } else Taro.showToast({ title: pick(locale, "登录失败", "Sign in failed"), icon: "none" });
    } catch { Taro.showToast({ title: pick(locale, "登录失败", "Sign in failed"), icon: "none" }); }
  }

  if (loading) return <View className={`acc ${THEME_CLASS}`}><Text className="acc-muted">{pick(locale, "加载中…", "Loading…")}</Text></View>;

  if (!me) {
    return (
      <View className={`acc ${THEME_CLASS}`}>
        <Text className="acc-h">{pick(locale, "登录 / 注册", "Sign in / Sign up")}</Text>
        <Text className="acc-sub">{pick(locale, "用手机号沉淀你的气味人格、订单、收藏与复购推荐，匿名记录会自动合并。", "Use your phone number to save your scent persona, orders, favorites, and reorder picks — any anonymous history merges in automatically.")}</Text>
        <Input className="acc-input" type="number" placeholder={pick(locale, "手机号", "Phone number")} value={phone} onInput={(e) => setPhone(e.detail.value)} />
        <View className="acc-btn" onClick={login}>{pick(locale, "登录 / 注册", "Sign in / Sign up")}</View>
        <Text className="acc-muted">{pick(locale, "登录即表示同意隐私政策与服务协议。", "By signing in you agree to our Privacy Policy and Terms of Service.")}</Text>
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
        <Text className="acc-chip" onClick={() => { accountLogout(); setMe(null); }}>{pick(locale, "退出", "Sign out")}</Text>
      </View>
      <View className="acc-grid">
        {NAV.map(([url, zh, en]) => <View key={url} className="acc-chip" onClick={() => Taro.navigateTo({ url })}>{pick(locale, zh, en)}</View>)}
      </View>
      <Text className="acc-h" style="font-size:30rpx;margin-top:24rpx">{pick(locale, "我的订单", "My orders")}</Text>
      {(me.orders || []).map((o: any) => (
        <View key={o.id} className="acc-card" onClick={() => Taro.navigateTo({ url: o.orderType === "proxy" ? `/pages/proxy-order/index?orderNo=${o.orderNo}` : `/pages/order-detail/index?id=${o.id}` })}>
          <View className="acc-row" style="padding:0"><Text className="acc-muted">{o.orderNo}</Text><Text>¥{(((o.finalTotalCents ?? o.amount)) / 100).toFixed(2)}</Text></View>
          <Text>{o.productTitle || (o.orderType === "proxy" ? pick(locale, "代下单", "Proxy order") : pick(locale, "小样套装", "Sample kit"))}</Text>
          <Text className="acc-muted">{o.status}</Text>
        </View>
      ))}
      {(!me.orders || me.orders.length === 0) && <Text className="acc-muted">{pick(locale, "还没有订单。", "No orders yet.")}</Text>}
    </View>
  );
}
