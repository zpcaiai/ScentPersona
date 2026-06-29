import { useState, useEffect } from "react";
import { View, Text, Button, ScrollView, Image } from "@tarojs/components";
import Taro, { useShareAppMessage, useShareTimeline } from "@tarojs/taro";
import { getPersonaById } from "../../data/personas";
import { getProductById } from "../../data/products";
import { SCENT_TAG_LABELS } from "../../data/scentTags";
import { SITE_COPY } from "../../data/copy";
import { generateResultSummary } from "../../lib/scoring";
import { trackEvent, assetUrl } from "../../lib/request";
import type { PersonaId, TagScores, ProductRecommendation } from "../../lib/scoring/types";
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

  const sharedPersona = result ? getPersonaById(result.personaId) : null;
  useShareAppMessage(() => ({
    title: sharedPersona ? `我的气味人格是「${sharedPersona.name}」，你的呢？` : "测测你的气味人格 | ScentPersona",
    path: "/pages/index/index",
  }));
  useShareTimeline(() => ({
    title: sharedPersona ? `我的气味人格是「${sharedPersona.name}」` : "测测你的气味人格",
  }));

  if (!result) return null;

  const persona = getPersonaById(result.personaId);
  if (!persona) return null;

  const summary = generateResultSummary({
    personaId: result.personaId,
    tagScores: result.tagScores,
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
    const text = `${persona.shareLine}\n\n${SITE_COPY.brand.name} · ${SITE_COPY.brand.tagline}`;
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
        <Text className="result-hero-label">你的气味人格</Text>
        <Text className="result-hero-name">{persona.name}</Text>
        <Text className="result-hero-title">{persona.title}</Text>
        <View className="result-hero-confidence">
          <Text className="result-hero-confidence-text">
            匹配度 {Math.round(result.confidence * 100)}%
          </Text>
        </View>
      </View>

      {/* Report */}
      <View className="card">
        <Text className="section-title">人格报告</Text>
        <Text className="result-report-text">{persona.reportSections.identity}</Text>
        <Text className="result-report-subtitle">香调方向</Text>
        <Text className="result-report-text">{persona.reportSections.scentDirection}</Text>
        <Text className="result-report-subtitle">不太适合你的</Text>
        <Text className="result-report-text">{persona.reportSections.avoid}</Text>
        <Text className="result-report-subtitle">理想场景</Text>
        <Text className="result-report-text">{persona.reportSections.scenes}</Text>
        <Text className="result-report-closing">{persona.reportSections.closing}</Text>
      </View>

      {/* Tags */}
      <View className="card">
        <Text className="section-title">你的气味标签</Text>
        <View className="result-tags">
          {summary.topTags.map((tag) => (
            <View key={tag} className="tag tag-sage">
              <Text>{SCENT_TAG_LABELS[tag]}</Text>
            </View>
          ))}
        </View>
        {summary.avoidTags.length > 0 && (
          <>
            <Text className="result-avoid-label">尽量避开</Text>
            <View className="result-tags">
              {summary.avoidTags.map((tag) => (
                <View key={tag} className="tag tag-clay">
                  <Text>{SCENT_TAG_LABELS[tag]}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>

      {/* Match reasons */}
      <View className="card">
        <Text className="section-title">为什么是这个人格</Text>
        {result.reasons.map((reason, i) => (
          <View key={i} className="result-reason">
            <Text className="text-sage">· </Text>
            <Text>{reason}</Text>
          </View>
        ))}
      </View>

      {/* Recommendations */}
      <View className="card">
        <Text className="section-title">为你推荐的小样</Text>
        {result.recommendations.map((rec, i) => {
          const product = getProductById(rec.productId);
          if (!product) return null;
          return (
            <View
              key={i}
              className="result-rec"
              onClick={() => Taro.navigateTo({ url: `/pages/product-detail/index?slug=${product.slug}` })}
            >
              <Image className="result-rec-img" src={assetUrl(product.image)} mode="aspectFill" />
              <View className="result-rec-info">
                <Text className="result-rec-role">{rec.role}</Text>
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
        <Text className="result-cta-title">{SITE_COPY.result.sampleCtaTitle}</Text>
        <Text className="result-cta-copy">{SITE_COPY.result.sampleCtaCopy}</Text>
        <Button className="btn-primary" onClick={goToCheckout}>
          {SITE_COPY.result.sampleCtaButton}
        </Button>
      </View>

      {/* Actions */}
      <View className="result-actions">
        <Button className="btn-secondary" onClick={handleCopy}>
          {copied ? SITE_COPY.result.copiedText : SITE_COPY.result.copyButton}
        </Button>
        <Button className="btn-secondary" onClick={retake}>
          {SITE_COPY.result.retakeCta}
        </Button>
      </View>

      <View className="result-actions">
        <Button className="btn-secondary" onClick={goToProducts}>
          查看全部产品
        </Button>
        <Button className="btn-secondary" onClick={goToFeedback}>
          填写试香反馈
        </Button>
      </View>

      <Button className="btn-primary result-share" openType="share" onClick={handleShare}>
        分享给朋友
      </Button>
    </View>
  );
}
