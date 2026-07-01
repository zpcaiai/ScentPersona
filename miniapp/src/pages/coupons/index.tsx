import { useEffect, useState } from "react";
import { View, Text } from "@tarojs/components";
import { listCoupons } from "../../lib/account";
import { useLang, pick, useNavTitle } from "../../lib/i18n";
import { THEME_CLASS } from "../../lib/theme";
import "../account/index.scss";
export default function Coupons() {
  const { locale } = useLang();
  useNavTitle("我的券", "My coupons");
  const [recs, setRecs] = useState<any[]>([]);
  useEffect(() => { listCoupons().then((r) => setRecs(r.recommendations || [])).catch(() => undefined); }, []);
  return (
    <View className={`acc ${THEME_CLASS}`}>
      <Text className="acc-h">{pick(locale, "我的券 / 正装推荐", "My coupons / Full-bottle picks")}</Text>
      {recs.length === 0 && <Text className="acc-muted">{pick(locale, "暂无推荐。试香后喜欢的香会在这里出现正装抵扣券。", "No picks yet. Once you love a scent from your samples, a full-bottle credit will show up here.")}</Text>}
      {recs.map((r) => (
        <View key={r.id} className="acc-card">
          <Text>{r.reason}</Text>
          {r.coupon && <Text className="acc-muted" style="margin-top:6rpx;display:block">{pick(locale, "抵扣券", "Credit")} {r.coupon.code} · {r.coupon.type === "sample_credit" ? pick(locale, `可抵 ¥${(r.coupon.value / 100).toFixed(2)}`, `Worth ¥${(r.coupon.value / 100).toFixed(2)}`) : r.coupon.type}</Text>}
        </View>
      ))}
    </View>
  );
}
