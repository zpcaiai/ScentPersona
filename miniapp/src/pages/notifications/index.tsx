import { useEffect, useState } from "react";
import { View, Text } from "@tarojs/components";
import { listNotifications, readNotification } from "../../lib/account";
import { THEME_CLASS } from "../../lib/theme";
import "../account/index.scss";
export default function Notifications() {
  const [list, setList] = useState<any[]>([]);
  function load() { listNotifications().then((r) => setList(r.notifications || [])).catch(() => undefined); }
  useEffect(() => { load(); }, []);
  return (
    <View className={`acc ${THEME_CLASS}`}>
      <Text className="acc-h">通知</Text>
      {list.length === 0 && <Text className="acc-muted">还没有通知。</Text>}
      {list.map((n) => (
        <View key={n.id} className="acc-card" style={n.readAt ? "" : "border-color:#8a9a7b"} onClick={() => { if (!n.readAt) readNotification(n.id).then(load); }}>
          <View className="acc-row" style="padding:0"><Text style="font-weight:600;color:#556648">{n.title}</Text><Text className="acc-muted">{new Date(n.createdAt).toLocaleDateString("zh-CN")}</Text></View>
          <Text>{n.content}</Text>
        </View>
      ))}
    </View>
  );
}
