import { useEffect, useState } from "react";
import { View, Text, Input } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { listAddresses, createAddress, setDefaultAddress, deleteAddress } from "../../lib/account";
import { THEME_CLASS } from "../../lib/theme";
import "../account/index.scss";

export default function Addresses() {
  const [list, setList] = useState<any[]>([]);
  const [f, setF] = useState({ recipientName: "", phone: "", province: "", city: "", district: "", addressLine1: "" });
  function load() { listAddresses().then((r) => setList(r.addresses || [])).catch(() => undefined); }
  useEffect(() => { load(); }, []);
  const set = (k: string) => (e: any) => setF((p) => ({ ...p, [k]: e.detail.value }));
  async function add() {
    if (!f.recipientName || !f.phone || !f.province || !f.city || !f.district || !f.addressLine1) { Taro.showToast({ title: "请填完整", icon: "none" }); return; }
    await createAddress(f); setF({ recipientName: "", phone: "", province: "", city: "", district: "", addressLine1: "" }); load();
  }
  return (
    <View className={`acc ${THEME_CLASS}`}>
      <Text className="acc-h">收货地址</Text>
      {list.map((a) => (
        <View key={a.id} className="acc-card">
          <View className="acc-row" style="padding:0">
            <Text>{a.recipientName} · {a.phone}{a.isDefault ? " · 默认" : ""}</Text>
            <Text className="acc-muted" onClick={() => deleteAddress(a.id).then(load)}>删除</Text>
          </View>
          <Text className="acc-muted">{a.province}{a.city}{a.district} {a.addressLine1}</Text>
          {!a.isDefault && <Text className="acc-tag" onClick={() => setDefaultAddress(a.id).then(load)}>设为默认</Text>}
        </View>
      ))}
      {list.length === 0 && <Text className="acc-muted">还没有地址。</Text>}
      <View className="acc-card">
        <Text style="font-weight:600;color:#556648">新增地址</Text>
        <Input className="acc-input" placeholder="收件人" value={f.recipientName} onInput={set("recipientName")} />
        <Input className="acc-input" type="number" placeholder="手机号" value={f.phone} onInput={set("phone")} />
        <Input className="acc-input" placeholder="省" value={f.province} onInput={set("province")} />
        <Input className="acc-input" placeholder="市" value={f.city} onInput={set("city")} />
        <Input className="acc-input" placeholder="区/县" value={f.district} onInput={set("district")} />
        <Input className="acc-input" placeholder="详细地址" value={f.addressLine1} onInput={set("addressLine1")} />
        <View className="acc-btn" onClick={add}>保存地址</View>
      </View>
    </View>
  );
}
