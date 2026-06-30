import { useState, useEffect } from "react";
import { View, Text, Input, Button } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { proxyDetail, proxyConfirm, proxyPay, proxyMockPay, proxyPayWechat, proxyPayXhs } from "../../lib/proxy";
import { resolveOpenid } from "../../lib/pay";
import { useLang, pick, useNavTitle } from "../../lib/i18n";
import { THEME_CLASS } from "../../lib/theme";
import "../proxy-search/index.scss";

const yuan = (c?: number | null) => (c == null ? "—" : `¥${(c / 100).toFixed(2)}`);

export default function ProxyConfirm() {
  const { locale } = useLang();
  useNavTitle("确认代下单", "Confirm proxy order");
  const router = useRouter();
  const orderId = router.params.orderId || "";
  const token = router.params.token || "";
  const [d, setD] = useState<any>(null);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ recipientName: "", phone: "", province: "", city: "", district: "", addressLine1: "", postalCode: "" });

  useEffect(() => {
    proxyDetail({ id: orderId, token }).then(setD).catch(() => Taro.showToast({ title: pick(locale, "加载失败", "Failed to load"), icon: "none" }));
  }, [orderId, token]);

  const set = (k: string) => (e: any) => setF((p) => ({ ...p, [k]: e.detail.value }));

  async function submit() {
    if (!agree) {
      Taro.showToast({ title: pick(locale, "请先同意服务协议", "Please agree to the service terms first"), icon: "none" });
      return;
    }
    setBusy(true);
    try {
      const c = await proxyConfirm(orderId, { ...f, agreementAccepted: true });
      if (!c.ok) {
        Taro.showToast({ title: pick(locale, "确认失败", "Confirmation failed"), icon: "none" });
        return;
      }

      // Real WeChat JSAPI pay on weapp (falls back to demo mock if not configured).
      if (Taro.getEnv() === "WEAPP") {
        let wx: { mode: string; params?: any } | null = null;
        try {
          const openid = await resolveOpenid();
          wx = await proxyPayWechat(orderId, openid);
        } catch {
          wx = null; // provider not configured -> demo fallback below
        }
        if (wx && wx.mode === "jsapi" && wx.params) {
          try {
            await Taro.requestPayment({
              timeStamp: wx.params.timeStamp,
              nonceStr: wx.params.nonceStr,
              package: wx.params.package,
              signType: wx.params.signType,
              paySign: wx.params.paySign,
            });
            Taro.redirectTo({ url: `/pages/proxy-order/index?orderNo=${d.orderNo}&token=${token}` });
          } catch {
            Taro.showToast({ title: pick(locale, "支付未完成", "Payment not completed"), icon: "none" });
          }
          return;
        }
      }

      // Real 小红书 pay on XHS mini-program (falls back to demo mock if not configured).
      if ((Taro.getEnv() as string) === "XHS") {
        let xr: { ok: boolean; params?: any } | null = null;
        try {
          xr = await proxyPayXhs(orderId);
        } catch {
          xr = null;
        }
        if (xr && xr.params) {
          try {
            const p = xr.params;
            const xhs = (globalThis as any).xhs;
            if (xhs && typeof xhs.requestPayment === "function") {
              await new Promise<void>((resolve, reject) => {
                xhs.requestPayment({
                  timeStamp: p.timeStamp, nonceStr: p.nonceStr, package: p.tradeNo, signType: p.signType, paySign: p.paySign,
                  success: () => resolve(),
                  fail: (e: any) => reject(new Error(e?.errMsg || pick(locale, "支付失败", "Payment failed"))),
                });
              });
            } else {
              await (Taro as any).requestPayment({ timeStamp: p.timeStamp, nonceStr: p.nonceStr, package: p.tradeNo, signType: p.signType, paySign: p.paySign });
            }
            Taro.redirectTo({ url: `/pages/proxy-order/index?orderNo=${d.orderNo}&token=${token}` });
          } catch {
            Taro.showToast({ title: pick(locale, "支付未完成", "Payment not completed"), icon: "none" });
          }
          return;
        }
      }

      // Demo / fallback: mock cashier.
      await proxyPay(orderId);
      const m = await proxyMockPay(orderId, "success");
      if (m.status === "paid") {
        Taro.redirectTo({ url: `/pages/proxy-order/index?orderNo=${m.orderNo}&token=${m.accessToken}` });
      } else {
        Taro.showToast({ title: pick(locale, "支付未成功", "Payment unsuccessful"), icon: "none" });
      }
    } catch {
      Taro.showToast({ title: pick(locale, "网络错误", "Network error"), icon: "none" });
    } finally {
      setBusy(false);
    }
  }

  if (!d) return <View className={`proxy ${THEME_CLASS}`}><Text className="proxy-note">{pick(locale, "加载中…", "Loading…")}</Text></View>;
  const b = d.breakdown || {};
  return (
    <View className={`proxy ${THEME_CLASS}`}>
      <View className="card">
        <Text className="proxy-offer-title">{d.product?.title}</Text>
        <Text className="proxy-offer-meta">{d.product?.sourcePlatform} · ×{d.product?.quantity}</Text>
        <View className="proxy-line"><Text>{pick(locale, "商品价", "Item price")}</Text><Text>{yuan(b.productPriceCents)}</Text></View>
        <View className="proxy-line"><Text>{pick(locale, "代下单服务费", "Proxy order service fee")}</Text><Text>{yuan(b.serviceFeeCents)}</Text></View>
        <View className="proxy-line proxy-total"><Text>{pick(locale, "合计", "Total")}</Text><Text>{yuan(b.estimatedTotalCents)}</Text></View>
      </View>
      <View className="card">
        <Text className="section-title">{pick(locale, "收货信息", "Shipping details")}</Text>
        <Input className="proxy-input" placeholder={pick(locale, "收件人", "Recipient")} onInput={set("recipientName")} />
        <Input className="proxy-input" placeholder={pick(locale, "手机号", "Phone number")} type="number" onInput={set("phone")} />
        <Input className="proxy-input" placeholder={pick(locale, "省", "Province")} onInput={set("province")} />
        <Input className="proxy-input" placeholder={pick(locale, "市", "City")} onInput={set("city")} />
        <Input className="proxy-input" placeholder={pick(locale, "区/县", "District")} onInput={set("district")} />
        <Input className="proxy-input" placeholder={pick(locale, "详细地址", "Street address")} onInput={set("addressLine1")} />
      </View>
      <View className="proxy-agree" onClick={() => setAgree((a) => !a)}>
        <Text>{agree ? "☑" : "☐"} {pick(locale, "我确认授权平台按以上商品信息为我代下单，若价格变化/缺货/物流限制，同意由平台联系我确认补差价、换品或退款。", "I authorize the platform to place a proxy order based on the item details above. If the price changes, the item is out of stock, or shipping is restricted, I agree to be contacted to confirm paying the difference, swapping the item, or a refund.")}</Text>
      </View>
      <Button className="btn-primary" loading={busy} onClick={submit}>{pick(locale, "确认并支付（演示）", "Confirm & pay (demo)")}</Button>
      <Text className="proxy-note">{pick(locale, "演示环境使用模拟支付；生产环境将接入微信/小红书支付。", "The demo uses mock payment; production will use WeChat / Xiaohongshu Pay.")}</Text>
    </View>
  );
}
