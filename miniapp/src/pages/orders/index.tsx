import { useEffect, useState } from "react";
import { View, Text, Button, Input } from "@tarojs/components";
import Taro, { useDidShow, usePullDownRefresh } from "@tarojs/taro";
import { fetchOrder, fetchOrders } from "../../lib/request";
import { formatPrice } from "../../lib/utils";
import "./index.scss";

const ORDER_TOKEN_STORAGE_KEY = "orderAccessTokens";
const PHONE_KEY = "userPhone";

interface OrderItem {
  orderId: string;
  orderNo: string;
  productType: string;
  productIds: string[];
  amount: number;
  status: string;
  platform: string;
  createdAt: string;
  paidAt: string | null;
  accessToken: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "待支付",
  paid: "已支付",
  processing: "备货中",
  shipped: "已发货",
  completed: "已完成",
  cancelled: "已取消",
  refunded: "已退款",
};

const TYPE_LABELS: Record<string, string> = {
  single: "单支小样",
  "sample-set-3": "3支小样套装",
  "sample-set-6": "6支小样套装",
  "gift-box": "礼盒套装",
};

function getTokens(): Record<string, string> {
  return Taro.getStorageSync(ORDER_TOKEN_STORAGE_KEY) || {};
}
function saveToken(orderId: string, token: string) {
  const tokens = getTokens();
  Taro.setStorageSync(ORDER_TOKEN_STORAGE_KEY, { ...tokens, [orderId]: token });
}

export default function Orders() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [querying, setQuerying] = useState(false);

  useEffect(() => {
    setPhone(Taro.getStorageSync(PHONE_KEY) || "");
    loadAll(Taro.getStorageSync(PHONE_KEY) || "");
  }, []);

  useDidShow(() => {
    loadAll(Taro.getStorageSync(PHONE_KEY) || phone);
  });

  usePullDownRefresh(async () => {
    await loadAll(Taro.getStorageSync(PHONE_KEY) || phone);
    Taro.stopPullDownRefresh();
  });

  // Load on-device orders (by stored token) and optionally server orders (by phone), merged.
  const loadAll = async (phoneNo: string) => {
    setLoading(true);
    const tokens = getTokens();
    const byId: Record<string, OrderItem> = {};

    const localResults = await Promise.all(
      Object.entries(tokens).map(([orderId, accessToken]) =>
        fetchOrder(orderId, String(accessToken))
          .then((o) => ({ ...o, accessToken: String(accessToken) }))
          .catch(() => null)
      )
    );
    for (const o of localResults) {
      if (o) {
        byId[o.orderId] = {
          orderId: o.orderId, orderNo: o.orderNo, productType: o.productType,
          productIds: o.productIds, amount: o.amount, status: o.status,
          platform: o.platform, createdAt: o.createdAt, paidAt: o.paidAt,
          accessToken: o.accessToken,
        };
      }
    }

    if (phoneNo && /^1\d{10}$/.test(phoneNo)) {
      try {
        const res = await fetchOrders(phoneNo);
        for (const o of res.orders) {
          saveToken(o.orderId, o.orderAccessToken);
          byId[o.orderId] = {
            orderId: o.orderId, orderNo: o.orderNo, productType: o.productType,
            productIds: o.productIds, amount: o.amount, status: o.status,
            platform: o.platform, createdAt: o.createdAt, paidAt: o.paidAt,
            accessToken: o.orderAccessToken,
          };
        }
      } catch {
        // ignore network failure; keep local
      }
    }

    setOrders(
      Object.values(byId).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    );
    setLoading(false);
  };

  const handleQuery = async () => {
    const v = phone.trim();
    if (!/^1\d{10}$/.test(v)) {
      Taro.showToast({ title: "请输入正确的手机号", icon: "none" });
      return;
    }
    Taro.setStorageSync(PHONE_KEY, v);
    setQuerying(true);
    await loadAll(v);
    setQuerying(false);
  };

  const goToDetail = (orderId: string, accessToken: string) => {
    Taro.navigateTo({
      url: `/pages/order-detail/index?orderId=${orderId}&accessToken=${accessToken}`,
    });
  };

  return (
    <View className="orders">
      <View className="orders-header">
        <Text className="orders-title">我的订单</Text>
        <Text className="orders-subtitle">输入手机号可同步在所有设备上的订单</Text>
      </View>

      <View className="orders-search">
        <Input
          className="orders-search-input"
          type="number"
          maxlength={11}
          placeholder="输入下单手机号查询"
          value={phone}
          onInput={(e) => setPhone(e.detail.value)}
        />
        <Button
          className="btn-primary orders-search-btn"
          disabled={querying || loading}
          onClick={handleQuery}
        >
          {querying ? "查询中..." : "查询"}
        </Button>
      </View>

      {loading && (
        <View className="orders-empty">
          <Text className="text-muted">加载中...</Text>
        </View>
      )}

      {!loading && orders.length === 0 && (
        <View className="orders-empty">
          <Text className="text-muted">暂无订单。下单后可在此查看与支付。</Text>
        </View>
      )}

      {orders.map((order) => (
        <View
          key={order.orderId}
          className="order-card"
          onClick={() => goToDetail(order.orderId, order.accessToken)}
        >
          <View className="order-card-header">
            <Text className="order-card-no">{order.orderNo}</Text>
            <Text className={`order-card-status order-status-${order.status}`}>
              {STATUS_LABELS[order.status] || order.status}
            </Text>
          </View>
          <Text className="order-card-type">{TYPE_LABELS[order.productType] || order.productType}</Text>
          <View className="order-card-footer">
            <Text className="order-card-date">
              {new Date(order.createdAt).toLocaleDateString("zh-CN")}
            </Text>
            <Text className="order-card-amount">¥{formatPrice(order.amount)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
