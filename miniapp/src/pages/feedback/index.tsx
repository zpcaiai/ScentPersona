import { useState } from "react";
import { View, Text, Textarea, Button, Radio, Checkbox, Picker } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { PRODUCTS } from "../../data/products";
import { SITE_COPY } from "../../data/copy";
import { submitFeedback } from "../../lib/request";
import "./index.scss";

export default function Feedback() {
  const router = useRouter();
  const sessionId = router.params.sessionId || "";
  const personaId = router.params.personaId || "";

  const [favoriteProduct, setFavoriteProduct] = useState("");
  const [dislikedProducts, setDislikedProducts] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [feeling, setFeeling] = useState("");
  const [buyFullSize, setBuyFullSize] = useState(false);
  const [fullSizeProduct, setFullSizeProduct] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleDisliked = (id: string) => {
    setDislikedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const setRating = (productId: string, score: number) => {
    setRatings((prev) => ({ ...prev, [productId]: score }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await submitFeedback({
        sessionId,
        personaId,
        favoriteProductId: favoriteProduct,
        dislikedProductIds: dislikedProducts,
        ratings,
        comment,
        boughtFullSize: buyFullSize,
        fullSizeProductId: fullSizeProduct,
      });
    } catch {
      // API may fail; still show success for MVP
    } finally {
      setSubmitted(true);
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View className="feedback-success">
        <Text className="feedback-success-title">{SITE_COPY.feedback.thankYouTitle}</Text>
        <Text className="feedback-success-desc">{SITE_COPY.feedback.thankYouDesc}</Text>
        <Button
          className="btn-primary"
          onClick={() => Taro.switchTab({ url: "/pages/index/index" })}
        >
          返回首页
        </Button>
      </View>
    );
  }

  return (
    <View className="feedback">
      <View className="feedback-header">
        <Text className="feedback-title">{SITE_COPY.feedback.title}</Text>
        <Text className="feedback-subtitle">{SITE_COPY.feedback.subtitle}</Text>
      </View>

      {/* Favorite */}
      <View className="card">
        <Text className="section-title">{SITE_COPY.feedback.favoriteLabel}</Text>
        <RadioGroup
          options={PRODUCTS.map((p) => ({ label: p.name, value: p.id }))}
          value={favoriteProduct}
          onChange={(e) => setFavoriteProduct(e.detail.value)}
        />
      </View>

      {/* Disliked */}
      <View className="card">
        <Text className="section-title">{SITE_COPY.feedback.dislikedLabel}</Text>
        {PRODUCTS.map((p) => (
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
        <Text className="section-title">{SITE_COPY.feedback.ratingLabel}</Text>
        {PRODUCTS.map((p) => (
          <View key={p.id} className="feedback-rating">
            <Text className="feedback-rating-name">{p.shortName}</Text>
            <View className="feedback-rating-stars">
              {[1, 2, 3, 4, 5].map((score) => (
                <Text
                  key={score}
                  className={`feedback-star ${(ratings[p.id] || 0) >= score ? "feedback-star-active" : ""}`}
                  onClick={() => setRating(p.id, score)}
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
        <Text className="section-title">{SITE_COPY.feedback.feelingLabel}</Text>
        <Picker
          mode="selector"
          range={SITE_COPY.feedback.feelingOptions}
          onChange={(e) => setFeeling(SITE_COPY.feedback.feelingOptions[Number(e.detail.value)])}
        >
          <View className="feedback-picker">
            <Text className={feeling ? "" : "text-muted"}>
              {feeling || "请选择..."}
            </Text>
            <Text className="feedback-picker-arrow">›</Text>
          </View>
        </Picker>
      </View>

      {/* Buy full size */}
      <View className="card">
        <Text className="section-title">{SITE_COPY.feedback.buyFullSizeLabel}</Text>
        <View className="feedback-radio-row">
          <View
            className={`feedback-radio ${buyFullSize ? "feedback-radio-active" : ""}`}
            onClick={() => setBuyFullSize(true)}
          >
            <Text>是</Text>
          </View>
          <View
            className={`feedback-radio ${!buyFullSize ? "feedback-radio-active" : ""}`}
            onClick={() => setBuyFullSize(false)}
          >
            <Text>否</Text>
          </View>
        </View>
        {buyFullSize && (
          <>
            <Text className="feedback-sub-label">{SITE_COPY.feedback.fullSizeProductLabel}</Text>
            <RadioGroup
              options={PRODUCTS.map((p) => ({ label: p.name, value: p.id }))}
              value={fullSizeProduct}
              onChange={(e) => setFullSizeProduct(e.detail.value)}
            />
          </>
        )}
      </View>

      {/* Comment */}
      <View className="card">
        <Text className="section-title">{SITE_COPY.feedback.commentLabel}</Text>
        <Textarea
          className="feedback-textarea"
          placeholder="其他想说的..."
          value={comment}
          onInput={(e) => setComment(e.detail.value)}
          maxlength={500}
        />
      </View>

      <View className="feedback-submit">
        <Button
          className="btn-primary"
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading ? "提交中..." : SITE_COPY.feedback.submitButton}
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
