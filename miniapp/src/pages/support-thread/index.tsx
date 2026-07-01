import { useEffect, useState } from "react";
import { View, Text, Input } from "@tarojs/components";
import { useRouter } from "@tarojs/taro";
import { supportThread, supportReply } from "../../lib/account";
import { useLang, pick, useNavTitle } from "../../lib/i18n";
import { THEME_CLASS } from "../../lib/theme";
import "../account/index.scss";
export default function SupportThread() {
  const { locale } = useLang();
  useNavTitle("工单", "Ticket");
  const ticketNo = useRouter().params.ticketNo || "";
  const [d, setD] = useState<any>(null);
  const [reply, setReply] = useState("");
  function load() { supportThread(ticketNo).then(setD).catch(() => undefined); }
  useEffect(() => { load(); }, []);
  async function send() { if (!reply.trim()) return; await supportReply(ticketNo, reply); setReply(""); load(); }
  if (!d) return <View className={`acc ${THEME_CLASS}`}><Text className="acc-muted">{pick(locale, "加载中…", "Loading…")}</Text></View>;
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
          <Input className="acc-input" style="margin-top:0" placeholder={pick(locale, "回复…", "Reply…")} value={reply} onInput={(e) => setReply(e.detail.value)} />
          <View className="acc-btn" onClick={send}>{pick(locale, "发送", "Send")}</View>
        </View>
      )}
    </View>
  );
}
