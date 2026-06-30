import { useState, useEffect } from "react";
import { View, Text, Button, ScrollView, Image } from "@tarojs/components";
import Taro, { useShareAppMessage, useShareTimeline } from "@tarojs/taro";
import { getPersonaById } from "../../data/personas";
import { getProductById } from "../../data/products";
import { getScentTagLabels } from "../../data/scentTags";
import { getSiteCopy } from "../../data/copy";
import { generateResultSummary } from "../../lib/scoring";
import { getRoleLabel } from "../../lib/scoring/recommendProducts";
import { trackEvent, assetUrl } from "../../lib/request";
import type { PersonaId, TagScores, ProductRecommendation } from "../../lib/scoring/types";
import { useLang, pick } from "../../lib/i18n";
import { THEME_CLASS } from "../../lib/theme";
import "./index.scss";

interface QuizResultData {
  sessionId: string;
  personaId: PersonaId;
  confidence: number;
  reasons: string[];
  tagScores: TagScores;
  normalizedTagScores: TagScores;
  recommendations: ProductRecommendation[];
}

export default function Result() {
  const { locale } = useLang();
  const copy = getSiteCopy(locale);
  const tagLabels = getScentTagLabels(locale);
  const [result, setResult] = useState<QuizResultData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const data = Taro.getStorageSync("quizResult");
    if (data) {
      setResult(data);
      trackEvent({
        eventName: "result_view",
        path: "/pages/result/index",
        sessionId: data.sessionId,
        personaId: data.personaId,
      });
    } else {
      Taro.redirectTo({ url: "/pages/quiz/index" });
    }
  }, []);

  const sharedPersona = result ? getPersonaById(result.personaId, locale) : null;
  useShareAppMessage(() => ({
    title: sharedPersona
      ? pick(locale, `我的气味人格是「${sharedPersona.name}」，你的呢？`, `My scent persona is “${sharedPersona.name}” — what's yours?`)
      : pick(locale, "测测你的气味人格 | ScentPersona", "Find your scent persona | ScentPersona"),
    path: "/pages/index/index",
  }));
  useShareTimeline(() => ({
    title: sharedPersona
      ? pick(locale, `我的气味人格是「${sharedPersona.name}」`, `My scent persona is “${sharedPersona.name}”`)
      : pick(locale, "测测你的气味人格", "Find your scent persona"),
  }));

  if (!result) return null;

  const persona = getPersonaById(result.personaId, locale);
  if (!persona) return null;

  const summary = generateResultSummary({
    personaId: result.personaId,
    tagScores: result.tagScores,
    locale,
  });

  const goToCheckout = () => {
    const productIds = result.recommendations.map((r) => r.productId).join(",");
    Taro.navigateTo({
      url: `/pages/checkout/index?productIds=${productIds}&sessionId=${result.sessionId}`,
    });
  };

  const goToProducts = () => Taro.switchTab({ url: "/pages/products/index" });

  const goToFeedback = () => {
    Taro.navigateTo({
      url: `/pages/feedback/index?sessionId=${result.sessionId}&personaId=${result.personaId}`,
    });
  };

  const retake = () => {
    Taro.removeStorageSync("quizResult");
    Taro.redirectTo({ url: "/pages/quiz/index" });
  };

  const handleCopy = () => {
    const text = `${persona.shareLine}\n\n${copy.brand.name} · ${copy.brand.tagline}`;
    Taro.setClipboardData({ data: text });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    Taro.showShareMenu({ withShareTicket: true });
  };

  return (
    <View className={`result ${THEME_CLASS}`}>
      {/* Persona Hero */}
      <View className="result-hero">
        <Text className="result-hero-label">{pick(locale, "你的气味人格", "Your scent persona")}</Text>
        <Text className="result-hero-name">{persona.name}</Text>
        <Text className="result-hero-title">{persona.title}</Text>
        <View className="result-hero-confidence">
          <Text className="result-hero-confidence-text">
            {pick(locale, "匹配度", "Match")} {Math.round(result.confidence * 100)}%
          </Text>
        </View>
      </View>

      {/* Report */}
      <View className="card">
        <Text className="section-title">{pick(locale, "人格报告", "Persona report")}</Text>
        <Text className="result-report-text">{persona.reportSections.identity}</Text>
        <Text className="result-report-subtitle">{pick(locale, "香调方向", "Scent direction")}</Text>
        <Text className="result-report-text">{persona.reportSections.scentDirection}</Text>
        <Text className="result-report-subtitle">{pick(locale, "不太适合你的", "Less suited to you")}</Text>
        <Text className="result-report-text">{persona.reportSections.avoid}</Text>
        <Text className="result-report-subtitle">{pick(locale, "理想场景", "Ideal moments")}</Text>
        <Text className="result-report-text">{persona.reportSections.scenes}</Text>
        <Text className="result-report-closing">{persona.reportSections.closing}</Text>
      </View>

      {/* Tags */}
      <View className="card">
        <Text className="section-title">{pick(locale, "你的气味标签", "Your scent tags")}</Text>
        <View className="result-tags">
          {summary.topTags.map((tag) => (
            <View key={tag} className="tag tag-sage">
              <Text>{tagLabels[tag]}</Text>
            </View>
          ))}
        </View>
        {summary.avoidTags.length > 0 && (
          <>
            <Text className="result-avoid-label">{pick(locale, "尽量避开", "Best to avoid")}</Text>
            <View className="result-tags">
              {summary.avoidTags.map((tag) => (
                <View key={tag} className="tag tag-clay">
                  <Text>{tagLabels[tag]}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>

      {/* Match reasons */}
      <View className="card">
        <Text className="section-title">{pick(locale, "为什么是这个人格", "Why this persona")}</Text>
        {result.reasons.map((reason, i) => (
          <View key={i} className="result-reason">
            <Text className="text-sage">· </Text>
            <Text>{reason}</Text>
          </View>
        ))}
      </View>

      {/* Recommendations */}
      <View className="card">
        <Text className="section-title">{pick(locale, "为你推荐的小样", "Samples picked for you")}</Text>
        {result.recommendations.map((rec, i) => {
          const product = getProductById(rec.productId, locale);
          if (!product) return null;
          return (
            <View
              key={i}
              className="result-rec"
              onClick={() => Taro.navigateTo({ url: `/pages/product-detail/index?slug=${product.slug}` })}
            >
              <Image className="result-rec-img" src={assetUrl(product.image)} mode="aspectFill" />
              <View className="result-rec-info">
                <Text className="result-rec-role">{getRoleLabel(rec.role, locale)}</Text>
                <Text className="result-rec-name">{product.name}</Text>
                <Text className="result-rec-reason">{rec.reason}</Text>
              </View>
              <Text className="result-rec-price">¥{product.price.sample ? (product.price.sample / 100).toFixed(1) : "-"}</Text>
            </View>
          );
        })}
      </View>

      {/* Sample CTA */}
      <View className="card result-cta">
        <Text className="result-cta-title">{copy.result.sampleCtaTitle}</Text>
        <Text className="result-cta-copy">{copy.result.sampleCtaCopy}</Text>
        <Button className="btn-primary" onClick={goToCheckout}>
          {copy.result.sampleCtaButton}
        </Button>
      </View>

      {/* Actions */}
      <View className="result-actions">
        <Button className="btn-secondary" onClick={handleCopy}>
          {copied ? copy.result.copiedText : copy.result.copyButton}
        </Button>
        <Button className="btn-secondary" onClick={retake}>
          {copy.result.retakeCta}
        </Button>
      </View>

      <View className="result-actions">
        <Button className="btn-secondary" onClick={goToProducts}>
          {pick(locale, "查看全部产品", "Browse all products")}
        </Button>
        <Button className="btn-secondary" onClick={goToFeedback}>
          {pick(locale, "填写试香反馈", "Share scent feedback")}
        </Button>
      </View>

      <Button className="btn-primary result-share" openType="share" onClick={handleShare}>
        {pick(locale, "分享给朋友", "Share with friends")}
      </Button>
    </View>
  );
}
