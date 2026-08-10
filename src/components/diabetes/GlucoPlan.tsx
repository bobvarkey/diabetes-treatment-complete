import React, { useState, useMemo } from 'react';
import { 
  Clipboard, Printer, AlertTriangle, Info, User, Calendar, 
  Activity, Heart, Shield, RefreshCcw, CheckCircle2, 
  ChevronRight, Stethoscope, Beaker, FileText, Scale, Settings, Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Types based on the provided JSON schema
type DiabetesType = 'type1' | 'type2' | 'other' | 'uncertain' | 'prediabetes';
type PregnancyStatus = 'notPregnant' | 'pregnant' | 'postpartum' | 'unknown';
type FrailtyStatus = 'none' | 'mild' | 'moderate' | 'severe' | 'unknown';

interface PatientProfile {
  patientId: string;
  dateOfBirth: string;
  diabetesType: DiabetesType;
  pregnancyStatus: PregnancyStatus;
  heightCm: number;
  weightKg: number;
  systolicBP: number;
  diastolicBP: number;
  comorbidities: string[];
  frailtyStatus: FrailtyStatus;
  socialFactors: string[];
}

export default function GlucoPlan() {
  const [localization, setLocalization] = useState({
    region: 'Standard',
    a1cTargetBase: 7.0,
    bpTargetSystolic: 130,
    bpTargetDiastolic: 80,
    egfrMetforminCutoff: 30,
    egfrSglt2iStartCutoff: 20,
    requireAltForStatins: false,
    useUacrForCkdScreening: true
  });

  const [profile, setProfile] = useState<PatientProfile>({
    patientId: '',
    dateOfBirth: '',
    diabetesType: 'type2',
    pregnancyStatus: 'notPregnant',
    heightCm: 0,
    weightKg: 0,
    systolicBP: 0,
    diastolicBP: 0,
    comorbidities: [],
    frailtyStatus: 'none',
    socialFactors: [],
  });

  const [labValues, setLabValues] = useState({
    hba1c: '',
    glucose: '',
    egfr: '',
    uacr: '',
    alt: '',
    ldl: '',
  });

  const bmi = useMemo(() => {
    if (profile.heightCm > 0 && profile.weightKg > 0) {
      const heightM = profile.heightCm / 100;
      return (profile.weightKg / (heightM * heightM)).toFixed(1);
    }
    return null;
  }, [profile.heightCm, profile.weightKg]);

  const recommendations = useMemo(() => {
    const rules = [];
    const missing = [];
    
    // Evaluate individual targets using localization settings
    let a1cTarget = localization.a1cTargetBase;
    if (profile.frailtyStatus === 'mild' || profile.frailtyStatus === 'moderate') a1cTarget = 8.0;
    if (profile.frailtyStatus === 'severe') a1cTarget = 8.5;
    if (profile.pregnancyStatus === 'pregnant') a1cTarget = 6.0;

    const currentA1c = parseFloat(labValues.hba1c);
    const egfrValue = parseFloat(labValues.egfr);

    // Intensification/Deintensification
    if (currentA1c > a1cTarget + 0.5) {
      rules.push({
        type: 'intensify',
        message: `HbA1c (${currentA1c}%) is above target (${a1cTarget}%). Consider treatment intensification.`,
        severity: 'high'
      });
    } else if (currentA1c < a1cTarget - 1.0 && currentA1c > 0) {
      rules.push({
        type: 'deintensify',
        message: `HbA1c (${currentA1c}%) is significantly below target. Evaluate for over-treatment or hypoglycemia risk.`,
        severity: 'medium'
      });
    }

    // Comorbidity-based guidance
    if (profile.comorbidities.includes('ASCVD') || profile.comorbidities.includes('heartFailure') || profile.comorbidities.includes('CKD')) {
      rules.push({
        type: 'protection',
        message: "Organ protection: Prioritize SGLT2i or GLP-1RA with proven CV/Renal benefits regardless of HbA1c.",
        severity: 'high'
      });
    }

    if (egfrValue < localization.egfrMetforminCutoff && egfrValue > 0) {
      rules.push({
        type: 'safety',
        message: `Localization Alert: Severe CKD (eGFR <${localization.egfrMetforminCutoff}). Avoid Metformin per local policy.`,
        severity: 'urgent'
      });
    }

    if (egfrValue < localization.egfrSglt2iStartCutoff && egfrValue > 0) {
      rules.push({
        type: 'safety',
        message: `Localization Alert: SGLT2i initiation threshold (eGFR <${localization.egfrSglt2iStartCutoff}) reached.`,
        severity: 'high'
      });
    }

    // Missing data warnings
    if (!labValues.hba1c) missing.push("HbA1c");
    if (!labValues.egfr) missing.push("eGFR");
    if (localization.useUacrForCkdScreening && !labValues.uacr) missing.push("Urine ACR (CKD screening)");
    if (localization.requireAltForStatins && !labValues.alt) missing.push("Liver function (ALT) for statin safety");
    if (profile.comorbidities.includes('liverDisease') && !labValues.alt) missing.push("Liver function (ALT) for comorbidity");

    return { rules, missing, a1cTarget };
  }, [profile, labValues, localization]);

  const toggleArrayField = (field: 'comorbidities' | 'socialFactors', value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const copyReport = () => {
    const report = `GlucoPlan Clinical Report\nPatient ID: ${profile.patientId}\nType: ${profile.diabetesType}\nBMI: ${bmi || 'N/A'}\nBP: ${profile.systolicBP}/${profile.diastolicBP}\nHbA1c: ${labValues.hba1c}%\neGFR: ${labValues.egfr}\nTarget A1c: ${recommendations.a1cTarget}%`;
    navigator.clipboard.writeText(report);
    toast.success("Report copied to clipboard");
  };

  const isDataMissing = !profile.diabetesType || !labValues.hba1c || !labValues.egfr;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">GlucoPlan</h1>
          <p className="text-muted-foreground">Clinical decision support · ADA 2026 Standards</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyReport} className="h-9">
            <Clipboard className="mr-2 h-4 w-4" /> Copy Report
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="h-9">
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-900/10">
        <div className="flex gap-3 text-amber-800 dark:text-amber-200">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-xs leading-relaxed">
            <strong>Disclaimer:</strong> This program supports but does not replace clinician assessment, prescribing, local protocols, or emergency care. Guideline: ADA 2026.
          </p>
        </div>
      </div>

      <Tabs defaultValue="intake" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="intake">Intake</TabsTrigger>
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
          <TabsTrigger value="plan">Management</TabsTrigger>
          <TabsTrigger value="safety">Safety</TabsTrigger>
        </TabsList>

        <TabsContent value="intake" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" /> Patient Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patientId">Patient ID</Label>
                    <Input 
                      id="patientId" 
                      value={profile.patientId} 
                      onChange={e => setProfile({...profile, patientId: e.target.value})}
                      placeholder="e.g. MRN123"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input 
                      id="dob" 
                      type="date"
                      value={profile.dateOfBirth} 
                      onChange={e => setProfile({...profile, dateOfBirth: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Diabetes Type</Label>
                    <Select value={profile.diabetesType} onValueChange={v => setProfile({...profile, diabetesType: v as DiabetesType})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="type1">Type 1</SelectItem>
                        <SelectItem value="type2">Type 2</SelectItem>
                        <SelectItem value="prediabetes">Prediabetes</SelectItem>
                        <SelectItem value="uncertain">Uncertain</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Pregnancy Status</Label>
                    <Select value={profile.pregnancyStatus} onValueChange={v => setProfile({...profile, pregnancyStatus: v as PregnancyStatus})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="notPregnant">Not Pregnant</SelectItem>
                        <SelectItem value="pregnant">Pregnant</SelectItem>
                        <SelectItem value="postpartum">Postpartum</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label>Height (cm)</Label>
                    <Input type="number" value={profile.heightCm || ''} onChange={e => setProfile({...profile, heightCm: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Weight (kg)</Label>
                    <Input type="number" value={profile.weightKg || ''} onChange={e => setProfile({...profile, weightKg: Number(e.target.value)})} />
                  </div>
                </div>
                {bmi && (
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Badge variant="outline" className="bg-primary/5">BMI: {bmi} kg/m²</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-primary" /> Clinical Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Systolic BP</Label>
                    <Input type="number" value={profile.systolicBP || ''} onChange={e => setProfile({...profile, systolicBP: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Diastolic BP</Label>
                    <Input type="number" value={profile.diastolicBP || ''} onChange={e => setProfile({...profile, diastolicBP: Number(e.target.value)})} />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Comorbidities</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['ASCVD', 'heartFailure', 'CKD', 'obesity', 'retinopathy', 'neuropathy', 'liverDisease'].map(item => (
                      <div key={item} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`comorb-${item}`} 
                          checked={profile.comorbidities.includes(item)}
                          onCheckedChange={() => toggleArrayField('comorbidities', item)}
                        />
                        <label htmlFor={`comorb-${item}`} className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize">
                          {item.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Frailty Status</Label>
                  <Select value={profile.frailtyStatus} onValueChange={v => setProfile({...profile, frailtyStatus: v as FrailtyStatus})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="mild">Mild</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assessment" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Beaker className="h-5 w-5 text-primary" /> Laboratory Data
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>HbA1c (%)</Label>
                  <Input type="number" step="0.1" value={labValues.hba1c} onChange={e => setLabValues({...labValues, hba1c: e.target.value})} placeholder="7.0" />
                </div>
                <div className="space-y-2">
                  <Label>eGFR (mL/min/1.73m²)</Label>
                  <Input type="number" value={labValues.egfr} onChange={e => setLabValues({...labValues, egfr: e.target.value})} placeholder=">60" />
                </div>
                <div className="space-y-2">
                  <Label>Plasma Glucose (mg/dL)</Label>
                  <Input type="number" value={labValues.glucose} onChange={e => setLabValues({...labValues, glucose: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Urine ACR (mg/g)</Label>
                  <Input type="number" value={labValues.uacr} onChange={e => setLabValues({...labValues, uacr: e.target.value})} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-primary" /> Targets (ADA 2026)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">HbA1c Target</span>
                    <span className="font-bold text-primary">{"<"}7.0%</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Preprandial</span>
                    <span>80–130 mg/dL</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Postprandial (1-2h)</span>
                    <span>{"<"}180 mg/dL</span>
                  </div>
                </div>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  <p>Individualize based on age, life expectancy, comorbidities, and hypoglycemia risk.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Screening & Classification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  "Retinal examination",
                  "Comprehensive foot exam",
                  "Neuropathy assessment",
                  "Kidney disease assessment",
                  "ASCVD risk calculation",
                  "Depression screening"
                ].map(check => (
                  <div key={check} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>{check}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              {isDataMissing && (
                <div className="rounded-xl border border-dashed border-muted-foreground/25 p-8 text-center bg-muted/20">
                  <AlertTriangle className="mx-auto h-10 w-10 text-muted-foreground/50" />
                  <h3 className="mt-4 text-md font-medium">Limited Analysis</h3>
                  <p className="text-xs text-muted-foreground">Some recommendations are hidden due to missing core data (Type, HbA1c, eGFR).</p>
                </div>
              )}

              <Card className="border-l-4 border-l-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-primary" /> Personalized Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recommendations.rules.length > 0 ? (
                    <div className="space-y-3">
                      {recommendations.rules.map((rule, idx) => (
                        <div 
                          key={idx} 
                          className={cn(
                            "flex gap-3 p-3 rounded-lg border",
                            rule.severity === 'high' ? "bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30" :
                            rule.severity === 'urgent' ? "bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30" :
                            "bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30"
                          )}
                        >
                          <Info className={cn(
                            "h-5 w-5 shrink-0",
                            rule.severity === 'high' ? "text-red-600" :
                            rule.severity === 'urgent' ? "text-amber-600" : "text-blue-600"
                          )} />
                          <p className="text-sm font-medium">{rule.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span>Glycemic and safety parameters are currently stable or require more data for specific alerts.</span>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" /> Follow-up & Monitoring
                    </h4>
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2 text-sm">
                        <ChevronRight className="h-4 w-4 text-primary" />
                        <span>{parseFloat(labValues.hba1c) > recommendations.a1cTarget ? "Target not met: Reassess in ~3 months" : "Stable: HbA1c at least twice yearly"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <ChevronRight className="h-4 w-4 text-primary" />
                        <span>Review renal function (eGFR: {labValues.egfr || 'N/A'}) at next visit</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-primary" /> Shared Decision Making
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Lifestyle Pillars</Label>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Medical Nutrition Therapy</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Physical Activity</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> DSMES Enrollment</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Individual Priorities</Label>
                      <ul className="space-y-1 text-sm">
                        <li>• Hypoglycemia avoidance</li>
                        <li>• Weight management goals</li>
                        <li>• Cost & access barriers</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider">Clinical Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">HbA1c Target</p>
                    <p className="text-2xl font-display font-bold text-primary">{recommendations.a1cTarget}%</p>
                    <p className="text-[10px] text-muted-foreground">Individualized based on frailty/pregnancy</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Missing Data</p>
                    {recommendations.missing.length > 0 ? (
                      <div className="space-y-1">
                        {recommendations.missing.map(m => (
                          <div key={m} className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="h-3 w-3" />
                            <span>{m}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-green-600 font-medium">All core parameters present</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="rounded-xl border bg-muted/50 p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Info className="h-3 w-3" /> Quick Reference
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Target BP</span>
                    <span className="font-semibold">{"<"}130/80</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target LDL</span>
                    <span className="font-semibold">{"<"}70 or 55</span>
                  </div>
                  <div className="flex justify-between">
                    <span>eGFR SGLT2i cut-off</span>
                    <span className="font-semibold">20 mL/min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="safety" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-red-200 bg-red-50/30 dark:border-red-900/50 dark:bg-red-900/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
                  <AlertTriangle className="h-5 w-5" /> Urgent Safety Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { id: "dk", label: "Possible DKA", triggers: "Ketones, vomiting, Kussmaul breathing" },
                    { id: "hhs", label: "Hyperosmolar State", triggers: "Marked hyperglycemia, dehydration, altered mental status" },
                    { id: "hypo", label: "Severe Hypoglycemia", triggers: "Seizure, loss of consciousness" }
                  ].map(alert => (
                    <div key={alert.id} className="rounded-lg border border-red-200 bg-white p-3 dark:border-red-800 dark:bg-slate-950">
                      <p className="text-sm font-bold text-red-600 dark:text-red-400">{alert.label}</p>
                      <p className="text-xs text-muted-foreground">Triggers: {alert.triggers}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-tight text-red-700 dark:text-red-300">Action: Urgent Emergency Evaluation</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" /> Hypoglycemia Protocol
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Level 1</span>
                    <Badge variant="outline">{"<"}70 mg/dL</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Level 2</span>
                    <Badge variant="outline" className="text-orange-600">{"<"}54 mg/dL</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Level 3</span>
                    <Badge variant="destructive">Severe / Requires Assistance</Badge>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Immediate Actions:</p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• Treat with fast-acting carbohydrates (15g)</li>
                    <li>• Recheck glucose in 15 minutes</li>
                    <li>• Use glucagon for Level 3 events</li>
                    <li>• Deintensify therapy if Level 2/3 occurs</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="text-center text-[10px] text-muted-foreground/60 uppercase tracking-widest mt-12">
        GlucoPlan Engine v1.0.0 • ADA 2026 Reference Implementation
      </div>
    </div>
  );
}
