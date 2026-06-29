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
import { THEME_CLASS } from "../../lib/theme";
import "./index.scss";

const ORDER_TOKEN_STORAGE_KEY = "orderAccessTokens";

const STATUS_LABELS: Record<string, string> = {
  pending: "待支付",
  paid: "已支付",
  processing: "备货中",
  shipped: "已发货",
  completed: "已完成",
  cancelled: "已取消",
  refunded: "已退款",
};

export default function OrderDetail() {
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
      Taro.showToast({ title: "加载失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!order) return;
    setPaying(true);
    try {
      await payOrder(order.platform, order.orderId, accessToken);
      await requestShipSubscribe();
      await loadOrder();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "支付失败";
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
      Taro.showToast({ title: "刷新失败", icon: "none" });
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      await cancelOrder(order.orderId, accessToken);
      await loadOrder();
      Taro.showToast({ title: "订单已取消", icon: "success" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "取消失败";
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
        <Text>加载中...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View className={`order-detail-loading ${THEME_CLASS}`}>
        <Text>订单不存在</Text>
      </View>
    );
  }

  const products = order.productIds.map((id) => getProductById(id)).filter(Boolean);

  return (
    <View className={`order-detail ${THEME_CLASS}`}>
      {/* Status banner */}
      <View className={`order-detail-banner order-banner-${order.status}`}>
        <Text className="order-detail-status">
          {STATUS_LABELS[order.status] || order.status}
        </Text>
        {order.paidAt && (
          <Text className="order-detail-paid-time">
            支付时间: {new Date(order.paidAt).toLocaleString("zh-CN")}
          </Text>
        )}
      </View>

      {/* Products */}
      <View className="card">
        <Text className="section-title">商品</Text>
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
          <Text>合计</Text>
          <Text className="order-detail-amount">¥{formatPrice(order.amount)}</Text>
        </View>
      </View>

      {/* Info */}
      <View className="card">
        <Text className="section-title">订单信息</Text>
        <View className="order-detail-row">
          <Text className="order-detail-label">订单号</Text>
          <Text className="order-detail-value">{order.orderNo}</Text>
        </View>
        <View className="order-detail-row">
          <Text className="order-detail-label">下单时间</Text>
          <Text className="order-detail-value">
            {new Date(order.createdAt).toLocaleString("zh-CN")}
          </Text>
        </View>
        <View className="order-detail-row">
          <Text className="order-detail-label">收货人</Text>
          <Text className="order-detail-value">{order.customerName}</Text>
        </View>
        <View className="order-detail-row">
          <Text className="order-detail-label">手机号</Text>
          <Text className="order-detail-value">{order.customerPhone}</Text>
        </View>
        {order.shippingAddress && (
          <View className="order-detail-row">
            <Text className="order-detail-label">收货地址</Text>
            <Text className="order-detail-value">{order.shippingAddress}</Text>
          </View>
        )}
        {order.trackingNumber && (
          <View className="order-detail-row">
            <Text className="order-detail-label">物流单号</Text>
            <Text className="order-detail-value">{order.trackingNumber}</Text>
          </View>
        )}
        <View className="order-detail-row">
          <Text className="order-detail-label">平台</Text>
          <Text className="order-detail-value">
            {order.platform === "xhs" ? "小红书" : "微信"}
          </Text>
        </View>
        {order.transactionId && (
          <View className="order-detail-row">
            <Text className="order-detail-label">交易号</Text>
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
            {paying ? "支付中..." : "立即支付"}
          </Button>
          <Button
            className="btn-secondary"
            disabled={cancelling}
            onClick={handleCancel}
          >
            {cancelling ? "取消中..." : "取消订单"}
          </Button>
        </View>
      )}
      <View className="order-detail-pay">
        <Button className="btn-secondary" onClick={handleRefresh}>
          刷新订单
        </Button>
        {order.status !== "pending" && order.status !== "cancelled" && order.status !== "refunded" && (
          <Button className="btn-primary" onClick={goToFeedback}>
            填写试香反馈
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
