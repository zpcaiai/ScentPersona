import { useEffect, useState } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { getPrivacy, revokeMarketing, requestDelete } from "../../lib/account";
import { THEME_CLASS } from "../../lib/theme";
import "../account/index.scss";
export default function PrivacyCenter() {
  const [d, setD] = useState<any>(null);
  function load() { getPrivacy().then(setD).catch(() => undefined); }
  useEffect(() => { load(); }, []);
  return (
    <View className={`acc ${THEME_CLASS}`}>
      <Text className="acc-h">隐私与数据</Text>
      <View className="acc-card">
        <View className="acc-row" style="padding:0">
          <Text style="font-weight:600;color:#556648">营销通知</Text>
          {d && d.marketingEnabled
            ? <Text className="acc-muted" onClick={() => revokeMarketing().then(() => { Taro.showToast({ title: "已关闭", icon: "none" }); load(); })}>关闭</Text>
            : <Text className="acc-muted">已关闭</Text>}
        </View>
        <Text className="acc-muted">订单必要通知不受影响。</Text>
      </View>
      <View className="acc-card">
        <Text style="font-weight:600;color:#556648">我的数据</Text>
        <View className="acc-btn-ghost" onClick={() => requestDelete().then(() => Taro.showToast({ title: "已提交删除申请", icon: "none" }))}>申请删除账户</View>
        <Text className="acc-muted" style="display:block;margin-top:8rpx">订单交易记录将依法保留。</Text>
      </View>
    </View>
  );
}
