import { useEffect, useState } from "react";
import { View, Text, Button, Input } from "@tarojs/components";
import Taro, { useDidShow, usePullDownRefresh } from "@tarojs/taro";
import { fetchOrder, fetchOrders } from "../../lib/request";
import { formatPrice } from "../../lib/utils";
import { useLang, pick, type Locale, useNavTitle } from "../../lib/i18n";
import { THEME_CLASS } from "../../lib/theme";
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

const TYPE_LABELS: Record<Locale, Record<string, string>> = {
  zh: {
    single: "单支小样",
    "sample-set-3": "3支小样套装",
    "sample-set-6": "6支小样套装",
    "gift-box": "礼盒套装",
  },
  en: {
    single: "Single sample",
    "sample-set-3": "3-sample kit",
    "sample-set-6": "6-sample kit",
    "gift-box": "Gift box kit",
  },
};

function getTokens(): Record<string, string> {
  return Taro.getStorageSync(ORDER_TOKEN_STORAGE_KEY) || {};
}
function saveToken(orderId: string, token: string) {
  const tokens = getTokens();
  Taro.setStorageSync(ORDER_TOKEN_STORAGE_KEY, { ...tokens, [orderId]: token });
}

export default function Orders() {
  const { locale } = useLang();
  useNavTitle("我的订单", "My orders");
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
      Taro.showToast({ title: pick(locale, "请输入正确的手机号", "Please enter a valid phone number"), icon: "none" });
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
    <View className={`orders ${THEME_CLASS}`}>
      <View className="orders-header">
        <Text className="orders-title">{pick(locale, "我的订单", "My orders")}</Text>
        <Text className="orders-subtitle">{pick(locale, "输入手机号可同步在所有设备上的订单", "Enter your phone number to sync orders across all devices")}</Text>
      </View>

      <View className="orders-search">
        <Input
          className="orders-search-input"
          type="number"
          maxlength={11}
          placeholder={pick(locale, "输入下单手机号查询", "Enter the phone number used at checkout")}
          value={phone}
          onInput={(e) => setPhone(e.detail.value)}
        />
        <Button
          className="btn-primary orders-search-btn"
          disabled={querying || loading}
          onClick={handleQuery}
        >
          {querying ? pick(locale, "查询中...", "Searching...") : pick(locale, "查询", "Search")}
        </Button>
      </View>

      {loading && (
        <View className="orders-empty">
          <Text className="text-muted">{pick(locale, "加载中...", "Loading...")}</Text>
        </View>
      )}

      {!loading && orders.length === 0 && (
        <View className="orders-empty">
          <Text className="text-muted">{pick(locale, "暂无订单。下单后可在此查看与支付。", "No orders yet. Once you order, you can view and pay here.")}</Text>
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
              {STATUS_LABELS[locale][order.status] || order.status}
            </Text>
          </View>
          <Text className="order-card-type">{TYPE_LABELS[locale][order.productType] || order.productType}</Text>
          <View className="order-card-footer">
            <Text className="order-card-date">
              {new Date(order.createdAt).toLocaleDateString(pick(locale, "zh-CN", "en-US"))}
            </Text>
            <Text className="order-card-amount">¥{formatPrice(order.amount)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
