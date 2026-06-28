import { useState, useEffect } from "react";
import { View, Text, Button } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { fetchOrder, loginWechat, requestWechatPay, requestXhsPay } from "../../lib/request";
import { getProductById } from "../../data/products";
import { formatPrice } from "../../lib/utils";
import "./index.scss";

const ORDER_TOKEN_STORAGE_KEY = "orderAccessTokens";

const STATUS_LABELS: Record<string, string> = {
  pending: "待支付",
  paid: "已支付",
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
    productType: string;
    productIds: string[];
    amount: number;
    status: string;
    platform: string;
    customerName: string;
    customerPhone: string;
    transactionId: string | null;
    paidAt: string | null;
    createdAt: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    loadOrder();
  }, []);

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
      if (order.platform === "xhs") {
        const payRes = await requestXhsPay(order.orderId, accessToken);
        await Taro.requestPayment({
          timeStamp: payRes.timeStamp,
          nonceStr: payRes.nonceStr,
          package: payRes.tradeNo,
          signType: payRes.signType as "RSA",
          paySign: payRes.paySign,
        });
      } else {
        const openid = Taro.getStorageSync("openid") || "";
        let resolvedOpenid = openid;
        if (!resolvedOpenid) {
          const loginRes = await Taro.login();
          const authRes = await loginWechat(loginRes.code);
          resolvedOpenid = authRes.openid;
          Taro.setStorageSync("openid", resolvedOpenid);
        }
        const payRes = await requestWechatPay(order.orderId, accessToken, resolvedOpenid);
        await Taro.requestPayment({
          timeStamp: payRes.timeStamp,
          nonceStr: payRes.nonceStr,
          package: payRes.package,
          signType: payRes.signType as "RSA",
          paySign: payRes.paySign,
        });
      }
      await loadOrder();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "支付失败";
      Taro.showToast({ title: msg, icon: "none" });
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <View className="order-detail-loading">
        <Text>加载中...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View className="order-detail-loading">
        <Text>订单不存在</Text>
      </View>
    );
  }

  const products = order.productIds.map((id) => getProductById(id)).filter(Boolean);

  return (
    <View className="order-detail">
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
            <Text className="order-detail-product-name">{p!.name}</Text>
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
        </View>
      )}
    </View>
  );
}

function getStoredOrderAccessToken(orderId: string): string {
  const tokens = Taro.getStorageSync(ORDER_TOKEN_STORAGE_KEY) || {};
  return tokens[orderId] || "";
}
