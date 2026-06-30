import { useState, useEffect } from "react";
import { View, Text, Input, Button, Image } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { proxySearch, proxyQuote, type ProxyOffer } from "../../lib/proxy";
import { assetUrl } from "../../lib/request";
import { useLang, pick } from "../../lib/i18n";
import { THEME_CLASS } from "../../lib/theme";
import "./index.scss";

export default function ProxySearch() {
  const { locale } = useLang();
  const router = useRouter();
  const initial = router.params.q ? decodeURIComponent(router.params.q) : "";
  const [q, setQ] = useState(initial);
  const [offers, setOffers] = useState<ProxyOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function run(keyword: string) {
    if (!keyword) return;
    setLoading(true);
    try {
      const r = await proxySearch(keyword);
      setOffers(r.offers || []);
    } catch {
      Taro.showToast({ title: pick(locale, "搜索失败", "Search failed"), icon: "none" });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (initial) run(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function daigou(o: ProxyOffer) {
    setBusyId(o.id);
    try {
      const sessionId = Taro.getStorageSync("sp_session_id") || undefined;
      const quote = await proxyQuote(o.id, 1, sessionId);
      if (quote.blocked) {
        Taro.showToast({ title: pick(locale, "该商品价格异常，需人工确认", "This price looks off and needs manual review"), icon: "none" });
        return;
      }
      Taro.setStorageSync(`proxyToken:${quote.orderNo}`, quote.accessToken);
      Taro.navigateTo({ url: `/pages/proxy-confirm/index?orderId=${quote.orderId}&token=${quote.accessToken}` });
    } catch {
      Taro.showToast({ title: pick(locale, "暂不可代下单", "Proxy order unavailable right now"), icon: "none" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <View className={`proxy ${THEME_CLASS}`}>
      <View className="proxy-bar">
        <Input
          className="proxy-input"
          value={q}
          placeholder={pick(locale, "搜索香水，如 祖玛珑 蓝风铃", "Search fragrances, e.g. Jo Malone Bluebell")}
          confirmType="search"
          onInput={(e) => setQ(e.detail.value)}
          onConfirm={() => run(q)}
        />
        <Button className="btn-primary proxy-go" onClick={() => run(q)}>{pick(locale, "搜索", "Search")}</Button>
      </View>
      <Text className="proxy-note">
        {pick(locale, "价格、库存可能变化，请以平台页面为准。代下单为本站履约服务，非第三方平台官方订单。", "Prices and stock can change — the platform page is authoritative. A proxy order is our own fulfillment service, not an official third-party order.")}
      </Text>
      {loading && <Text className="proxy-note">{pick(locale, "搜索中…", "Searching…")}</Text>}
      {offers.map((o) => (
        <View key={o.id} className="card proxy-offer">
          <View className="proxy-offer-top">
            {o.imageUrl ? <Image className="proxy-offer-img" src={assetUrl(o.imageUrl)} mode="aspectFill" /> : null}
            <View className="proxy-offer-main">
              <Text className="proxy-offer-plat">{o.platform} · {o.shopName || pick(locale, "未知店铺", "Unknown shop")}</Text>
              <Text className="proxy-offer-title">{o.title}</Text>
              <Text className="proxy-offer-meta">{pick(locale, "评分", "Rating")} {o.rating ?? pick(locale, "暂无", "N/A")} · {pick(locale, "销量", "Sold")} {o.salesCount ?? pick(locale, "暂无", "N/A")}</Text>
            </View>
          </View>
          <View className="proxy-offer-bottom">
            <Text className="proxy-price">{o.priceCents ? `¥${(o.priceCents / 100).toFixed(2)}` : pick(locale, "暂无价格", "No price")}</Text>
            <Button className="btn-secondary proxy-daigou" loading={busyId === o.id} onClick={() => daigou(o)}>{pick(locale, "帮我代下单", "Order for me")}</Button>
          </View>
        </View>
      ))}
      {!loading && q && offers.length === 0 && <Text className="proxy-empty">{pick(locale, "没有找到商品，换个关键词试试。", "No products found — try another keyword.")}</Text>}
    </View>
  );
}
