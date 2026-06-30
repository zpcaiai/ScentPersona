import { useEffect, useState } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { accountMe } from "../../lib/account";
import { getPersonaById } from "../../data/personas";
import { THEME_CLASS } from "../../lib/theme";
import "../account/index.scss";

const DIM: Record<string, string> = { clean: "干净感", soft: "温柔感", woody: "木质感", bright: "明亮感", presence: "存在感", calm: "安静感" };

export default function ScentProfile() {
  const [sp, setSp] = useState<any>(undefined);
  useEffect(() => { accountMe().then((m) => setSp(m?.scentProfile ?? null)).catch(() => setSp(null)); }, []);
  if (sp === undefined) return <View className={`acc ${THEME_CLASS}`}><Text className="acc-muted">加载中…</Text></View>;
  if (!sp) return <View className={`acc ${THEME_CLASS}`}><Text className="acc-muted">还没有气味资产。</Text><View className="acc-btn" onClick={() => Taro.navigateTo({ url: "/pages/quiz/index" })}>去做选香测试</View></View>;
  const persona = getPersonaById(sp.currentPersonaId);
  let scores: Record<string, number> = {};
  try { scores = JSON.parse(sp.scentScoresJson || "{}"); } catch { /* */ }
  return (
    <View className={`acc ${THEME_CLASS}`}>
      <Text className="acc-h">我的气味人格</Text>
      {persona && <View className="acc-card"><Text style="font-size:32rpx;color:#967449;font-family:Georgia,serif">{persona.name}</Text><Text className="acc-muted" style="margin-top:6rpx">{persona.description}</Text></View>}
      <View className="acc-card">
        {Object.keys(DIM).map((k) => (
          <View key={k} className="acc-bar-row">
            <Text style="width:96rpx">{DIM[k]}</Text>
            <View className="acc-bar-wrap"><View className="acc-bar" style={`width:${Math.min(100, (scores[k] || 0) * 10)}%`} /></View>
            <Text>{scores[k] || 0}</Text>
          </View>
        ))}
      </View>
      <View className="acc-btn-ghost" onClick={() => Taro.navigateTo({ url: "/pages/quiz/index" })}>重新测试更新人格</View>
    </View>
  );
}
