import { useEffect, useState } from "react";
import { View, Text, Textarea, Button, Radio, Checkbox, Picker } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { getProducts } from "../../data/products";
import { getSiteCopy } from "../../data/copy";
import { submitFeedback, trackEvent } from "../../lib/request";
import { useLang, pick, useNavTitle } from "../../lib/i18n";
import { THEME_CLASS } from "../../lib/theme";
import "./index.scss";

export default function Feedback() {
  const { locale } = useLang();
  useNavTitle("试香反馈", "Scent feedback");
  const copy = getSiteCopy(locale);
  const products = getProducts(locale);
  const router = useRouter();
  const sessionId = router.params.sessionId || "";
  const personaId = router.params.personaId || "";
  const orderId = router.params.orderId || "";
  const orderAccessToken = router.params.orderAccessToken || "";

  const [favoriteProduct, setFavoriteProduct] = useState("");
  const [dislikedProducts, setDislikedProducts] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [feeling, setFeeling] = useState("");
  const [buyFullSize, setBuyFullSize] = useState(false);
  const [fullSizeProduct, setFullSizeProduct] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    trackEvent({
      eventName: "feedback_view",
      path: "/pages/feedback/index",
      sessionId,
      orderId,
      personaId,
    });
  }, [sessionId, orderId, personaId]);

  const toggleDisliked = (id: string) => {
    setDislikedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const setRating = (key: string, score: number) => {
    setRatings((prev) => ({ ...prev, [key]: score }));
  };

  const handleSubmit = async () => {
    setError("");
    if (!favoriteProduct) {
      setError(pick(locale, "请选择最喜欢的一支", "Please pick your favorite"));
      return;
    }
    if (!ratings.accuracy || !ratings.satisfaction || !ratings.packaging) {
      setError(pick(locale, "请完成推荐准确度、整体满意度和包装体验评分", "Please rate recommendation accuracy, overall satisfaction, and packaging"));
      return;
    }

    setLoading(true);
    try {
      await submitFeedback({
        sessionId,
        orderId: orderId || undefined,
        orderAccessToken: orderAccessToken || undefined,
        personaId,
        favoriteProductId: favoriteProduct,
        dislikedProductIds: dislikedProducts,
        ratings,
        comment,
        boughtFullSize: buyFullSize,
        fullSizeProductId: fullSizeProduct,
      });
      setSubmitted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : pick(locale, "提交失败", "Submission failed");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View className={`feedback-success ${THEME_CLASS}`}>
        <Text className="feedback-success-title">{copy.feedback.thankYouTitle}</Text>
        <Text className="feedback-success-desc">{copy.feedback.thankYouDesc}</Text>
        <Button
          className="btn-primary"
          onClick={() => Taro.switchTab({ url: "/pages/index/index" })}
        >
          {pick(locale, "返回首页", "Back to home")}
        </Button>
      </View>
    );
  }

  return (
    <View className={`feedback ${THEME_CLASS}`}>
      <View className="feedback-header">
        <Text className="feedback-title">{copy.feedback.title}</Text>
        <Text className="feedback-subtitle">{copy.feedback.subtitle}</Text>
      </View>

      {/* Favorite */}
      <View className="card">
        <Text className="section-title">{copy.feedback.favoriteLabel}</Text>
        <RadioGroup
          options={products.map((p) => ({ label: p.name, value: p.id }))}
          value={favoriteProduct}
          onChange={(e) => setFavoriteProduct(e.detail.value)}
        />
      </View>

      {/* Disliked */}
      <View className="card">
        <Text className="section-title">{copy.feedback.dislikedLabel}</Text>
        {products.map((p) => (
          <View
            key={p.id}
            className={`feedback-check ${dislikedProducts.includes(p.id) ? "feedback-check-active" : ""}`}
            onClick={() => toggleDisliked(p.id)}
          >
            <Text>{p.name}</Text>
            {dislikedProducts.includes(p.id) && <Text className="text-clay"> ✓</Text>}
          </View>
        ))}
      </View>

      {/* Ratings */}
      <View className="card">
        <Text className="section-title">{copy.feedback.ratingLabel}</Text>
        {[
          { key: "accuracy", label: pick(locale, "推荐准确度", "Recommendation accuracy") },
          { key: "satisfaction", label: pick(locale, "整体满意度", "Overall satisfaction") },
          { key: "packaging", label: pick(locale, "包装体验", "Packaging experience") },
        ].map((item) => (
          <View key={item.key} className="feedback-rating">
            <Text className="feedback-rating-name">{item.label}</Text>
            <View className="feedback-rating-stars">
              {[1, 2, 3, 4, 5].map((score) => (
                <Text
                  key={score}
                  className={`feedback-star ${(ratings[item.key] || 0) >= score ? "feedback-star-active" : ""}`}
                  onClick={() => setRating(item.key, score)}
                >
                  ★
                </Text>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Feeling */}
      <View className="card">
        <Text className="section-title">{copy.feedback.feelingLabel}</Text>
        <Picker
          mode="selector"
          range={copy.feedback.feelingOptions}
          onChange={(e) => setFeeling(copy.feedback.feelingOptions[Number(e.detail.value)])}
        >
          <View className="feedback-picker">
            <Text className={feeling ? "" : "text-muted"}>
              {feeling || pick(locale, "请选择...", "Please select...")}
            </Text>
            <Text className="feedback-picker-arrow">›</Text>
          </View>
        </Picker>
      </View>

      {/* Buy full size */}
      <View className="card">
        <Text className="section-title">{copy.feedback.buyFullSizeLabel}</Text>
        <View className="feedback-radio-row">
          <View
            className={`feedback-radio ${buyFullSize ? "feedback-radio-active" : ""}`}
            onClick={() => setBuyFullSize(true)}
          >
            <Text>{pick(locale, "是", "Yes")}</Text>
          </View>
          <View
            className={`feedback-radio ${!buyFullSize ? "feedback-radio-active" : ""}`}
            onClick={() => setBuyFullSize(false)}
          >
            <Text>{pick(locale, "否", "No")}</Text>
          </View>
        </View>
        {buyFullSize && (
          <>
            <Text className="feedback-sub-label">{copy.feedback.fullSizeProductLabel}</Text>
            <RadioGroup
              options={products.map((p) => ({ label: p.name, value: p.id }))}
              value={fullSizeProduct}
              onChange={(e) => setFullSizeProduct(e.detail.value)}
            />
          </>
        )}
      </View>

      {/* Comment */}
      <View className="card">
        <Text className="section-title">{copy.feedback.commentLabel}</Text>
        <Textarea
          className="feedback-textarea"
          placeholder={pick(locale, "其他想说的...", "Anything else you'd like to share...")}
          value={comment}
          onInput={(e) => setComment(e.detail.value)}
          maxlength={500}
        />
      </View>

      {error && (
        <View className="feedback-error">
          <Text>{error}</Text>
        </View>
      )}

      <View className="feedback-submit">
        <Button
          className="btn-primary"
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading ? pick(locale, "提交中...", "Submitting...") : copy.feedback.submitButton}
        </Button>
      </View>
    </View>
  );
}

function RadioGroup({ options, value, onChange }: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (e: { detail: { value: string } }) => void;
}) {
  return (
    <View className="feedback-radio-group">
      {options.map((opt) => (
        <View
          key={opt.value}
          className={`feedback-radio-option ${value === opt.value ? "feedback-radio-active" : ""}`}
          onClick={() => onChange({ detail: { value: opt.value } })}
        >
          <Text>{opt.label}</Text>
        </View>
      ))}
    </View>
  );
}
