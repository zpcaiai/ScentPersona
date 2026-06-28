import { useEffect, useState } from "react";
import { View, Text, Button } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { fetchOrder } from "../../lib/request";
import { formatPrice } from "../../lib/utils";
import "./index.scss";

const ORDER_TOKEN_STORAGE_KEY = "orderAccessTokens";

interface OrderItem {
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
  createdAt: string;
  paidAt: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "待支付",
  paid: "已支付",
  shipped: "已发货",
  completed: "已完成",
  cancelled: "已取消",
  refunded: "已退款",
};

export default function Orders() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLocalOrders();
  }, []);

  const loadLocalOrders = async () => {
    setLoading(true);
    const savedTokens = Taro.getStorageSync(ORDER_TOKEN_STORAGE_KEY) || {};
    setTokens(savedTokens);

    try {
      const loaded: Array<OrderItem | null> = await Promise.all(
        Object.entries(savedTokens).map(([orderId, accessToken]) =>
          fetchOrder(orderId, String(accessToken)).then((order) => ({
            orderId: order.orderId,
            orderNo: order.orderNo,
            productType: order.productType,
            productIds: order.productIds,
            amount: order.amount,
            status: order.status,
            platform: order.platform,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            transactionId: order.transactionId,
            createdAt: order.createdAt,
            paidAt: order.paidAt,
          })).catch(() => null)
        )
      );
      setOrders(
        loaded
          .filter((order): order is OrderItem => order !== null)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      );
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const goToDetail = (orderId: string, accessToken: string) => {
    Taro.navigateTo({
      url: `/pages/order-detail/index?orderId=${orderId}&accessToken=${accessToken}`,
    });
  };

  return (
    <View className="orders">
      <View className="orders-search">
        <Button className="btn-primary orders-search-btn" onClick={loadLocalOrders} disabled={loading}>
          {loading ? "加载中..." : "刷新订单"}
        </Button>
      </View>

      {orders.length === 0 && !loading && (
        <View className="orders-empty">
          <Text>暂无本机订单</Text>
        </View>
      )}

      {orders.map((order) => (
        <View
          key={order.orderId}
          className="order-card"
          onClick={() => goToDetail(order.orderId, tokens[order.orderId] || "")}
        >
          <View className="order-card-header">
            <Text className="order-card-no">{order.orderNo}</Text>
            <Text className={`order-card-status order-status-${order.status}`}>
              {STATUS_LABELS[order.status] || order.status}
            </Text>
          </View>
          <Text className="order-card-type">{order.productType}</Text>
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
