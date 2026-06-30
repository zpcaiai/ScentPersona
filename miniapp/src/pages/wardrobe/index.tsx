import { useEffect, useState } from "react";
import { View, Text, Input, Picker } from "@tarojs/components";
import { getWardrobe, addWardrobe, removeWardrobe } from "../../lib/account";
import { THEME_CLASS } from "../../lib/theme";
import "../account/index.scss";

export default function Wardrobe() {
  const [d, setD] = useState<any>(null);
  const [productId, setProductId] = useState("");
  const [roleIdx, setRoleIdx] = useState(0);
  function load() { getWardrobe().then(setD).catch(() => undefined); }
  useEffect(() => { load(); }, []);
  if (!d) return <View className={`acc ${THEME_CLASS}`}><Text className="acc-muted">加载中…</Text></View>;
  const roles: string[] = d.allRoles || [];
  const labels = d.roleLabels || {};
  async function add() { if (!productId) return; await addWardrobe(productId, roles[roleIdx]); setProductId(""); load(); }
  return (
    <View className={`acc ${THEME_CLASS}`}>
      <Text className="acc-h">我的香味衣橱</Text>
      {(d.suggestions || []).length > 0 && (
        <View className="acc-card">{(d.suggestions || []).map((s: any, i: number) => <Text key={i} className="acc-muted" style="display:block">· {s.reason}</Text>)}</View>
      )}
      {(d.items || []).map((i: any) => (
        <View key={i.id} className="acc-card">
          <View className="acc-row" style="padding:0">
            <Text><Text className="acc-tag">{labels[i.role] || i.role}</Text> {i.productId}</Text>
            <Text className="acc-muted" onClick={() => removeWardrobe(i.id).then(load)}>移除</Text>
          </View>
        </View>
      ))}
      {(d.items || []).length === 0 && <Text className="acc-muted">衣橱还空着，从一支日常香开始吧。</Text>}
      <View className="acc-card">
        <Input className="acc-input" placeholder="商品ID" value={productId} onInput={(e) => setProductId(e.detail.value)} />
        <Picker mode="selector" range={roles.map((r) => labels[r] || r)} value={roleIdx} onChange={(e) => setRoleIdx(Number(e.detail.value))}>
          <View className="acc-input">场景：{labels[roles[roleIdx]] || roles[roleIdx] || "选择"}</View>
        </Picker>
        <View className="acc-btn" onClick={add}>加入衣橱</View>
      </View>
    </View>
  );
}
