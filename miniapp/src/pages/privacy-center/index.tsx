import { useEffect, useState } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { getPrivacy, revokeMarketing, requestDelete } from "../../lib/account";
import { useLang, pick, useNavTitle } from "../../lib/i18n";
import { THEME_CLASS } from "../../lib/theme";
import "../account/index.scss";
export default function PrivacyCenter() {
  const { locale } = useLang();
  useNavTitle("隐私与数据", "Privacy & data");
  const [d, setD] = useState<any>(null);
  function load() { getPrivacy().then(setD).catch(() => undefined); }
  useEffect(() => { load(); }, []);
  return (
    <View className={`acc ${THEME_CLASS}`}>
      <Text className="acc-h">{pick(locale, "隐私与数据", "Privacy & data")}</Text>
      <View className="acc-card">
        <View className="acc-row" style="padding:0">
          <Text style="font-weight:600;color:#556648">{pick(locale, "营销通知", "Marketing notifications")}</Text>
          {d && d.marketingEnabled
            ? <Text className="acc-muted" onClick={() => revokeMarketing().then(() => { Taro.showToast({ title: pick(locale, "已关闭", "Turned off"), icon: "none" }); load(); })}>{pick(locale, "关闭", "Turn off")}</Text>
            : <Text className="acc-muted">{pick(locale, "已关闭", "Off")}</Text>}
        </View>
        <Text className="acc-muted">{pick(locale, "订单必要通知不受影响。", "Essential order notifications aren't affected.")}</Text>
      </View>
      <View className="acc-card">
        <Text style="font-weight:600;color:#556648">{pick(locale, "我的数据", "My data")}</Text>
        <View className="acc-btn-ghost" onClick={() => requestDelete().then(() => Taro.showToast({ title: pick(locale, "已提交删除申请", "Deletion request submitted"), icon: "none" }))}>{pick(locale, "申请删除账户", "Request account deletion")}</View>
        <Text className="acc-muted" style="display:block;margin-top:8rpx">{pick(locale, "订单交易记录将依法保留。", "Order and transaction records are retained as required by law.")}</Text>
      </View>
    </View>
  );
}
