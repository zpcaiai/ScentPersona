import { useState } from "react";
import { View, Text, Input, Button } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { getProductById } from "../../data/products";
import { SITE_COPY } from "../../data/copy";
import { formatPrice } from "../../lib/utils";
import { createOrder, loginWechat, requestWechatPay, requestXhsPay } from "../../lib/request";
import "./index.scss";

const ORDER_TOKEN_STORAGE_KEY = "orderAccessTokens";

function saveOrderAccessToken(orderId: string, accessToken: string) {
  const tokens = Taro.getStorageSync(ORDER_TOKEN_STORAGE_KEY) || {};
  Taro.setStorageSync(ORDER_TOKEN_STORAGE_KEY, {
    ...tokens,
    [orderId]: accessToken,
  });
}

export default function Checkout() {
  const router = useRouter();
  const productIds = (router.params.productIds || "").split(",").filter(Boolean);
  const productType = router.params.productType || "sample-set-3";
  const price = parseInt(router.params.price || "2990", 10);
  const sessionId = router.params.sessionId || "";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [orderAccessToken, setOrderAccessToken] = useState("");
  const [payError, setPayError] = useState("");

  const products = productIds.map((id) => getProductById(id)).filter(Boolean);

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      Taro.showToast({ title: "请填写姓名和手机号", icon: "none" });
      return;
    }

    setLoading(true);
    setPayError("");

    try {
      const platform = (Taro.getEnv() as string) === "XHS" ? "xhs" : "weapp";

      const orderRes = await createOrder({
        sessionId,
        productType,
        productIds,
        amount: price,
        platform,
        customerName: name,
        customerPhone: phone,
        shippingAddress: address || undefined,
        note: note || undefined,
      });

      setOrderId(orderRes.orderId);
      setOrderNo(orderRes.orderNo);
      setOrderAccessToken(orderRes.orderAccessToken);
      saveOrderAccessToken(orderRes.orderId, orderRes.orderAccessToken);

      if (platform === "xhs") {
        await payXhs(orderRes.orderId, orderRes.orderAccessToken);
      } else {
        await payWechat(orderRes.orderId, orderRes.orderAccessToken);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "下单失败";
      setPayError(msg);
    } finally {
      setLoading(false);
    }
  };

  const payWechat = async (oid: string, accessToken: string) => {
    try {
      const openid = Taro.getStorageSync("openid") || "";
      let resolvedOpenid = openid;

      if (!resolvedOpenid) {
        const loginRes = await Taro.login();
        const authRes = await loginWechat(loginRes.code);
        resolvedOpenid = authRes.openid;
        Taro.setStorageSync("openid", resolvedOpenid);
      }

      const payRes = await requestWechatPay(oid, accessToken, resolvedOpenid);

      await Taro.requestPayment({
        timeStamp: payRes.timeStamp,
        nonceStr: payRes.nonceStr,
        package: payRes.package,
        signType: payRes.signType as "RSA",
        paySign: payRes.paySign,
      });

      setSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "支付发起失败";
      if (msg.includes("cancel")) {
        setPayError("支付已取消");
      } else {
        setPayError(`微信支付失败: ${msg}`);
      }
    }
  };

  const payXhs = async (oid: string, accessToken: string) => {
    try {
      const payRes = await requestXhsPay(oid, accessToken);

      await Taro.requestPayment({
        timeStamp: payRes.timeStamp,
        nonceStr: payRes.nonceStr,
        package: payRes.tradeNo,
        signType: payRes.signType as "RSA",
        paySign: payRes.paySign,
      });

      setSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "支付发起失败";
      if (msg.includes("cancel")) {
        setPayError("支付已取消");
      } else {
        setPayError(`小红书支付失败: ${msg}`);
      }
    }
  };

  if (success) {
    return (
      <View className="checkout-success">
        <Text className="checkout-success-title">支付成功</Text>
        <Text className="checkout-success-desc">
          订单号: {orderNo}
        </Text>
        <Text className="checkout-success-desc">我们将在3个工作日内发货</Text>
        <Button
          className="btn-primary"
          onClick={() => Taro.redirectTo({ url: `/pages/order-detail/index?orderId=${orderId}&accessToken=${orderAccessToken}` })}
        >
          查看订单
        </Button>
        <Button
          className="btn-secondary"
          onClick={() => Taro.reLaunch({ url: "/pages/index/index" })}
        >
          返回首页
        </Button>
      </View>
    );
  }

  return (
    <View className="checkout">
      <View className="checkout-header">
        <Text className="checkout-title">{SITE_COPY.checkout.title}</Text>
        <Text className="checkout-subtitle">{SITE_COPY.checkout.subtitle}</Text>
      </View>

      <View className="card">
        <Text className="section-title">产品清单</Text>
        {products.map((p) => (
          <View key={p!.id} className="checkout-product">
            <Text className="checkout-product-name">{p!.name}</Text>
            <Text className="checkout-product-price">
              ¥{formatPrice(p!.price.sample || 0)}
            </Text>
          </View>
        ))}
        <View className="checkout-total">
          <Text className="checkout-total-label">合计</Text>
          <Text className="checkout-total-price">¥{formatPrice(price)}</Text>
        </View>
      </View>

      <View className="card">
        <Text className="section-title">收货信息</Text>
        <View className="checkout-field">
          <Text className="checkout-field-label">姓名</Text>
          <Input
            className="checkout-input"
            placeholder="请输入收货人姓名"
            value={name}
            onInput={(e) => setName(e.detail.value)}
          />
        </View>
        <View className="checkout-field">
          <Text className="checkout-field-label">手机号</Text>
          <Input
            className="checkout-input"
            placeholder="请输入手机号"
            type="number"
            maxlength={11}
            value={phone}
            onInput={(e) => setPhone(e.detail.value)}
          />
        </View>
        <View className="checkout-field">
          <Text className="checkout-field-label">收货地址</Text>
          <Input
            className="checkout-input"
            placeholder="请输入收货地址"
            value={address}
            onInput={(e) => setAddress(e.detail.value)}
          />
        </View>
        <View className="checkout-field">
          <Text className="checkout-field-label">备注</Text>
          <Input
            className="checkout-input"
            placeholder="选填"
            value={note}
            onInput={(e) => setNote(e.detail.value)}
          />
        </View>
      </View>

      {payError && (
        <View className="checkout-pay-error">
          <Text>{payError}</Text>
        </View>
      )}

      {orderNo && !success && (
        <View className="checkout-order-info">
          <Text className="checkout-order-no">订单号: {orderNo}</Text>
          <Text className="checkout-order-tip">订单已创建，请完成支付</Text>
        </View>
      )}

      <View className="checkout-bottom">
        <View className="checkout-bottom-price">
          <Text className="checkout-bottom-label">应付</Text>
          <Text className="checkout-bottom-amount">¥{formatPrice(price)}</Text>
        </View>
        <Button
          className="btn-primary checkout-submit"
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading ? "处理中..." : "下单并支付"}
        </Button>
      </View>
    </View>
  );
}
