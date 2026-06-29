import { useState, useEffect } from "react";
import { View, Text, Button, Input } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { SITE_COPY } from "../../data/copy";
import { THEME_CLASS } from "../../lib/theme";
import "./index.scss";

const PHONE_KEY = "userPhone";
const ORDER_TOKEN_STORAGE_KEY = "orderAccessTokens";
const CONTACT_EMAIL = "zpchoney@gmail.com";

export default function Profile() {
  const [phone, setPhone] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [orderCount, setOrderCount] = useState(0);

  const refresh = () => {
    const p = Taro.getStorageSync(PHONE_KEY) || "";
    setPhone(p);
    const tokens = Taro.getStorageSync(ORDER_TOKEN_STORAGE_KEY) || {};
    setOrderCount(Object.keys(tokens).length);
  };

  useEffect(() => { refresh(); }, []);
  useDidShow(() => { refresh(); });

  const startEdit = () => { setDraft(phone); setEditing(true); };

  const savePhone = () => {
    const v = draft.trim();
    if (!/^1\d{10}$/.test(v)) {
      Taro.showToast({ title: "请输入正确的手机号", icon: "none" });
      return;
    }
    Taro.setStorageSync(PHONE_KEY, v);
    setPhone(v);
    setEditing(false);
    Taro.showToast({ title: "已保存", icon: "success" });
  };

  const maskPhone = (p: string) => (p.length === 11 ? `${p.slice(0, 3)}****${p.slice(7)}` : p);

  const goOrders = () => Taro.switchTab({ url: "/pages/orders/index" });
  const goProducts = () => Taro.switchTab({ url: "/pages/products/index" });
  const goFeedback = () => Taro.navigateTo({ url: "/pages/feedback/index" });
  const goPrivacy = () => Taro.navigateTo({ url: "/pages/privacy/index" });
  const retake = () => {
    Taro.removeStorageSync("quizResult");
    Taro.navigateTo({ url: "/pages/quiz/index" });
  };

  const menu = [
    { label: "我的订单", desc: orderCount > 0 ? `本机 ${orderCount} 笔` : "查看与支付", onClick: goOrders },
    { label: "重新测试", desc: "再测一次气味人格", onClick: retake },
    { label: "全部产品", desc: "浏览小样与正装", onClick: goProducts },
    { label: "试香反馈", desc: "告诉我们你的体验", onClick: goFeedback },
    { label: "隐私政策", desc: "了解我们如何保护你的信息", onClick: goPrivacy },
  ];

  return (
    <View className={`profile ${THEME_CLASS}`}>
      <View className="profile-hero">
        <Text className="profile-hero-name">{SITE_COPY.brand.name}</Text>
        <Text className="profile-hero-tagline">{SITE_COPY.brand.tagline}</Text>
      </View>

      <View className="card profile-phone">
        <Text className="section-title profile-inline-title">我的手机号</Text>
        {!editing ? (
          <View className="profile-phone-row">
            <Text className={phone ? "profile-phone-val" : "text-muted"}>
              {phone ? maskPhone(phone) : "未绑定（用于查询订单与自动填写收货信息）"}
            </Text>
            <Text className="profile-phone-action text-sage" onClick={startEdit}>
              {phone ? "修改" : "绑定"}
            </Text>
          </View>
        ) : (
          <View>
            <Input
              className="profile-phone-input"
              type="number"
              maxlength={11}
              placeholder="请输入11位手机号"
              value={draft}
              onInput={(e) => setDraft(e.detail.value)}
            />
            <View className="profile-phone-btns">
              <Button className="btn-secondary profile-phone-btn" onClick={() => setEditing(false)}>取消</Button>
              <Button className="btn-primary profile-phone-btn" onClick={savePhone}>保存</Button>
            </View>
          </View>
        )}
      </View>

      <View className="card profile-menu">
        {menu.map((item, i) => (
          <View
            key={i}
            className={`profile-menu-item ${i === 0 ? "profile-menu-item-first" : ""}`}
            onClick={item.onClick}
          >
            <View className="profile-menu-text">
              <Text className="profile-menu-label">{item.label}</Text>
              <Text className="profile-menu-desc">{item.desc}</Text>
            </View>
            <Text className="profile-menu-arrow">›</Text>
          </View>
        ))}
      </View>

      <View className="card profile-about">
        <Text className="section-title profile-inline-title">关于</Text>
        <Text className="profile-about-text">
          {SITE_COPY.brand.name} 是一个中文香水人格测试与推荐平台。先测再闻，帮你找到真正适合自己的气味。
        </Text>
        <Text className="profile-about-contact">联系我们：{CONTACT_EMAIL}</Text>
      </View>

      <View className="profile-footer">
        <Text className="text-muted">{SITE_COPY.brand.name} · {SITE_COPY.brand.tagline}</Text>
      </View>
    </View>
  );
}
