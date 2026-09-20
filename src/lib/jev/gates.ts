import {
  FINAL_CATEGORIES,
  JEV_ACT_MIN,
  JEV_ASK_MIN,
  type ClosedFinalCategory,
  type GateAction,
  type JevAnswer,
  type JevChoiceAnswer,
  type JevNoulAnswer,
  type JevScoreAnswer,
} from "./types";

export { JEV_ACT_MIN, JEV_ASK_MIN, FINAL_CATEGORIES };

/** Closed category routes use REPLACE rather than merge when Jev is allowed to act. */
export const CLOSED_CATEGORY_ROUTE_MODE = "REPLACE" as const;

export function gateConfidence(confidence: number | null | undefined): GateAction {
  if (confidence == null || Number.isNaN(confidence)) return "review";
  if (confidence >= JEV_ACT_MIN) return "act";
  if (confidence >= JEV_ASK_MIN) return "ask";
  return "review";
}

export function isClosedFinalCategory(
  value: string | null | undefined,
): value is ClosedFinalCategory {
  return !!value && (FINAL_CATEGORIES as readonly string[]).includes(value);
}

function isChoiceAnswer(answer: JevAnswer | undefined): answer is JevChoiceAnswer {
  return !!answer && typeof (answer as JevChoiceAnswer).choice === "string";
}

function isScoreAnswer(answer: JevAnswer | undefined): answer is JevScoreAnswer {
  return !!answer && typeof (answer as JevScoreAnswer).score === "number";
}

function isNoulAnswer(answer: JevAnswer | undefined): answer is JevNoulAnswer {
  return !!answer && typeof (answer as JevNoulAnswer).noul === "number";
}

export type FinalCategoryGate = {
  displayed: ClosedFinalCategory;
  jevChoice: ClosedFinalCategory | null;
  applied: boolean;
  mode: "replace" | "ask_clinician" | "keep_deterministic";
  reviewFlag: boolean;
  clinicianPrompt?: string;
  probabilities?: Record<string, number>;
  confidence: number | null;
  gate: GateAction;
};

/**
 * Apply a Jev Choice on the closed final-category route.
 * ≥0.75 REPLACE; 0.50–0.74 show label+probabilities and ask; &lt;0.50 or invalid keep deterministic + review flag.
 */
export function applyJevFinalCategory(opts: {
  deterministic: ClosedFinalCategory;
  answer?: JevAnswer;
}): FinalCategoryGate {
  const answer = isChoiceAnswer(opts.answer) ? opts.answer : undefined;
  const rawChoice = answer?.choice ?? null;
  const jevChoice = isClosedFinalCategory(rawChoice) ? rawChoice : null;
  const confidence = answer && typeof answer.confidence === "number" ? answer.confidence : null;
  const gate = gateConfidence(confidence);

  if (!answer || !jevChoice || gate === "review") {
    return {
      displayed: opts.deterministic,
      jevChoice,
      applied: false,
      mode: "keep_deterministic",
      reviewFlag: true,
      clinicianPrompt:
        "Jev is below 0.50 confidence, failed, or returned an invalid category — keep the deterministic result and review clinically.",
      probabilities: answer?.probabilities,
      confidence,
      gate: !answer || !jevChoice ? "review" : gate,
    };
  }

  if (gate === "ask") {
    return {
      displayed: opts.deterministic,
      jevChoice,
      applied: false,
      mode: "ask_clinician",
      reviewFlag: true,
      clinicianPrompt: `Jev suggests ${jevChoice.replace(/_/g, " ")} (${Math.round((confidence ?? 0) * 100)}% confidence). Review probabilities before changing category.`,
      probabilities: answer.probabilities,
      confidence,
      gate,
    };
  }

  return {
    displayed: jevChoice,
    jevChoice,
    applied: jevChoice !== opts.deterministic,
    mode: "replace",
    reviewFlag: false,
    probabilities: answer.probabilities,
    confidence,
    gate,
  };
}

export type ScoreGate = {
  score: number | null;
  label: string | null;
  gate: GateAction;
  reviewFlag: boolean;
  clinicianPrompt?: string;
  probabilities?: Record<string, number>;
  confidence: number | null;
  acted: boolean;
};

export function applyJevScore(answer: JevAnswer | undefined): ScoreGate {
  if (!isScoreAnswer(answer)) {
    return {
      score: null,
      label: null,
      gate: "review",
      reviewFlag: true,
      clinicianPrompt: "Jev specialist score unavailable — keep the deterministic pathway.",
      confidence: null,
      acted: false,
    };
  }
  const confidence = typeof answer.confidence === "number" ? answer.confidence : null;
  const gate = gateConfidence(confidence);
  const rounded = Math.max(
    0,
    Math.min(
      Object.keys(answer.legend ?? answer.probabilities).length - 1,
      Math.round(answer.score),
    ),
  );
  const label = answer.legend?.[String(rounded)] ?? answer.legend?.[rounded] ?? null;

  if (gate === "review") {
    return {
      score: answer.score,
      label,
      gate,
      reviewFlag: true,
      clinicianPrompt: "Jev specialist score is below 0.50 confidence — do not act on it.",
      probabilities: answer.probabilities,
      confidence,
      acted: false,
    };
  }
  if (gate === "ask") {
    return {
      score: answer.score,
      label,
      gate,
      reviewFlag: true,
      clinicianPrompt: `Jev specialist score ${answer.score.toFixed(2)}${label ? ` (${label})` : ""} — ask the clinician before changing referral urgency.`,
      probabilities: answer.probabilities,
      confidence,
      acted: false,
    };
  }
  return {
    score: answer.score,
    label,
    gate,
    reviewFlag: false,
    probabilities: answer.probabilities,
    confidence,
    acted: true,
  };
}

export type NoulGate = {
  noul: number | null;
  gate: GateAction;
  reviewFlag: boolean;
  acted: boolean;
  clinicianPrompt?: string;
};

export function applyJevNoul(answer: JevAnswer | undefined): NoulGate {
  if (!isNoulAnswer(answer)) {
    return { noul: null, gate: "review", reviewFlag: true, acted: false };
  }
  const confidence = typeof answer.confidence === "number" ? answer.confidence : answer.noul;
  const gate = gateConfidence(confidence);
  if (gate === "review") {
    return {
      noul: answer.noul,
      gate,
      reviewFlag: true,
      acted: false,
      clinicianPrompt: "Jev judgment-need estimate is below 0.50 — keep the deterministic result.",
    };
  }
  if (gate === "ask") {
    return {
      noul: answer.noul,
      gate,
      reviewFlag: true,
      acted: false,
      clinicianPrompt: `Jev P(needs clinician judgment) = ${answer.noul.toFixed(2)} — confirm before locking a special-scenario upgrade.`,
    };
  }
  return { noul: answer.noul, gate, reviewFlag: false, acted: true };
}

export function parseJevAnswers(body: unknown): Record<string, JevAnswer> | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const answers = record.answers;
  if (answers && typeof answers === "object") return answers as Record<string, JevAnswer>;
  const looksLikeAnswers = Object.values(record).some(
    (v) =>
      v &&
      typeof v === "object" &&
      ("choice" in (v as object) || "noul" in (v as object) || "score" in (v as object)),
  );
  if (looksLikeAnswers) {
    const { model: _model, usage: _usage, ...rest } = record;
    return rest as Record<string, JevAnswer>;
  }
  return null;
}
