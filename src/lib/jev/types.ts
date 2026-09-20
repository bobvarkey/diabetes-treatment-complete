/** TypeSafe Jev System One question and answer shapes. Compact clinical state only. */

export const JEV_SYSTEMONE_URL = "https://api.typesafe.ai/v1/systemone";
export const JEV_MODEL = "jev-latest";

export const JEV_ACT_MIN = 0.75;
export const JEV_ASK_MIN = 0.5;

export type JevQuestionType = "noul" | "choice" | "score";

export type JevNoulQuestion = {
  type: "noul";
  instructions: string;
  criteria?: { true: string; false: string };
};

export type JevChoiceQuestion = {
  type: "choice";
  instructions: string;
  criteria: Record<string, string>;
};

export type JevScoreQuestion = {
  type: "score";
  instructions: string;
  criteria: string[];
};

export type JevQuestion = JevNoulQuestion | JevChoiceQuestion | JevScoreQuestion;

export type JevNoulAnswer = {
  type?: "noul";
  noul: number;
  confidence?: number;
};

export type JevChoiceAnswer = {
  type?: "choice";
  choice: string;
  confidence: number;
  probabilities: Record<string, number>;
};

export type JevScoreAnswer = {
  type?: "score";
  score: number;
  confidence: number;
  legend?: Record<string, string>;
  probabilities: Record<string, number>;
};

export type JevAnswer = JevNoulAnswer | JevChoiceAnswer | JevScoreAnswer;

export type JevSystemOneRequest = {
  model: string;
  state: unknown;
  questions: Record<string, JevQuestion>;
};

export type JevSystemOneResponse = {
  model?: string;
  answers?: Record<string, JevAnswer>;
} & Record<string, unknown>;

export type JevUnavailableReason = "missing_key" | "http_error" | "invalid_response" | "network";

export type JevCallResult =
  | { available: true; model?: string; answers: Record<string, JevAnswer> }
  | { available: false; reason: JevUnavailableReason; reviewFlag: true };

export type GateAction = "act" | "ask" | "review";

export const FINAL_CATEGORIES = [
  "very_high",
  "high",
  "below_treatment_threshold",
  "assessment_incomplete",
] as const;

export type ClosedFinalCategory = (typeof FINAL_CATEGORIES)[number];
