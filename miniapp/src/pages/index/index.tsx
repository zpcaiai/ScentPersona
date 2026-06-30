import { useEffect } from "react";
import { View, Text, Button, Image } from "@tarojs/components";
import Taro, { useShareAppMessage, useShareTimeline } from "@tarojs/taro";
import { getSiteCopy } from "../../data/copy";
import { getPersonas } from "../../data/personas";
import { trackEvent, assetUrl } from "../../lib/request";
import { THEME_CLASS } from "../../lib/theme";
import { useLang, pick, useNavTitle } from "../../lib/i18n";
import "./index.scss";

export default function Index() {
  const { locale } = useLang();
  useNavTitle("ScentPersona 气味人格测试", "ScentPersona Quiz");
  const copy = getSiteCopy(locale);
  const personas = getPersonas(locale);

  useEffect(() => {
    trackEvent({ eventName: "page_view", path: "/pages/index/index" });
  }, []);

  const goToQuiz = () => Taro.navigateTo({ url: "/pages/quiz/index" });
  const goToProducts = () => Taro.switchTab({ url: "/pages/products/index" });

  const shareTitle = pick(locale, "先测再闻，找到你的本命香 | ScentPersona", "Test first, then smell — find your signature scent | ScentPersona");
  useShareAppMessage(() => ({ title: shareTitle, path: "/pages/index/index" }));
  useShareTimeline(() => ({ title: shareTitle }));

  return (
    <View className={`index ${THEME_CLASS}`}>
      {/* Hero */}
      <View className="hero">
        <Text className="hero-eyebrow">{pick(locale, "中文香水人格测试 · 8 种气味人格", "Scent persona quiz · 8 personas")}</Text>
        <Text className="hero-title">{copy.landing.heroTitle}</Text>
        <Text className="hero-subtitle">{copy.landing.heroSubtitle}</Text>
        <Image className="hero-img" src={assetUrl("/products/sample-set.jpg")} mode="aspectFill" />
        <Button className="btn-primary hero-cta" onClick={goToQuiz}>
          {copy.landing.heroCtaPrimary}
        </Button>
        <Button className="btn-secondary" onClick={goToProducts}>
          {copy.landing.heroCtaSecondary}
        </Button>
      </View>

      {/* Problem */}
      <View className="card">
        <Text className="section-title">{copy.landing.problemTitle}</Text>
        {copy.landing.problemPoints.map((point, i) => (
          <View key={i} className="problem-item">
            <Text className="problem-dot">·</Text>
            <Text>{point}</Text>
          </View>
        ))}
      </View>

      {/* How it works */}
      <View className="card">
        <Text className="section-title">{copy.landing.howItWorksTitle}</Text>
        {copy.landing.steps.map((step, i) => (
          <View key={i} className="step-item">
            <View className="step-num">
              <Text className="step-num-text">{i + 1}</Text>
            </View>
            <View className="step-content">
              <Text className="step-title">{step.title}</Text>
              <Text className="step-desc">{step.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Persona preview */}
      <View className="card">
        <Text className="section-title">{pick(locale, "8种气味人格", "8 scent personas")}</Text>
        <View className="persona-grid">
          {personas.map((persona) => (
            <View key={persona.id} className="persona-chip">
              <Text className="persona-chip-name">{persona.name}</Text>
              <Text className="persona-chip-title">{persona.title}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Trust */}
      <View className="card">
        <Text className="section-title">{copy.landing.trustTitle}</Text>
        {copy.landing.trustPoints.map((point, i) => (
          <View key={i} className="trust-item">
            <Text className="text-sage">✓ </Text>
            <Text>{point}</Text>
          </View>
        ))}
      </View>

      {/* Final CTA */}
      <View className="card final-cta">
        <Text className="final-cta-title">{copy.landing.finalCtaTitle}</Text>
        <Button className="btn-primary" onClick={goToQuiz}>
          {copy.landing.finalCtaButton}
        </Button>
      </View>

      <View className="footer">
        <Text className="text-muted">{pick(locale, "ScentPersona · 先测再闻，找到你的本命香", "ScentPersona · Test first, then smell")}</Text>
      </View>
    </View>
  );
}
