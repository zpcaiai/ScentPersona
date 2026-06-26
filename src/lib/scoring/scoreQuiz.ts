import { QUIZ_QUESTIONS } from "@/data/quizQuestions";
import { SCENT_TAGS } from "@/data/scentTags";
import { PERSONAS } from "@/data/personas";
import type {
  QuizAnswerInput,
  ScoreQuizResult,
  TagScores,
  PersonaScores,
  ScentTag,
  PersonaId,
} from "./types";

function emptyTagScores(): TagScores {
  const result = {} as TagScores;
  for (const tag of SCENT_TAGS) {
    result[tag] = 0;
  }
  return result;
}

function emptyPersonaScores(): PersonaScores {
  const result = {} as PersonaScores;
  for (const persona of PERSONAS) {
    result[persona.id] = 0;
  }
  return result;
}

export function scoreQuizAnswers(input: {
  answers: QuizAnswerInput[];
}): ScoreQuizResult {
  const tagScores = emptyTagScores();
  const personaScores = emptyPersonaScores();
  const warnings: string[] = [];

  const questionMap = new Map(QUIZ_QUESTIONS.map((q) => [q.id, q]));

  for (const answer of input.answers) {
    const question = questionMap.get(answer.questionId);
    if (!question) {
      warnings.push(`Unknown questionId: ${answer.questionId}`);
      continue;
    }

    const option = question.options.find((o) => o.id === answer.optionId);
    if (!option) {
      warnings.push(`Unknown optionId: ${answer.optionId} for questionId: ${answer.questionId}`);
      continue;
    }

    for (const [tag, score] of Object.entries(option.tagScores)) {
      const t = tag as ScentTag;
      if (t in tagScores) {
        tagScores[t] += score as number;
      }
    }

    if (option.personaScores) {
      for (const [pid, score] of Object.entries(option.personaScores)) {
        const p = pid as PersonaId;
        if (p in personaScores) {
          personaScores[p] += score as number;
        }
      }
    }
  }

  const maxTagScore = Math.max(1, ...Object.values(tagScores));
  const normalizedTagScores = { ...tagScores };
  for (const tag of SCENT_TAGS) {
    normalizedTagScores[tag] = Math.round((tagScores[tag] / maxTagScore) * 10 * 10) / 10;
  }

  return {
    tagScores,
    normalizedTagScores,
    personaScores,
    warnings,
  };
}
