import { useEffect, useState } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { accountMe } from "../../lib/account";
import { getPersonaById } from "../../data/personas";
import { useLang, pick, useNavTitle } from "../../lib/i18n";
import { THEME_CLASS } from "../../lib/theme";
import "../account/index.scss";

const DIM: Record<string, [string, string]> = {
  clean: ["干净感", "Clean"], soft: ["温柔感", "Soft"], woody: ["木质感", "Woody"],
  bright: ["明亮感", "Bright"], presence: ["存在感", "Presence"], calm: ["安静感", "Calm"],
};

export default function ScentProfile() {
  const { locale } = useLang();
  useNavTitle("气味资产", "Scent Profile");
  const [sp, setSp] = useState<any>(undefined);
  useEffect(() => { accountMe().then((m) => setSp(m?.scentProfile ?? null)).catch(() => setSp(null)); }, []);
  if (sp === undefined) return <View className={`acc ${THEME_CLASS}`}><Text className="acc-muted">{pick(locale, "加载中…", "Loading…")}</Text></View>;
  if (!sp) return <View className={`acc ${THEME_CLASS}`}><Text className="acc-muted">{pick(locale, "还没有气味资产。", "No scent profile yet.")}</Text><View className="acc-btn" onClick={() => Taro.navigateTo({ url: "/pages/quiz/index" })}>{pick(locale, "去做选香测试", "Take the scent quiz")}</View></View>;
  const persona = getPersonaById(sp.currentPersonaId, locale);
  let scores: Record<string, number> = {};
  try { scores = JSON.parse(sp.scentScoresJson || "{}"); } catch { /* */ }
  return (
    <View className={`acc ${THEME_CLASS}`}>
      <Text className="acc-h">{pick(locale, "我的气味人格", "My scent persona")}</Text>
      {persona && <View className="acc-card"><Text style="font-size:32rpx;color:#967449;font-family:Georgia,serif">{persona.name}</Text><Text className="acc-muted" style="margin-top:6rpx">{persona.description}</Text></View>}
      <View className="acc-card">
        {Object.keys(DIM).map((k) => (
          <View key={k} className="acc-bar-row">
            <Text style="width:96rpx">{pick(locale, DIM[k][0], DIM[k][1])}</Text>
            <View className="acc-bar-wrap"><View className="acc-bar" style={`width:${Math.min(100, (scores[k] || 0) * 10)}%`} /></View>
            <Text>{scores[k] || 0}</Text>
          </View>
        ))}
      </View>
      <View className="acc-btn-ghost" onClick={() => Taro.navigateTo({ url: "/pages/quiz/index" })}>{pick(locale, "重新测试更新人格", "Retake the quiz to update")}</View>
    </View>
  );
}
