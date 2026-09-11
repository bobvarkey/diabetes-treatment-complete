import * as React from "react";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Info, RotateCcw, Bone, Calendar, Activity } from "lucide-react";

export interface FractureEntry {
  id: string;
  site: "hip" | "vertebral" | "distal_radius" | "proximal_humerus" | "pelvis" | "other";
  otherSite?: string;
  date?: string;
  fragilityFracture: "yes" | "no" | "uncertain";
  vertebralPresentation?: "clinical" | "imaging_detected" | "unknown" | "not_applicable";
  vertebralSeverity?: "mild" | "moderate" | "severe" | "unknown" | "not_applicable";
  vertebralLevel?: string;
  occurredDuringTreatment: "yes" | "no" | "unknown";
}

export interface FraxInput {
  majorOsteoporoticPercent?: number | "";
  hipPercent?: number | "";
  countryModel?: string;
  calculationDate?: string;
  source: "official_frax_manual_entry" | "authorized_frax_integration" | "unverified" | "not_available";
  femoralNeckBmdIncluded: "yes" | "no" | "unknown";
}

export interface ClinicalRiskInput {
  frax: FraxInput;
  fractureHistoryComplete: "yes" | "no" | "unknown";
  fractureHistory: FractureEntry[];
  fallsInPast12Months?: number | "";
  injuriousFallInPast12Months: "yes" | "no" | "unknown";
  clinicianIdentifiedHighFallsRisk: "yes" | "no" | "unknown";
}

const INITIAL_FRAX: FraxInput = {
  majorOsteoporoticPercent: "",
  hipPercent: "",
  countryModel: "",
  calculationDate: "",
  source: "not_available",
  femoralNeckBmdIncluded: "unknown",
};

const INITIAL_STATE: ClinicalRiskInput = {
  frax: INITIAL_FRAX,
  fractureHistoryComplete: "unknown",
  fractureHistory: [],
  fallsInPast12Months: "",
  injuriousFallInPast12Months: "unknown",
  clinicianIdentifiedHighFallsRisk: "unknown",
};

const SITE_LABELS: Record<FractureEntry["site"], string> = {
  hip: "Hip",
  vertebral: "Vertebral",
  distal_radius: "Distal radius",
  proximal_humerus: "Proximal humerus",
  pelvis: "Pelvis",
  other: "Other",
};

function generateId() {
  return `fx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function OsteoporosisClinicalRiskOverlay() {
  const [input, setInput] = useState<ClinicalRiskInput>(INITIAL_STATE);

  const updateFrax = (patch: Partial<FraxInput>) => {
    setInput((p) => ({ ...p, frax: { ...p.frax, ...patch } }));
  };

  const addFracture = () => {
    const entry: FractureEntry = {
      id: generateId(),
      site: "vertebral",
      fragilityFracture: "yes",
      occurredDuringTreatment: "unknown",
      vertebralPresentation: "clinical",
      vertebralSeverity: "moderate",
    };
    setInput((p) => ({ ...p, fractureHistory: [...p.fractureHistory, entry] }));
  };

  const updateFracture = (id: string, patch: Partial<FractureEntry>) => {
    setInput((p) => ({
      ...p,
      fractureHistory: p.fractureHistory.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));
  };

  const removeFracture = (id: string) => {
    setInput((p) => ({
      ...p,
      fractureHistory: p.fractureHistory.filter((f) => f.id !== id),
    }));
  };

  const reset = () => setInput(INITIAL_STATE);

  const major = typeof input.frax.majorOsteoporoticPercent === "number" ? input.frax.majorOsteoporoticPercent : NaN;
  const hip = typeof input.frax.hipPercent === "number" ? input.frax.hipPercent : NaN;
  const fraxVerified = input.frax.source === "official_frax_manual_entry" || input.frax.source === "authorized_frax_integration";

  const confirmedFragilityCount = input.fractureHistory.filter((f) => f.fragilityFracture === "yes").length;
  const multipleFragility = confirmedFragilityCount >= 2;
  const fractureOnTreatment = input.fractureHistory.some(
    (f) => f.fragilityFracture === "yes" && f.occurredDuringTreatment === "yes"
  );

  const recentHipOrClinicalVertebral = input.fractureHistory.some((f) => {
    if (f.fragilityFracture !== "yes") return false;
    if (f.site === "hip") return true;
    if (f.site === "vertebral" && f.vertebralPresentation === "clinical") return true;
    return false;
  });

  const fallsCount = typeof input.fallsInPast12Months === "number" ? input.fallsInPast12Months : NaN;
  const fallsFlag = !isNaN(fallsCount) && fallsCount > 0;
  const injuriousFlag = input.injuriousFallInPast12Months === "yes";
  const highFallsRiskFlag = input.clinicianIdentifiedHighFallsRisk === "yes";

  const reviewMessages = useMemo(() => {
    const msgs: { priority: "prompt" | "clinical_review" | "data_completion"; text: string }[] = [];
    if (recentHipOrClinicalVertebral) {
      msgs.push({ priority: "prompt", text: "Recent hip or clinical vertebral fracture: assess imminent fracture risk promptly." });
    }
    if (multipleFragility) {
      msgs.push({ priority: "clinical_review", text: "Multiple fragility fractures require clinical assessment beyond the FRAX percentage." });
    }
    if (fractureOnTreatment) {
      msgs.push({ priority: "clinical_review", text: "Review treatment duration, adherence, secondary causes and treatment strategy. A fracture alone does not establish treatment failure." });
    }
    if (injuriousFlag || highFallsRiskFlag) {
      msgs.push({ priority: "clinical_review", text: "Include falls risk in the overall assessment." });
    }
    if (input.fractureHistoryComplete !== "yes") {
      msgs.push({ priority: "data_completion", text: "Fracture history is incomplete." });
    }
    return msgs;
  }, [recentHipOrClinicalVertebral, multipleFragility, fractureOnTreatment, injuriousFlag, highFallsRiskFlag, input.fractureHistoryComplete]);

  const hasBlockingFlag = reviewMessages.some((m) => m.priority !== "data_completion");

  const fraxCategory = useMemo(() => {
    if (!fraxVerified || (isNaN(major) && isNaN(hip))) return null;
    if (!isNaN(major) && major >= 20) return "high";
    if (!isNaN(hip) && hip >= 3) return "high";
    if (!isNaN(major) && major >= 10) return "moderate";
    if (!isNaN(hip) && hip >= 1) return "moderate";
    return "low";
  }, [major, hip, fraxVerified]);

  const overallCategory = useMemo(() => {
    if (!fraxVerified && input.fractureHistoryComplete === "unknown") return { label: "Clinical classification required", category: "not_assigned" as const };
    if (hasBlockingFlag) return { label: "Clinical review required", category: "pending_review" as const };
    if (fraxCategory === "high") return { label: "High clinical risk", category: "high" as const };
    if (fraxCategory === "moderate") return { label: "Moderate clinical risk", category: "moderate" as const };
    if (fraxCategory === "low") return { label: "Low numerical FRAX category", category: "low" as const };
    return { label: "Clinical classification required", category: "not_assigned" as const };
  }, [fraxVerified, input.fractureHistoryComplete, hasBlockingFlag, fraxCategory]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Clinical Fracture Risk Review</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={reset} className="gap-1">
          <RotateCcw className="h-4 w-4" /> Reset
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bone className="h-4 w-4" />
            FRAX probability
          </CardTitle>
          <CardDescription>Enter a verified FRAX result. Keep the probability separate from clinical risk flags.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="frax-major">10-year major osteoporotic (%)</Label>
              <Input
                id="frax-major"
                type="number"
                min={0}
                max={100}
                value={input.frax.majorOsteoporoticPercent}
                onChange={(e) => updateFrax({ majorOsteoporoticPercent: e.target.value === "" ? "" : Number(e.target.value) })}
                placeholder="e.g., 15"
              />
            </div>
            <div>
              <Label htmlFor="frax-hip">10-year hip fracture (%)</Label>
              <Input
                id="frax-hip"
                type="number"
                min={0}
                max={100}
                value={input.frax.hipPercent}
                onChange={(e) => updateFrax({ hipPercent: e.target.value === "" ? "" : Number(e.target.value) })}
                placeholder="e.g., 4"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="frax-source">Source</Label>
              <Select
                value={input.frax.source}
                onValueChange={(v) => updateFrax({ source: v as FraxInput["source"] })}
              >
                <SelectTrigger id="frax-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="official_frax_manual_entry">Official FRAX manual entry</SelectItem>
                  <SelectItem value="authorized_frax_integration">Authorized FRAX integration</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                  <SelectItem value="not_available">Not available</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="frax-bmd">Femoral-neck BMD included?</Label>
              <Select
                value={input.frax.femoralNeckBmdIncluded}
                onValueChange={(v) => updateFrax({ femoralNeckBmdIncluded: v as FraxInput["femoralNeckBmdIncluded"] })}
              >
                <SelectTrigger id="frax-bmd">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="frax-country">Country model</Label>
              <Input
                id="frax-country"
                value={input.frax.countryModel}
                onChange={(e) => updateFrax({ countryModel: e.target.value })}
                placeholder="e.g., India"
              />
            </div>
          </div>
          {!fraxVerified && (
            <p className="text-xs text-amber-600 dark:text-amber-400">A verified FRAX source is required before the probability can be considered confirmed.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Fracture history
          </CardTitle>
          <CardDescription>Record each distinct fracture. Do not treat unknown history as negative.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Is fracture history complete?</Label>
            <RadioGroup
              value={input.fractureHistoryComplete}
              onValueChange={(v) => setInput((p) => ({ ...p, fractureHistoryComplete: v as ClinicalRiskInput["fractureHistoryComplete"] }))}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center gap-2"><RadioGroupItem value="yes" id="fx-complete-yes" /><Label htmlFor="fx-complete-yes" className="font-normal">Yes</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="no" id="fx-complete-no" /><Label htmlFor="fx-complete-no" className="font-normal">No</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="unknown" id="fx-complete-unknown" /><Label htmlFor="fx-complete-unknown" className="font-normal">Unknown</Label></div>
            </RadioGroup>
          </div>

          {input.fractureHistory.map((fx) => (
            <div key={fx.id} className="rounded-lg border p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm font-medium">Fracture</Label>
                <Button variant="ghost" size="sm" onClick={() => removeFracture(fx.id)}>Remove</Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Site</Label>
                  <Select value={fx.site} onValueChange={(v) => updateFracture(fx.id, { site: v as FractureEntry["site"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(SITE_LABELS).map(([k, label]) => (
                        <SelectItem key={k} value={k}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Fragility fracture?</Label>
                  <Select value={fx.fragilityFracture} onValueChange={(v) => updateFracture(fx.id, { fragilityFracture: v as FractureEntry["fragilityFracture"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="uncertain">Uncertain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {fx.site === "vertebral" && (
                  <>
                    <div>
                      <Label className="text-xs">Vertebral presentation</Label>
                      <Select value={fx.vertebralPresentation} onValueChange={(v) => updateFracture(fx.id, { vertebralPresentation: v as FractureEntry["vertebralPresentation"] })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="clinical">Clinical</SelectItem>
                          <SelectItem value="imaging_detected">Imaging-detected</SelectItem>
                          <SelectItem value="unknown">Unknown</SelectItem>
                          <SelectItem value="not_applicable">Not applicable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Vertebral severity</Label>
                      <Select value={fx.vertebralSeverity} onValueChange={(v) => updateFracture(fx.id, { vertebralSeverity: v as FractureEntry["vertebralSeverity"] })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mild">Mild</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="severe">Severe</SelectItem>
                          <SelectItem value="unknown">Unknown</SelectItem>
                          <SelectItem value="not_applicable">Not applicable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                <div>
                  <Label className="text-xs">Date</Label>
                  <Input type="date" value={fx.date || ""} onChange={(e) => updateFracture(fx.id, { date: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Occurred during osteoporosis treatment?</Label>
                  <Select value={fx.occurredDuringTreatment} onValueChange={(v) => updateFracture(fx.id, { occurredDuringTreatment: v as FractureEntry["occurredDuringTreatment"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={addFracture}>Add fracture</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Falls and additional clinical flags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="falls-count">Falls in past 12 months</Label>
              <Input
                id="falls-count"
                type="number"
                min={0}
                value={input.fallsInPast12Months}
                onChange={(e) => setInput((p) => ({ ...p, fallsInPast12Months: e.target.value === "" ? "" : Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label>Injurious fall?</Label>
              <Select value={input.injuriousFallInPast12Months} onValueChange={(v) => setInput((p) => ({ ...p, injuriousFallInPast12Months: v as ClinicalRiskInput["injuriousFallInPast12Months"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>High falls risk (clinician-identified)?</Label>
              <Select value={input.clinicianIdentifiedHighFallsRisk} onValueChange={(v) => setInput((p) => ({ ...p, clinicianIdentifiedHighFallsRisk: v as ClinicalRiskInput["clinicianIdentifiedHighFallsRisk"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Confirmed fragility fractures</p>
              <p className="text-2xl font-semibold">{confirmedFragilityCount}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">FRAX category</p>
              <p className="text-2xl font-semibold capitalize">{fraxCategory ?? "—"}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Overall risk</p>
              <p className="text-2xl font-semibold">{overallCategory.label}</p>
            </div>
          </div>

          {reviewMessages.length > 0 && (
            <div className="space-y-2">
              {reviewMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
                    msg.priority === "prompt"
                      ? "border-rose-200 bg-rose-50 dark:bg-rose-950/30"
                      : msg.priority === "clinical_review"
                      ? "border-amber-200 bg-amber-50 dark:bg-amber-950/30"
                      : "border-blue-200 bg-blue-50 dark:bg-blue-950/30"
                  }`}
                >
                  {msg.priority === "prompt" ? <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" /> : <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />}
                  <span>{msg.text}</span>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm space-y-1">
            <p className="font-medium">Validation safeguards</p>
            <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">
              <li>Reject future fracture dates.</li>
              <li>Do not treat unknown answers as negative clinical findings.</li>
              <li>An empty fracture list does not confirm absence of fractures unless history is marked complete.</li>
              <li>Require verified FRAX source before labelling results confirmed.</li>
              <li>Do not substitute total-hip or lumbar-spine measurements for femoral-neck input in standard FRAX.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
