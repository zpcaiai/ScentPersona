import { useState, useEffect } from "react";
import { View, Text, Button, Image } from "@tarojs/components";
import Taro, { useRouter, useShareAppMessage } from "@tarojs/taro";
import { getProductBySlug } from "../../data/products";
import { getPersonaById } from "../../data/personas";
import { getScentTagLabels } from "../../data/scentTags";
import { formatPrice } from "../../lib/utils";
import { assetUrl } from "../../lib/request";
import type { ScentTag } from "../../lib/scoring/types";
import { useLang, pick } from "../../lib/i18n";
import { THEME_CLASS } from "../../lib/theme";
import "./index.scss";

export default function ProductDetail() {
  const router = useRouter();
  const { locale } = useLang();
  const tagLabels = getScentTagLabels(locale);
  const [product, setProduct] = useState(getProductBySlug(router.params.slug || "", locale));

  useEffect(() => {
    const p = getProductBySlug(router.params.slug || "", locale);
    setProduct(p);
  }, [router.params.slug, locale]);

  useShareAppMessage(() => ({
    title: product
      ? `${product.name} · ${product.emotionalScene.slice(0, 18)}`
      : pick(locale, "ScentPersona 香氛", "ScentPersona fragrance"),
    path: product ? `/pages/product-detail/index?slug=${product.slug}` : "/pages/index/index",
    imageUrl: product ? assetUrl(product.image) : undefined,
  }));

  if (!product) {
    return (
      <View className={`detail-empty ${THEME_CLASS}`}>
        <Text>{pick(locale, "产品不存在", "Product not found")}</Text>
      </View>
    );
  }

  const goToCheckout = () => {
    Taro.navigateTo({
      url: `/pages/checkout/index?productType=single&productIds=${product.id}&price=${product.price.sample || 0}`,
    });
  };

  const topTags = (Object.entries(product.scentTags) as [ScentTag, number][])
    .filter(([_, v]) => v > 5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <View className={`detail ${THEME_CLASS}`}>
      <Image className="detail-hero-img" src={assetUrl(product.image)} mode="aspectFill" />
      <View className="detail-hero">
        <Text className="detail-name">{product.name}</Text>
        <Text className="detail-scene">{product.emotionalScene}</Text>
      </View>

      <View className="card">
        <Text className="section-title">{pick(locale, "香调描述", "Scent description")}</Text>
        <Text className="detail-desc">{product.plainDescription}</Text>
        <Text className="detail-pro">{product.professionalDescription}</Text>
      </View>

      <View className="card">
        <Text className="section-title">{pick(locale, "香调结构", "Scent structure")}</Text>
        <Text className="detail-notes-label">{pick(locale, "前调", "Top notes")}</Text>
        <Text className="detail-notes">{product.notes.top.join(" · ")}</Text>
        <Text className="detail-notes-label">{pick(locale, "中调", "Heart notes")}</Text>
        <Text className="detail-notes">{product.notes.middle.join(" · ")}</Text>
        <Text className="detail-notes-label">{pick(locale, "后调", "Base notes")}</Text>
        <Text className="detail-notes">{product.notes.base.join(" · ")}</Text>
      </View>

      <View className="card">
        <Text className="section-title">{pick(locale, "气味标签", "Scent tags")}</Text>
        <View className="detail-tags">
          {topTags.map(([tag]) => (
            <View key={tag} className="tag tag-sage">
              <Text>{tagLabels[tag]}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className="card">
        <Text className="section-title">{pick(locale, "适合场景", "Where it fits")}</Text>
        {product.suitableFor.map((s, i) => (
          <View key={i} className="detail-suitable">
            <Text className="text-sage">✓ </Text>
            <Text>{s}</Text>
          </View>
        ))}
        {product.notSuitableFor.length > 0 && (
          <>
            <Text className="detail-not-suitable-label">{pick(locale, "不太适合", "Less suited")}</Text>
            {product.notSuitableFor.map((s, i) => (
              <View key={i} className="detail-suitable">
                <Text className="text-clay">✕ </Text>
                <Text>{s}</Text>
              </View>
            ))}
          </>
        )}
      </View>

      <View className="card">
        <Text className="section-title">{pick(locale, "适合的人格", "Personas it suits")}</Text>
        <View className="detail-tags">
          {product.personaFit.map((pid) => {
            const persona = getPersonaById(pid, locale);
            return persona ? (
              <View key={pid} className="tag tag-clay">
                <Text>{persona.name}</Text>
              </View>
            ) : null;
          })}
        </View>
      </View>

      <View className="card">
        <Text className="section-title">{pick(locale, "想从电商平台买这一支？", "Want to buy this one online?")}</Text>
        <Text className="detail-desc">{pick(locale, "查看淘宝 / 天猫 / 京东 / 拼多多多平台比价，或让我们帮你代下单。", "Compare prices across Taobao / Tmall / JD / Pinduoduo, or let us place a proxy order for you.")}</Text>
        <Button
          className="btn-secondary"
          onClick={() =>
            Taro.navigateTo({ url: `/pages/proxy-search/index?q=${encodeURIComponent(product.name)}` })
          }
        >
          {pick(locale, "多平台比价 · 帮我代下单", "Compare prices · place a proxy order")}
        </Button>
      </View>

      {/* Price + CTA */}
      <View className="detail-bottom">
        <View className="detail-price-info">
          {product.price.sample && (
            <Text className="detail-price">{pick(locale, "小样", "Sample")} ¥{formatPrice(product.price.sample)}</Text>
          )}
          {product.price.fullSize && (
            <Text className="detail-price-full">{pick(locale, "正装", "Full bottle")} ¥{formatPrice(product.price.fullSize)}</Text>
          )}
        </View>
        <Button className="btn-primary" onClick={goToCheckout}>
          {product.ctaText}
        </Button>
      </View>
    </View>
  );
}
