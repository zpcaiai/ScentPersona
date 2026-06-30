import { useState, useEffect, useCallback } from "react";
import { View, Text, Button } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { proxyDetail, proxyAction } from "../../lib/proxy";
import { useLang, pick, useNavTitle } from "../../lib/i18n";
import { THEME_CLASS } from "../../lib/theme";
import "../proxy-search/index.scss";

const yuan = (c?: number | null) => (c == null ? "—" : `¥${(c / 100).toFixed(2)}`);

export default function ProxyOrder() {
  const { locale } = useLang();
  useNavTitle("我的代下单", "My proxy orders");
  const router = useRouter();
  const orderNo = router.params.orderNo || "";
  const token = router.params.token || Taro.getStorageSync(`proxyToken:${orderNo}`) || "";
  const [d, setD] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    proxyDetail({ orderNo, token }).then(setD).catch(() => Taro.showToast({ title: pick(locale, "加载失败", "Failed to load"), icon: "none" }));
  }, [orderNo, token]);
  useEffect(() => { load(); }, [load]);

  const act = async (path: string, body: Record<string, unknown> = {}) => {
    if (!d) return;
    setBusy(true);
    try {
      await proxyAction(d.orderId, path, { token, ...body });
      load();
    } catch {
      Taro.showToast({ title: pick(locale, "操作失败", "Action failed"), icon: "none" });
    } finally {
      setBusy(false);
    }
  };

  if (!d) return <View className={`proxy ${THEME_CLASS}`}><Text className="proxy-note">{pick(locale, "加载中…", "Loading…")}</Text></View>;
  const b = d.breakdown || {};
  return (
    <View className={`proxy ${THEME_CLASS}`}>
      <Text className="proxy-status">{d.statusLabel}</Text>
      <Text className="proxy-status-desc">{d.statusDesc}</Text>

      {d.pendingAdjustment && (
        <View className="card">
          <Text className="proxy-adj-title">{pick(locale, "采购时价格发生变化", "Price changed during purchase")}</Text>
          <Text className="proxy-offer-meta">{pick(locale, "原因", "Reason")}：{d.pendingAdjustment.reason}</Text>
          <View className="proxy-line"><Text>{pick(locale, "差价", "Price difference")}</Text><Text>{yuan(d.pendingAdjustment.diffCents)}</Text></View>
          <Button className="btn-primary" loading={busy} onClick={() => act("price-adjustment/accept")}>{pick(locale, "接受并继续", "Accept & continue")}</Button>
          <Button className="btn-secondary" loading={busy} onClick={() => act("price-adjustment/reject")}>{pick(locale, "不接受，申请退款", "Decline & request refund")}</Button>
        </View>
      )}

      <View className="card">
        <Text className="proxy-offer-title">{d.product?.title}</Text>
        <View className="proxy-line proxy-total"><Text>{pick(locale, "实付", "Paid")}</Text><Text>{yuan(b.finalTotalCents ?? b.amountCents)}</Text></View>
      </View>

      {d.address && (
        <View className="card">
          <Text className="section-title">{pick(locale, "收货", "Shipping")}</Text>
          <Text>{d.address.recipientName} · {d.address.phone}</Text>
          <Text className="proxy-offer-meta">{d.address.region} {d.address.line}</Text>
        </View>
      )}
      {d.shipment && (
        <View className="card">
          <Text className="section-title">{pick(locale, "物流", "Tracking")}</Text>
          <Text>{d.shipment.carrierName} {d.shipment.trackingNo}</Text>
          <Text className="proxy-offer-meta">{d.shipment.latestText}</Text>
        </View>
      )}
      <View className="card">
        <Text className="section-title">{pick(locale, "订单进度", "Order progress")}</Text>
        {(d.timeline || []).map((e: any, i: number) => <Text key={i} className="proxy-tl">· {e.title}</Text>)}
      </View>

      {["paid", "purchasing", "out_of_stock", "price_changed"].includes(d.status) &&
        !(d.refunds || []).some((r: any) => r.status === "requested") && (
          <Button className="btn-secondary" loading={busy} onClick={() => act("refund-request", { reason: "用户申请退款" })}>{pick(locale, "申请退款", "Request refund")}</Button>
        )}
    </View>
  );
}
