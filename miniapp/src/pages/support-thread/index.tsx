import { useEffect, useState } from "react";
import { View, Text, Input } from "@tarojs/components";
import { useRouter } from "@tarojs/taro";
import { supportThread, supportReply } from "../../lib/account";
import { THEME_CLASS } from "../../lib/theme";
import "../account/index.scss";
export default function SupportThread() {
  const ticketNo = useRouter().params.ticketNo || "";
  const [d, setD] = useState<any>(null);
  const [reply, setReply] = useState("");
  function load() { supportThread(ticketNo).then(setD).catch(() => undefined); }
  useEffect(() => { load(); }, []);
  async function send() { if (!reply.trim()) return; await supportReply(ticketNo, reply); setReply(""); load(); }
  if (!d) return <View className={`acc ${THEME_CLASS}`}><Text className="acc-muted">加载中…</Text></View>;
  return (
    <View className={`acc ${THEME_CLASS}`}>
      <Text className="acc-h" style="font-size:32rpx">{d.ticket?.subject}</Text>
      <Text className="acc-muted">{d.ticket?.status}</Text>
      {(d.messages || []).map((m: any, i: number) => (
        <View key={i} className="acc-card" style={m.senderType === "user" ? "background:#6b7d5e" : ""}>
          <Text style={m.senderType === "user" ? "color:#fff" : ""}>{m.message}</Text>
        </View>
      ))}
      {d.ticket?.status !== "closed" && (
        <View className="acc-card">
          <Input className="acc-input" style="margin-top:0" placeholder="回复…" value={reply} onInput={(e) => setReply(e.detail.value)} />
          <View className="acc-btn" onClick={send}>发送</View>
        </View>
      )}
    </View>
  );
}
