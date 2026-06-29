import { useState, useEffect } from "react";
import { View, Text, Button, Image } from "@tarojs/components";
import Taro, { useRouter, useShareAppMessage } from "@tarojs/taro";
import { getProductBySlug } from "../../data/products";
import { getPersonaById } from "../../data/personas";
import { SCENT_TAG_LABELS } from "../../data/scentTags";
import { formatPrice } from "../../lib/utils";
import { assetUrl } from "../../lib/request";
import type { ScentTag } from "../../lib/scoring/types";
import "./index.scss";

export default function ProductDetail() {
  const router = useRouter();
  const [product, setProduct] = useState(getProductBySlug(router.params.slug || ""));

  useEffect(() => {
    const p = getProductBySlug(router.params.slug || "");
    setProduct(p);
  }, [router.params.slug]);

  useShareAppMessage(() => ({
    title: product ? `${product.name} · ${product.emotionalScene.slice(0, 18)}` : "ScentPersona 香氛",
    path: product ? `/pages/product-detail/index?slug=${product.slug}` : "/pages/index/index",
    imageUrl: product ? assetUrl(product.image) : undefined,
  }));

  if (!product) {
    return (
      <View className="detail-empty">
        <Text>产品不存在</Text>
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
    <View className="detail">
      <Image className="detail-hero-img" src={assetUrl(product.image)} mode="aspectFill" />
      <View className="detail-hero">
        <Text className="detail-name">{product.name}</Text>
        <Text className="detail-scene">{product.emotionalScene}</Text>
      </View>

      <View className="card">
        <Text className="section-title">香调描述</Text>
        <Text className="detail-desc">{product.plainDescription}</Text>
        <Text className="detail-pro">{product.professionalDescription}</Text>
      </View>

      <View className="card">
        <Text className="section-title">香调结构</Text>
        <Text className="detail-notes-label">前调</Text>
        <Text className="detail-notes">{product.notes.top.join(" · ")}</Text>
        <Text className="detail-notes-label">中调</Text>
        <Text className="detail-notes">{product.notes.middle.join(" · ")}</Text>
        <Text className="detail-notes-label">后调</Text>
        <Text className="detail-notes">{product.notes.base.join(" · ")}</Text>
      </View>

      <View className="card">
        <Text className="section-title">气味标签</Text>
        <View className="detail-tags">
          {topTags.map(([tag]) => (
            <View key={tag} className="tag tag-sage">
              <Text>{SCENT_TAG_LABELS[tag]}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className="card">
        <Text className="section-title">适合场景</Text>
        {product.suitableFor.map((s, i) => (
          <View key={i} className="detail-suitable">
            <Text className="text-sage">✓ </Text>
            <Text>{s}</Text>
          </View>
        ))}
        {product.notSuitableFor.length > 0 && (
          <>
            <Text className="detail-not-suitable-label">不太适合</Text>
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
        <Text className="section-title">适合的人格</Text>
        <View className="detail-tags">
          {product.personaFit.map((pid) => {
            const persona = getPersonaById(pid);
            return persona ? (
              <View key={pid} className="tag tag-clay">
                <Text>{persona.name}</Text>
              </View>
            ) : null;
          })}
        </View>
      </View>

      {/* Price + CTA */}
      <View className="detail-bottom">
        <View className="detail-price-info">
          {product.price.sample && (
            <Text className="detail-price">小样 ¥{formatPrice(product.price.sample)}</Text>
          )}
          {product.price.fullSize && (
            <Text className="detail-price-full">正装 ¥{formatPrice(product.price.fullSize)}</Text>
          )}
        </View>
        <Button className="btn-primary" onClick={goToCheckout}>
          {product.ctaText}
        </Button>
      </View>
    </View>
  );
}
