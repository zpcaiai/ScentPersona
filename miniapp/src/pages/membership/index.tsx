import { useEffect, useState } from "react";
import { View, Text } from "@tarojs/components";
import { getMembership } from "../../lib/account";
import { useLang, pick, useNavTitle } from "../../lib/i18n";
import { THEME_CLASS } from "../../lib/theme";
import "../account/index.scss";
export default function Membership() {
  const { locale } = useLang();
  useNavTitle("会员", "Membership");
  const [d, setD] = useState<any>(null);
  useEffect(() => { getMembership().then(setD).catch(() => undefined); }, []);
  if (!d) return <View className={`acc ${THEME_CLASS}`}><Text className="acc-muted">{pick(locale, "加载中…", "Loading…")}</Text></View>;
  const pct = d.nextTier ? Math.min(100, (d.totalSpendCents / d.nextTier.minSpendCents) * 100) : 100;
  return (
    <View className={`acc ${THEME_CLASS}`}>
      <Text className="acc-h">{pick(locale, "会员", "Membership")}</Text>
      <View className="acc-card">
        <Text style="font-size:32rpx;color:#967449;font-family:Georgia,serif">{d.currentTier ? d.currentTier.name : pick(locale, "普通会员", "Standard member")}</Text>
        <Text className="acc-muted" style="display:block">{pick(locale, "累计消费", "Total spend")} ¥{(d.totalSpendCents / 100).toFixed(2)} · {pick(locale, "积分", "Points")} {d.points}</Text>
        {d.nextTier && (
          <View>
            <View className="acc-bar-wrap" style="margin-top:16rpx"><View className="acc-bar" style={`width:${pct}%`} /></View>
            <Text className="acc-muted" style="display:block;margin-top:6rpx">{pick(locale, `再消费 ¥${((d.nextTier.minSpendCents - d.totalSpendCents) / 100).toFixed(2)} 升级到 ${d.nextTier.name}`, `Spend ¥${((d.nextTier.minSpendCents - d.totalSpendCents) / 100).toFixed(2)} more to reach ${d.nextTier.name}`)}</Text>
          </View>
        )}
      </View>
      <Text className="acc-muted" style="display:block;margin-top:12rpx">{pick(locale, "会员权益：小样抵扣、生日礼券、免服务费券、优先客服、礼盒折扣。", "Member perks: sample credit, birthday coupon, fee-waiver coupon, priority support, and gift-box discounts.")}</Text>
    </View>
  );
}
