import { useEffect, useState } from "react";
import { View, Text } from "@tarojs/components";
import { useRouter } from "@tarojs/taro";
import { getLegal } from "../../lib/account";
import { useLang, pick, useNavTitle } from "../../lib/i18n";
import { THEME_CLASS } from "../../lib/theme";
import "../account/index.scss";
export default function Legal() {
  const { locale } = useLang();
  useNavTitle("条款", "Terms");
  const slug = useRouter().params.slug || "";
  const [d, setD] = useState<any>(undefined);
  useEffect(() => { getLegal(slug).then(setD).catch(() => setD(null)); }, [slug]);
  if (d === undefined) return <View className={`acc ${THEME_CLASS}`}><Text className="acc-muted">{pick(locale, "加载中…", "Loading…")}</Text></View>;
  return (
    <View className={`acc ${THEME_CLASS}`}>
      <Text className="acc-h">{(d && d.title) || pick(locale, "条款", "Terms")}</Text>
      {d && d.content
        ? <Text style="display:block;white-space:pre-wrap;margin-top:12rpx;color:#3a3a3a;font-size:26rpx;line-height:1.7">{d.content}</Text>
        : <Text className="acc-muted">{pick(locale, "该文档尚未发布。", "This document hasn't been published yet.")}</Text>}
    </View>
  );
}
