// Pure logic for osteoporosis / FRAX-linked risk stratification.
// Extracted so it can be unit-tested independently of the React UI.

export type FractureType = "hip" | "vertebral" | "distal radius" | "humerus" | "other" | "none";
export type Risk = "veryHigh" | "high" | "moderate";
export type DxaSite = "femoral neck" | "total hip" | "lumbar spine" | "distal radius";

export interface StratifyInput {
  fractureType: FractureType;
  priorHipOrVertebral: boolean;
  tScore: string | number;          // T-score at the *index site* only
  fraxMajor: string | number;
  fraxHip: string | number;
  recentMultiple: boolean;
  multipleVertebral: boolean;
  glucocorticoid: boolean;
  advancedAge: boolean;
  highFallRisk: boolean;
}

export interface StratifyResult {
  risk: Risk;
  reasons: string[];
}

/**
 * FRAX / IOF/ESCEO risk stratification.
 * IMPORTANT: `tScore` is the *index site* T-score (femoral neck by default,
 * or total hip if the local protocol specifies it). It must NOT be the
 * maximum T-score across sites nor the fracture-site T-score.
 */
export function stratify(s: StratifyInput): StratifyResult {
  const t = typeof s.tScore === "number" ? s.tScore : parseFloat(s.tScore);
  const fm = typeof s.fraxMajor === "number" ? s.fraxMajor : parseFloat(s.fraxMajor);
  const fh = typeof s.fraxHip === "number" ? s.fraxHip : parseFloat(s.fraxHip);
  const reasons: string[] = [];
  const hipOrVert = s.fractureType === "hip" || s.fractureType === "vertebral" || s.priorHipOrVertebral;

  if (s.recentMultiple) reasons.push("Recent multiple fractures (<1 y)");
  if (s.multipleVertebral) reasons.push("Multiple vertebral fractures");
  if (!isNaN(t) && t <= -3.0) reasons.push(`Very low BMD (T ${t.toFixed(1)})`);
  if (s.advancedAge && s.highFallRisk) reasons.push("Advanced age + high fall risk");
  if (s.glucocorticoid && !isNaN(t) && t <= -2.5) reasons.push("Chronic steroids + T ≤ –2.5");
  if (reasons.length) return { risk: "veryHigh", reasons };

  const high: string[] = [];
  if (hipOrVert) high.push("Prior hip/vertebral fracture");
  if (!isNaN(t) && t <= -2.5) high.push(`T-score ${t.toFixed(1)} ≤ –2.5`);
  if (!isNaN(fm) && fm >= 20) high.push(`FRAX major ${fm}% ≥ 20%`);
  if (!isNaN(fh) && fh >= 3) high.push(`FRAX hip ${fh}% ≥ 3%`);
  if (high.length) return { risk: "high", reasons: high };

  return { risk: "moderate", reasons: ["No very-high or high-risk criteria met"] };
}

/** Sites that are valid FRAX/IOF/ESCEO index sites. */
export const INDEX_SITES: DxaSite[] = ["femoral neck", "total hip"];

export interface SiteCheck {
  ok: boolean;
  severity: "ok" | "warning" | "error";
  message: string;
}

/** Validate that the user entered the T-score from an accepted index site. */
export function checkDxaSite(site: DxaSite | ""): SiteCheck {
  if (!site) {
    return { ok: false, severity: "warning", message: "Select the DXA site of the T-score you entered." };
  }
  if (site === "femoral neck") {
    return { ok: true, severity: "ok", message: "Femoral neck — the default FRAX index site." };
  }
  if (site === "total hip") {
    return { ok: true, severity: "ok", message: "Total hip — accepted when the local protocol specifies it." };
  }
  if (site === "lumbar spine") {
    return {
      ok: false,
      severity: "error",
      message:
        "Lumbar spine is NOT a FRAX index site. Re-enter the femoral neck (or total hip) T-score. " +
        "If spine is markedly lower than hip, apply the IOF/ESCEO discordance up-adjustment separately — do not swap the FRAX input.",
    };
  }
  if (site === "distal radius") {
    return {
      ok: false,
      severity: "error",
      message:
        "Distal radius (peripheral DXA) is NOT a FRAX calibration site — even if the fracture was in the radius. " +
        "Enter the femoral neck / total hip T-score instead; fracture site is captured separately.",
    };
  }
  return { ok: false, severity: "warning", message: "Unknown site." };
}

export interface DiscordanceResult {
  discordant: boolean;
  gap: number;              // spine minus hip (negative = spine lower)
  upAdjust: boolean;        // recommend risk up-adjustment
  message: string;
}

/**
 * Handle spine–hip discordance WITHOUT switching the FRAX input to the lower site.
 * Rule of thumb: if lumbar spine T-score is ≥ 1.0 SD lower than the femoral-neck /
 * total-hip T-score, keep the hip T-score in FRAX and up-adjust the risk category
 * qualitatively (per IOF/ESCEO / Leslie discordance guidance).
 */
export function discordanceGuidance(hipT: number, spineT: number): DiscordanceResult {
  if (isNaN(hipT) || isNaN(spineT)) {
    return { discordant: false, gap: NaN, upAdjust: false, message: "Enter both hip and spine T-scores." };
  }
  const gap = spineT - hipT;
  if (gap <= -1.0) {
    return {
      discordant: true,
      gap,
      upAdjust: true,
      message:
        `Spine T-score is ${Math.abs(gap).toFixed(1)} SD lower than hip. ` +
        "Keep the femoral neck / total hip T-score in FRAX; up-adjust the reported risk category one step (moderate → high, high → very high). " +
        "Do NOT swap the FRAX input to the spine value and do NOT use the maximum T-score.",
    };
  }
  if (gap >= 1.0) {
    return {
      discordant: true,
      gap,
      upAdjust: false,
      message:
        `Hip T-score is ${gap.toFixed(1)} SD lower than spine. ` +
        "The hip value already drives FRAX — no additional up-adjustment needed. Do NOT substitute the (better) spine value.",
    };
  }
  return { discordant: false, gap, upAdjust: false, message: "No clinically important spine–hip discordance (<1 SD)." };
}
