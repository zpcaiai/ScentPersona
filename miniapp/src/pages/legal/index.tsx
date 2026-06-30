import { useEffect, useState } from "react";
import { View, Text } from "@tarojs/components";
import { useRouter } from "@tarojs/taro";
import { getLegal } from "../../lib/account";
import { THEME_CLASS } from "../../lib/theme";
import "../account/index.scss";
export default function Legal() {
  const slug = useRouter().params.slug || "";
  const [d, setD] = useState<any>(undefined);
  useEffect(() => { getLegal(slug).then(setD).catch(() => setD(null)); }, [slug]);
  if (d === undefined) return <View className={`acc ${THEME_CLASS}`}><Text className="acc-muted">加载中…</Text></View>;
  return (
    <View className={`acc ${THEME_CLASS}`}>
      <Text className="acc-h">{(d && d.title) || "条款"}</Text>
      {d && d.content
        ? <Text style="display:block;white-space:pre-wrap;margin-top:12rpx;color:#3a3a3a;font-size:26rpx;line-height:1.7">{d.content}</Text>
        : <Text className="acc-muted">该文档尚未发布。</Text>}
    </View>
  );
}
