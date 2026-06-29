import { useEffect, useState } from "react";
import { View, Text, Input, Button, Checkbox, Image } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { getProductById } from "../../data/products";
import { SITE_COPY } from "../../data/copy";
import { formatPrice } from "../../lib/utils";
import { createOrder, trackEvent, assetUrl } from "../../lib/request";
import { payWechatOrder, payXhsOrder } from "../../lib/pay";
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
  const [phone, setPhone] = useState<string>(Taro.getStorageSync("userPhone") || "");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [orderAccessToken, setOrderAccessToken] = useState("");
  const [payError, setPayError] = useState("");
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  const products = productIds.map((id) => getProductById(id)).filter(Boolean);

  useEffect(() => {
    trackEvent({
      eventName: "checkout_view",
      path: "/pages/checkout/index",
      sessionId,
    });
  }, [sessionId]);

  const handleSubmit = async () => {
    if (!name.trim() || !/^1\d{10}$/.test(phone.trim())) {
      Taro.showToast({ title: "请填写正确姓名和手机号", icon: "none" });
      return;
    }

    if (!address.trim()) {
      Taro.showToast({ title: "请填写收货地址", icon: "none" });
      return;
    }

    if (!privacyAgreed) {
      Taro.showToast({ title: "请先同意隐私与订单处理说明", icon: "none" });
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
      trackEvent({
        eventName: "checkout_submit",
        path: "/pages/checkout/index",
        sessionId,
        orderId: orderRes.orderId,
      });

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
      await payWechatOrder(oid, accessToken);
      // persist phone for future autofill / order lookup
      if (/^1\d{10}$/.test(phone.trim())) Taro.setStorageSync("userPhone", phone.trim());
      await requestShipSubscribe();
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
      await payXhsOrder(oid, accessToken);
      if (/^1\d{10}$/.test(phone.trim())) Taro.setStorageSync("userPhone", phone.trim());
      await requestShipSubscribe();
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

  const chooseAddress = async () => {
    try {
      if (typeof (Taro as any).chooseAddress !== "function") {
        Taro.showToast({ title: "当前平台不支持地址选择", icon: "none" });
        return;
      }

      const result = await (Taro as any).chooseAddress();
      setName(result.userName || name);
      setPhone(result.telNumber || phone);
      setAddress(
        `${result.provinceName || ""}${result.cityName || ""}${result.countyName || ""}${result.detailInfo || ""}`
      );
    } catch {
      Taro.showToast({ title: "未选择地址", icon: "none" });
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
            <View className="checkout-product-left">
              <Image className="checkout-product-img" src={assetUrl(p!.image)} mode="aspectFill" />
              <Text className="checkout-product-name">{p!.name}</Text>
            </View>
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
        <Button className="btn-secondary" onClick={chooseAddress}>
          使用微信收货地址
        </Button>
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
        <View
          className="checkout-privacy"
          onClick={() => setPrivacyAgreed((value) => !value)}
        >
          <Checkbox
            value="privacy-agreed"
            checked={privacyAgreed}
          />
          <Text className="checkout-privacy-text">
            我已阅读并同意
            <Text
              className="checkout-privacy-link"
              onClick={(e) => {
                e.stopPropagation();
                Taro.navigateTo({ url: "/pages/privacy/index" });
              }}
            >
              《隐私政策》
            </Text>
            ，并将收货信息用于订单支付、发货和售后处理
          </Text>
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

async function requestShipSubscribe() {
  const templateId = process.env.SHIP_SUBSCRIBE_TEMPLATE_ID || "";
  if ((Taro.getEnv() as string) !== "WEAPP" || !templateId) return;

  try {
    await (Taro as any).requestSubscribeMessage({ tmplIds: [templateId] });
  } catch {
    // Subscription is optional; payment success should not depend on it.
  }
}
