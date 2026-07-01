import { useEffect, useState } from "react";
import { View, Text, Input } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { listAddresses, createAddress, setDefaultAddress, deleteAddress } from "../../lib/account";
import { useLang, pick, useNavTitle } from "../../lib/i18n";
import { THEME_CLASS } from "../../lib/theme";
import "../account/index.scss";

export default function Addresses() {
  const { locale } = useLang();
  useNavTitle("收货地址", "Shipping addresses");
  const [list, setList] = useState<any[]>([]);
  const [f, setF] = useState({ recipientName: "", phone: "", province: "", city: "", district: "", addressLine1: "" });
  function load() { listAddresses().then((r) => setList(r.addresses || [])).catch(() => undefined); }
  useEffect(() => { load(); }, []);
  const set = (k: string) => (e: any) => setF((p) => ({ ...p, [k]: e.detail.value }));
  async function add() {
    if (!f.recipientName || !f.phone || !f.province || !f.city || !f.district || !f.addressLine1) { Taro.showToast({ title: pick(locale, "请填完整", "Please fill in all fields"), icon: "none" }); return; }
    await createAddress(f); setF({ recipientName: "", phone: "", province: "", city: "", district: "", addressLine1: "" }); load();
  }
  return (
    <View className={`acc ${THEME_CLASS}`}>
      <Text className="acc-h">{pick(locale, "收货地址", "Shipping addresses")}</Text>
      {list.map((a) => (
        <View key={a.id} className="acc-card">
          <View className="acc-row" style="padding:0">
            <Text>{a.recipientName} · {a.phone}{a.isDefault ? pick(locale, " · 默认", " · Default") : ""}</Text>
            <Text className="acc-muted" onClick={() => deleteAddress(a.id).then(load)}>{pick(locale, "删除", "Delete")}</Text>
          </View>
          <Text className="acc-muted">{a.province}{a.city}{a.district} {a.addressLine1}</Text>
          {!a.isDefault && <Text className="acc-tag" onClick={() => setDefaultAddress(a.id).then(load)}>{pick(locale, "设为默认", "Set as default")}</Text>}
        </View>
      ))}
      {list.length === 0 && <Text className="acc-muted">{pick(locale, "还没有地址。", "No addresses yet.")}</Text>}
      <View className="acc-card">
        <Text style="font-weight:600;color:#556648">{pick(locale, "新增地址", "Add address")}</Text>
        <Input className="acc-input" placeholder={pick(locale, "收件人", "Recipient")} value={f.recipientName} onInput={set("recipientName")} />
        <Input className="acc-input" type="number" placeholder={pick(locale, "手机号", "Phone number")} value={f.phone} onInput={set("phone")} />
        <Input className="acc-input" placeholder={pick(locale, "省", "Province")} value={f.province} onInput={set("province")} />
        <Input className="acc-input" placeholder={pick(locale, "市", "City")} value={f.city} onInput={set("city")} />
        <Input className="acc-input" placeholder={pick(locale, "区/县", "District")} value={f.district} onInput={set("district")} />
        <Input className="acc-input" placeholder={pick(locale, "详细地址", "Street address")} value={f.addressLine1} onInput={set("addressLine1")} />
        <View className="acc-btn" onClick={add}>{pick(locale, "保存地址", "Save address")}</View>
      </View>
    </View>
  );
}
