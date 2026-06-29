import { useEffect, useState } from "react";
import { View, Text, Button, Progress } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { QUIZ_QUESTIONS } from "../../data/quizQuestions";
import { SITE_COPY } from "../../data/copy";
import { scoreQuizAnswers, matchPersona, recommendProducts } from "../../lib/scoring";
import { submitQuiz, trackEvent } from "../../lib/request";
import type { QuizAnswerInput } from "../../lib/scoring/types";
import { THEME_CLASS, IS_XHS } from "../../lib/theme";
import "./index.scss";

export default function Quiz() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswerInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const total = QUIZ_QUESTIONS.length;
  const question = QUIZ_QUESTIONS[currentIndex];

  useEffect(() => {
    trackEvent({ eventName: "quiz_start", path: "/pages/quiz/index" });
  }, []);

  const handleSelect = (optionId: string) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = { questionId: question.id, optionId };
    setAnswers(newAnswers);
  };

  const handleNext = async () => {
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
      return;
    }

    setLoading(true);
    setError(false);

    try {
      const scoreResult = scoreQuizAnswers({ answers });
      const personaResult = matchPersona({
        tagScores: scoreResult.tagScores,
        personaScores: scoreResult.personaScores,
      });
      const productResult = recommendProducts({
        personaId: personaResult.personaId,
        tagScores: scoreResult.tagScores,
      });

      let sessionId = "";
      try {
        const apiRes = await submitQuiz(answers);
        sessionId = apiRes.sessionId;
        trackEvent({
          eventName: "quiz_complete",
          path: "/pages/quiz/index",
          sessionId,
          personaId: personaResult.personaId,
        });
      } catch {
        // API may fail in dev; continue with local result
      }

      const resultData = {
        sessionId,
        personaId: personaResult.personaId,
        confidence: personaResult.confidence,
        reasons: personaResult.reasons,
        tagScores: scoreResult.tagScores,
        normalizedTagScores: scoreResult.normalizedTagScores,
        recommendations: productResult.recommendations,
      };

      Taro.setStorageSync("quizResult", resultData);
      Taro.redirectTo({ url: "/pages/result/index" });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const selectedOption = answers[currentIndex]?.optionId;
  const progress = ((currentIndex + 1) / total) * 100;

  if (loading) {
    return (
      <View className={`quiz-loading ${THEME_CLASS}`}>
        <Text className="quiz-loading-text">{SITE_COPY.quiz.loadingText}</Text>
      </View>
    );
  }

  return (
    <View className={`quiz ${THEME_CLASS}`}>
      {/* Progress */}
      <View className="quiz-progress">
        <Progress percent={progress} activeColor={IS_XHS ? "#ff2e4d" : "#7c9070"} strokeWidth={4} />
        <Text className="quiz-progress-text">{currentIndex + 1} / {total}</Text>
      </View>

      {/* Question */}
      <View className="quiz-question">
        <Text className="quiz-question-title">{question.question}</Text>
        {question.subtitle && (
          <Text className="quiz-question-subtitle">{question.subtitle}</Text>
        )}
      </View>

      {/* Options */}
      <View className="quiz-options">
        {question.options.map((option) => (
          <View
            key={option.id}
            className={`quiz-option ${selectedOption === option.id ? "quiz-option-selected" : ""}`}
            onClick={() => handleSelect(option.id)}
          >
            <Text className="quiz-option-label">{option.label}</Text>
            {option.description && (
              <Text className="quiz-option-desc">{option.description}</Text>
            )}
          </View>
        ))}
      </View>

      {/* Actions */}
      <View className="quiz-actions">
        {currentIndex > 0 && (
          <Button className="btn-secondary quiz-prev" onClick={handlePrev}>
            上一题
          </Button>
        )}
        <Button
          className="btn-primary quiz-next"
          disabled={!selectedOption}
          onClick={handleNext}
        >
          {currentIndex < total - 1 ? "下一题" : "查看结果"}
        </Button>
      </View>

      {error && (
        <View className="quiz-error">
          <Text>{SITE_COPY.quiz.errorText}</Text>
        </View>
      )}
    </View>
  );
}
