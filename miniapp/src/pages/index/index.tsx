import { useEffect } from "react";
import { View, Text, Button } from "@tarojs/components";
import Taro, { useShareAppMessage, useShareTimeline } from "@tarojs/taro";
import { SITE_COPY } from "../../data/copy";
import { PERSONAS } from "../../data/personas";
import { trackEvent } from "../../lib/request";
import "./index.scss";

export default function Index() {
  useEffect(() => {
    trackEvent({ eventName: "page_view", path: "/pages/index/index" });
  }, []);

  const goToQuiz = () => Taro.navigateTo({ url: "/pages/quiz/index" });
  const goToProducts = () => Taro.switchTab({ url: "/pages/products/index" });

  useShareAppMessage(() => ({
    title: "先测再闻，找到你的本命香 | ScentPersona",
    path: "/pages/index/index",
  }));
  useShareTimeline(() => ({
    title: "先测再闻，找到你的本命香 | ScentPersona",
  }));

  return (
    <View className="index">
      {/* Hero */}
      <View className="hero">
        <Text className="hero-title">{SITE_COPY.landing.heroTitle}</Text>
        <Text className="hero-subtitle">{SITE_COPY.landing.heroSubtitle}</Text>
        <Button className="btn-primary" onClick={goToQuiz}>
          {SITE_COPY.landing.heroCtaPrimary}
        </Button>
        <Button className="btn-secondary" onClick={goToProducts}>
          {SITE_COPY.landing.heroCtaSecondary}
        </Button>
      </View>

      {/* Problem */}
      <View className="card">
        <Text className="section-title">{SITE_COPY.landing.problemTitle}</Text>
        {SITE_COPY.landing.problemPoints.map((point, i) => (
          <View key={i} className="problem-item">
            <Text className="problem-dot">·</Text>
            <Text>{point}</Text>
          </View>
        ))}
      </View>

      {/* How it works */}
      <View className="card">
        <Text className="section-title">{SITE_COPY.landing.howItWorksTitle}</Text>
        {SITE_COPY.landing.steps.map((step, i) => (
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
        <Text className="section-title">8种气味人格</Text>
        <View className="persona-grid">
          {PERSONAS.map((persona) => (
            <View key={persona.id} className="persona-chip">
              <Text className="persona-chip-name">{persona.name}</Text>
              <Text className="persona-chip-title">{persona.title}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Trust */}
      <View className="card">
        <Text className="section-title">{SITE_COPY.landing.trustTitle}</Text>
        {SITE_COPY.landing.trustPoints.map((point, i) => (
          <View key={i} className="trust-item">
            <Text className="text-sage">✓ </Text>
            <Text>{point}</Text>
          </View>
        ))}
      </View>

      {/* Final CTA */}
      <View className="card final-cta">
        <Text className="final-cta-title">{SITE_COPY.landing.finalCtaTitle}</Text>
        <Button className="btn-primary" onClick={goToQuiz}>
          {SITE_COPY.landing.finalCtaButton}
        </Button>
      </View>

      <View className="footer">
        <Text className="text-muted">ScentPersona · 先测再闻，找到你的本命香</Text>
      </View>
    </View>
  );
}
