import { useEffect, useState } from "react";
import { View, Text, Image } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { getContent } from "../../lib/account";
import { assetUrl } from "../../lib/request";
import { useLang, pick, useNavTitle } from "../../lib/i18n";
import { THEME_CLASS } from "../../lib/theme";
import "../account/index.scss";
export default function Content() {
  const { locale } = useLang();
  useNavTitle("专题", "Feature");
  const slug = useRouter().params.slug || "";
  const [d, setD] = useState<any>(undefined);
  useEffect(() => { getContent(slug).then(setD).catch(() => setD(null)); }, [slug]);
  if (d === undefined) return <View className={`acc ${THEME_CLASS}`}><Text className="acc-muted">{pick(locale, "加载中…", "Loading…")}</Text></View>;
  if (!d || d.error) return <View className={`acc ${THEME_CLASS}`}><Text className="acc-muted">{pick(locale, "该页面暂未发布。", "This page hasn't been published yet.")}</Text></View>;
  return (
    <View className={`acc ${THEME_CLASS}`}>
      {d.heroImageUrl ? <Image src={assetUrl(d.heroImageUrl)} mode="widthFix" style="width:100%;border-radius:16rpx" /> : null}
      <Text className="acc-h">{d.title}</Text>
      {d.subtitle ? <Text className="acc-muted">{d.subtitle}</Text> : null}
      {(d.contentBlocks || []).map((b: any, i: number) => (
        <View key={i} className="acc-card">
          {b.title ? <Text style="font-weight:600;color:#967449;display:block">{b.title}</Text> : null}
          {b.text ? <Text style="display:block;margin-top:6rpx">{b.text}</Text> : null}
          {(b.items || []).map((it: string, n: number) => <Text key={n} className="acc-muted" style="display:block">· {it}</Text>)}
          {b.cta ? <View className="acc-btn" onClick={() => { if (b.cta.href === "/quiz") Taro.navigateTo({ url: "/pages/quiz/index" }); else if (b.cta.href === "/search") Taro.navigateTo({ url: "/pages/proxy-search/index" }); else Taro.navigateTo({ url: "/pages/products/index" }); }}>{b.cta.label}</View> : null}
        </View>
      ))}
      {(d.contentBlocks || []).length === 0 && <View className="acc-btn" onClick={() => Taro.navigateTo({ url: "/pages/quiz/index" })}>{pick(locale, "开始选香测试", "Start the scent quiz")}</View>}
    </View>
  );
}
