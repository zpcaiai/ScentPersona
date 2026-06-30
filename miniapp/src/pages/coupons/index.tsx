import { useEffect, useState } from "react";
import { View, Text } from "@tarojs/components";
import { listCoupons } from "../../lib/account";
import { THEME_CLASS } from "../../lib/theme";
import "../account/index.scss";
export default function Coupons() {
  const [recs, setRecs] = useState<any[]>([]);
  useEffect(() => { listCoupons().then((r) => setRecs(r.recommendations || [])).catch(() => undefined); }, []);
  return (
    <View className={`acc ${THEME_CLASS}`}>
      <Text className="acc-h">我的券 / 正装推荐</Text>
      {recs.length === 0 && <Text className="acc-muted">暂无推荐。试香后喜欢的香会在这里出现正装抵扣券。</Text>}
      {recs.map((r) => (
        <View key={r.id} className="acc-card">
          <Text>{r.reason}</Text>
          {r.coupon && <Text className="acc-muted" style="margin-top:6rpx;display:block">抵扣券 {r.coupon.code} · {r.coupon.type === "sample_credit" ? `可抵 ¥${(r.coupon.value / 100).toFixed(2)}` : r.coupon.type}</Text>}
        </View>
      ))}
    </View>
  );
}
