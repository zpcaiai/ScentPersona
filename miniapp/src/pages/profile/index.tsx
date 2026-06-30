import { useState, useEffect } from "react";
import { View, Text, Button, Input } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { getSiteCopy } from "../../data/copy";
import { THEME_CLASS } from "../../lib/theme";
import { useLang, pick } from "../../lib/i18n";
import "./index.scss";

const PHONE_KEY = "userPhone";
const ORDER_TOKEN_STORAGE_KEY = "orderAccessTokens";
const CONTACT_EMAIL = "zpchoney@gmail.com";

export default function Profile() {
  const { locale, setLocale } = useLang();
  const copy = getSiteCopy(locale);
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
      Taro.showToast({ title: pick(locale, "请输入正确的手机号", "Please enter a valid phone number"), icon: "none" });
      return;
    }
    Taro.setStorageSync(PHONE_KEY, v);
    setPhone(v);
    setEditing(false);
    Taro.showToast({ title: pick(locale, "已保存", "Saved"), icon: "success" });
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
    { label: pick(locale, "我的订单", "My orders"), desc: orderCount > 0 ? pick(locale, `本机 ${orderCount} 笔`, `${orderCount} on this device`) : pick(locale, "查看与支付", "View & pay"), onClick: goOrders },
    { label: pick(locale, "重新测试", "Retake quiz"), desc: pick(locale, "再测一次气味人格", "Find your scent persona again"), onClick: retake },
    { label: pick(locale, "全部产品", "All products"), desc: pick(locale, "浏览小样与正装", "Browse samples & full bottles"), onClick: goProducts },
    { label: pick(locale, "试香反馈", "Scent feedback"), desc: pick(locale, "告诉我们你的体验", "Tell us how it went"), onClick: goFeedback },
    { label: pick(locale, "隐私政策", "Privacy Policy"), desc: pick(locale, "了解我们如何保护你的信息", "How we protect your information"), onClick: goPrivacy },
  ];

  return (
    <View className={`profile ${THEME_CLASS}`}>
      <View className="profile-hero">
        <Text className="profile-hero-name">{copy.brand.name}</Text>
        <Text className="profile-hero-tagline">{copy.brand.tagline}</Text>
      </View>

      {/* Language toggle */}
      <View className="card profile-phone">
        <Text className="section-title profile-inline-title">{pick(locale, "语言", "Language")}</Text>
        <View className="profile-phone-row">
          <Text
            className={locale === "zh" ? "profile-phone-action text-sage" : "text-muted"}
            onClick={() => setLocale("zh")}
          >
            中文
          </Text>
          <Text className="text-muted"> | </Text>
          <Text
            className={locale === "en" ? "profile-phone-action text-sage" : "text-muted"}
            onClick={() => setLocale("en")}
          >
            EN
          </Text>
        </View>
      </View>

      <View className="card profile-phone">
        <Text className="section-title profile-inline-title">{pick(locale, "我的手机号", "My phone number")}</Text>
        {!editing ? (
          <View className="profile-phone-row">
            <Text className={phone ? "profile-phone-val" : "text-muted"}>
              {phone ? maskPhone(phone) : pick(locale, "未绑定（用于查询订单与自动填写收货信息）", "Not linked (used to look up orders and autofill shipping)")}
            </Text>
            <Text className="profile-phone-action text-sage" onClick={startEdit}>
              {phone ? pick(locale, "修改", "Edit") : pick(locale, "绑定", "Link")}
            </Text>
          </View>
        ) : (
          <View>
            <Input
              className="profile-phone-input"
              type="number"
              maxlength={11}
              placeholder={pick(locale, "请输入11位手机号", "Enter your 11-digit phone number")}
              value={draft}
              onInput={(e) => setDraft(e.detail.value)}
            />
            <View className="profile-phone-btns">
              <Button className="btn-secondary profile-phone-btn" onClick={() => setEditing(false)}>{pick(locale, "取消", "Cancel")}</Button>
              <Button className="btn-primary profile-phone-btn" onClick={savePhone}>{pick(locale, "保存", "Save")}</Button>
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
        <Text className="section-title profile-inline-title">{pick(locale, "关于", "About")}</Text>
        <Text className="profile-about-text">
          {pick(locale, `${copy.brand.name} 是一个中文香水人格测试与推荐平台。先测再闻，帮你找到真正适合自己的气味。`, `${copy.brand.name} is a fragrance persona quiz and recommendation platform. Test first, then smell, to find the scent that's truly yours.`)}
        </Text>
        <Text className="profile-about-contact">{pick(locale, "联系我们：", "Contact us: ")}{CONTACT_EMAIL}</Text>
      </View>

      <View className="profile-footer">
        <Text className="text-muted">{copy.brand.name} · {copy.brand.tagline}</Text>
      </View>
    </View>
  );
}
