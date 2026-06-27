import { useState } from "react";
import { View, Text, Input, Button } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { fetchOrders } from "../../lib/request";
import { formatPrice } from "../../lib/utils";
import "./index.scss";

interface OrderItem {
  orderId: string;
  orderNo: string;
  orderAccessToken: string;
  productType: string;
  productIds: string[];
  amount: number;
  status: string;
  platform: string;
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
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!phone.trim()) {
      Taro.showToast({ title: "请输入手机号", icon: "none" });
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetchOrders(phone.trim());
      setOrders(res.orders);
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
        <Input
          className="orders-search-input"
          placeholder="输入手机号查询订单"
          type="number"
          maxlength={11}
          value={phone}
          onInput={(e) => setPhone(e.detail.value)}
        />
        <Button className="btn-primary orders-search-btn" onClick={handleSearch} disabled={loading}>
          {loading ? "查询中..." : "查询"}
        </Button>
      </View>

      {searched && orders.length === 0 && !loading && (
        <View className="orders-empty">
          <Text>暂无订单</Text>
        </View>
      )}

      {orders.map((order) => (
        <View
          key={order.orderId}
          className="order-card"
          onClick={() => goToDetail(order.orderId, order.orderAccessToken)}
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
