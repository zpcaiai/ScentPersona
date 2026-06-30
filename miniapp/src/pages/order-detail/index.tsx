import { useState, useEffect } from "react";
import { View, Text, Button, Image } from "@tarojs/components";
import Taro, { useRouter, usePullDownRefresh } from "@tarojs/taro";
import {
  cancelOrder,
  fetchOrder,
  requestWechatPayStatus,
} from "../../lib/request";
import { assetUrl } from "../../lib/request";
import { payOrder } from "../../lib/pay";
import { getProductById } from "../../data/products";
import { formatPrice } from "../../lib/utils";
import { useLang, pick, type Locale } from "../../lib/i18n";
import { THEME_CLASS } from "../../lib/theme";
import "./index.scss";

const ORDER_TOKEN_STORAGE_KEY = "orderAccessTokens";

const STATUS_LABELS: Record<Locale, Record<string, string>> = {
  zh: {
    pending: "待支付",
    paid: "已支付",
    processing: "备货中",
    shipped: "已发货",
    completed: "已完成",
    cancelled: "已取消",
    refunded: "已退款",
  },
  en: {
    pending: "Unpaid",
    paid: "Paid",
    processing: "Preparing",
    shipped: "Shipped",
    completed: "Completed",
    cancelled: "Cancelled",
    refunded: "Refunded",
  },
};

export default function OrderDetail() {
  const { locale } = useLang();
  const router = useRouter();
  const orderId = router.params.orderId || "";
  const accessToken = router.params.accessToken || getStoredOrderAccessToken(orderId);

  const [order, setOrder] = useState<{
    orderId: string;
    orderNo: string;
    sessionId: string | null;
    productType: string;
    productIds: string[];
    amount: number;
    status: string;
    platform: string;
    customerName: string;
    customerPhone: string;
    shippingAddress: string | null;
    trackingNumber: string | null;
    transactionId: string | null;
    paidAt: string | null;
    shippedAt: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
    refundedAt: string | null;
    createdAt: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadOrder();
  }, []);

  usePullDownRefresh(async () => {
    await handleRefresh();
    Taro.stopPullDownRefresh();
  });

  const loadOrder = async () => {
    try {
      if (!accessToken) {
        throw new Error("Missing order access token");
      }
      const res = await fetchOrder(orderId, accessToken);
      setOrder(res);
    } catch {
      Taro.showToast({ title: pick(locale, "加载失败", "Failed to load"), icon: "none" });
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!order) return;
    setPaying(true);
    try {
      await payOrder(order.platform, order.orderId, accessToken, locale);
      await requestShipSubscribe();
      await loadOrder();
    } catch (err) {
      const msg = err instanceof Error ? err.message : pick(locale, "支付失败", "Payment failed");
      Taro.showToast({ title: msg, icon: "none" });
    } finally {
      setPaying(false);
    }
  };

  const handleRefresh = async () => {
    if (!order) return;
    try {
      if (order.platform !== "xhs" && order.status === "pending") {
        await requestWechatPayStatus(order.orderId, accessToken).catch(() => null);
      }
      await loadOrder();
    } catch {
      Taro.showToast({ title: pick(locale, "刷新失败", "Failed to refresh"), icon: "none" });
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      await cancelOrder(order.orderId, accessToken);
      await loadOrder();
      Taro.showToast({ title: pick(locale, "订单已取消", "Order cancelled"), icon: "success" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : pick(locale, "取消失败", "Cancellation failed");
      Taro.showToast({ title: msg, icon: "none" });
    } finally {
      setCancelling(false);
    }
  };

  const goToFeedback = () => {
    if (!order) return;
    Taro.navigateTo({
      url: `/pages/feedback/index?sessionId=${order.sessionId || ""}&orderId=${order.orderId}&orderAccessToken=${accessToken}`,
    });
  };

  if (loading) {
    return (
      <View className={`order-detail-loading ${THEME_CLASS}`}>
        <Text>{pick(locale, "加载中...", "Loading...")}</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View className={`order-detail-loading ${THEME_CLASS}`}>
        <Text>{pick(locale, "订单不存在", "Order not found")}</Text>
      </View>
    );
  }

  const products = order.productIds.map((id) => getProductById(id, locale)).filter(Boolean);

  return (
    <View className={`order-detail ${THEME_CLASS}`}>
      {/* Status banner */}
      <View className={`order-detail-banner order-banner-${order.status}`}>
        <Text className="order-detail-status">
          {STATUS_LABELS[locale][order.status] || order.status}
        </Text>
        {order.paidAt && (
          <Text className="order-detail-paid-time">
            {pick(locale, "支付时间", "Paid at")}: {new Date(order.paidAt).toLocaleString(pick(locale, "zh-CN", "en-US"))}
          </Text>
        )}
      </View>

      {/* Products */}
      <View className="card">
        <Text className="section-title">{pick(locale, "商品", "Items")}</Text>
        {products.map((p) => (
          <View key={p!.id} className="order-detail-product">
            <View className="order-detail-product-left">
              <Image className="order-detail-product-img" src={assetUrl(p!.image)} mode="aspectFill" />
              <Text className="order-detail-product-name">{p!.name}</Text>
            </View>
            <Text className="order-detail-product-price">
              ¥{formatPrice(p!.price.sample || 0)}
            </Text>
          </View>
        ))}
        <View className="order-detail-total">
          <Text>{pick(locale, "合计", "Total")}</Text>
          <Text className="order-detail-amount">¥{formatPrice(order.amount)}</Text>
        </View>
      </View>

      {/* Info */}
      <View className="card">
        <Text className="section-title">{pick(locale, "订单信息", "Order details")}</Text>
        <View className="order-detail-row">
          <Text className="order-detail-label">{pick(locale, "订单号", "Order number")}</Text>
          <Text className="order-detail-value">{order.orderNo}</Text>
        </View>
        <View className="order-detail-row">
          <Text className="order-detail-label">{pick(locale, "下单时间", "Order placed")}</Text>
          <Text className="order-detail-value">
            {new Date(order.createdAt).toLocaleString(pick(locale, "zh-CN", "en-US"))}
          </Text>
        </View>
        <View className="order-detail-row">
          <Text className="order-detail-label">{pick(locale, "收货人", "Recipient")}</Text>
          <Text className="order-detail-value">{order.customerName}</Text>
        </View>
        <View className="order-detail-row">
          <Text className="order-detail-label">{pick(locale, "手机号", "Phone number")}</Text>
          <Text className="order-detail-value">{order.customerPhone}</Text>
        </View>
        {order.shippingAddress && (
          <View className="order-detail-row">
            <Text className="order-detail-label">{pick(locale, "收货地址", "Shipping address")}</Text>
            <Text className="order-detail-value">{order.shippingAddress}</Text>
          </View>
        )}
        {order.trackingNumber && (
          <View className="order-detail-row">
            <Text className="order-detail-label">{pick(locale, "物流单号", "Tracking number")}</Text>
            <Text className="order-detail-value">{order.trackingNumber}</Text>
          </View>
        )}
        <View className="order-detail-row">
          <Text className="order-detail-label">{pick(locale, "平台", "Platform")}</Text>
          <Text className="order-detail-value">
            {order.platform === "xhs" ? pick(locale, "小红书", "Xiaohongshu") : pick(locale, "微信", "WeChat")}
          </Text>
        </View>
        {order.transactionId && (
          <View className="order-detail-row">
            <Text className="order-detail-label">{pick(locale, "交易号", "Transaction ID")}</Text>
            <Text className="order-detail-value">{order.transactionId}</Text>
          </View>
        )}
      </View>

      {/* Pay button */}
      {order.status === "pending" && (
        <View className="order-detail-pay">
          <Button
            className="btn-primary"
            disabled={paying}
            onClick={handlePay}
          >
            {paying ? pick(locale, "支付中...", "Paying...") : pick(locale, "立即支付", "Pay now")}
          </Button>
          <Button
            className="btn-secondary"
            disabled={cancelling}
            onClick={handleCancel}
          >
            {cancelling ? pick(locale, "取消中...", "Cancelling...") : pick(locale, "取消订单", "Cancel order")}
          </Button>
        </View>
      )}
      <View className="order-detail-pay">
        <Button className="btn-secondary" onClick={handleRefresh}>
          {pick(locale, "刷新订单", "Refresh order")}
        </Button>
        {order.status !== "pending" && order.status !== "cancelled" && order.status !== "refunded" && (
          <Button className="btn-primary" onClick={goToFeedback}>
            {pick(locale, "填写试香反馈", "Share scent feedback")}
          </Button>
        )}
      </View>
    </View>
  );
}

function getStoredOrderAccessToken(orderId: string): string {
  const tokens = Taro.getStorageSync(ORDER_TOKEN_STORAGE_KEY) || {};
  return tokens[orderId] || "";
}

async function requestShipSubscribe() {
  const templateId = process.env.SHIP_SUBSCRIBE_TEMPLATE_ID || "";
  if ((Taro.getEnv() as string) !== "WEAPP" || !templateId) return;

  try {
    await (Taro as any).requestSubscribeMessage({ tmplIds: [templateId] });
  } catch {
    // Subscription is optional; payment success should not depend on it.
  }
}
