import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageViewerProvider, useImageViewer } from "@/components/ImageViewer";
import { AlertCircle, Bone, Info, Stethoscope, Droplets, FlaskConical, AlertTriangle, Activity, Microscope, ClipboardList, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Term } from "@/lib/glossary";
import avnAsset from "@/assets/avascular-necrosis.png.asset.json";

function AvnQuiz() {
  const [pain, setPain] = useState<string | null>(null);
  const [imaging, setImaging] = useState<string | null>(null);

  const getResult = () => {
    if (imaging === "crescent" || imaging === "collapse") return { stage: "Stage III / IV (Advanced)", description: "Bone structural failure has occurred.", advice: "Orthopedic referral for joint-preserving surgery or replacement." };
    if (imaging === "sclerosis") return { stage: "Stage II (Early-Intermediate)", description: "Bone remodeling is visible but shape is maintained.", advice: "Core decompression may be considered." };
    if (imaging === "normal-mri" || (pain === "stress" && imaging === "normal")) return { stage: "Stage I (Early)", description: "Clinical symptoms present but X-rays are normal.", advice: "Urgent MRI required to confirm diagnosis." };
    if (imaging === "normal") return { stage: "Stage 0 (Pre-clinical)", description: "Asymptomatic with high-risk factors.", advice: "Monitoring and risk factor modification." };
    return null;
  };

  const result = getResult();

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          AVN Staging Self-Check
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Pain Character</Label>
          <RadioGroup onValueChange={setPain} className="grid grid-cols-1 gap-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="none" id="p-none" />
              <Label htmlFor="p-none" className="text-xs text-foreground/90">No pain</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="stress" id="p-stress" />
              <Label htmlFor="p-stress" className="text-xs text-foreground/90">Pain only with weight-bearing</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="rest" id="p-rest" />
              <Label htmlFor="p-rest" className="text-xs text-foreground/90">Constant pain / pain at rest</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-semibold">Imaging Findings (Best Available)</Label>
          <RadioGroup onValueChange={setImaging} className="grid grid-cols-1 gap-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="normal" id="i-normal" />
              <Label htmlFor="i-normal" className="text-xs text-foreground/90">Normal X-ray</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="normal-mri" id="i-mri" />
              <Label htmlFor="i-mri" className="text-xs text-foreground/90">Abnormal MRI / Bone Scan (X-ray normal)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sclerosis" id="i-scler" />
              <Label htmlFor="i-scler" className="text-xs text-foreground/90">X-ray: Sclerosis or cystic changes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="crescent" id="i-cres" />
              <Label htmlFor="i-cres" className="text-xs text-foreground/90">X-ray: 'Crescent sign' (subchondral break)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="collapse" id="i-coll" />
              <Label htmlFor="i-coll" className="text-xs text-foreground/90">X-ray: Flattening / Articular collapse</Label>
            </div>
          </RadioGroup>
        </div>

        {result && (
          <div className="p-4 rounded-lg bg-background border border-primary/30 animate-in zoom-in-95 duration-200">
            <h4 className="font-bold text-primary flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Assessment: {result.stage}
            </h4>
            <p className="text-xs mt-1 text-foreground/80">{result.description}</p>
            <div className="mt-3 p-2 bg-primary/10 rounded text-[10px] font-medium text-primary-foreground/90 bg-primary/90">
              Guidance: {result.advice}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AvnContent() {
  const { open: openViewer } = useImageViewer();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-display font-bold tracking-tight text-foreground flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[oklch(0.94_0.10_260)] text-[oklch(0.40_0.18_260)] dark:bg-[oklch(0.32_0.10_260)] dark:text-[oklch(0.90_0.10_260)] shadow-sm">
            <Bone className="h-6 w-6" />
          </div>
          Avascular Necrosis (AVN)
        </h2>
        <p className="text-muted-foreground text-lg leading-relaxed max-w-3xl">
          Clinical guide for the diagnosis, staging, and management of osteonecrosis.
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="overview">Overview & Etiology</TabsTrigger>
          <TabsTrigger value="diagnosis">Diagnosis & Staging</TabsTrigger>
          <TabsTrigger value="treatment">Treatment Guidance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
            <CardHeader className="border-b border-border/10 bg-muted/5 pb-4">
              <CardTitle className="text-xl font-display font-semibold flex items-center gap-2">
                <Info className="h-5 w-5 text-primary/70" />
                Pathophysiology & Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="space-y-4">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-base text-foreground/90 leading-relaxed">
                      Avascular Necrosis (AVN), also known as <Term term="BMD">osteonecrosis</Term>, occurs when bone tissue dies due to a temporary or permanent loss of blood supply. This can lead to tiny breaks in the bone and the bone's eventual collapse.
                    </p>
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Key Stages of Progression</h4>
                    <ul className="space-y-2 text-foreground/80 list-none pl-0">
                      <li className="flex items-start gap-2 text-foreground/90">
                        <span className="font-bold text-primary min-w-[1.5rem]">1.</span>
                        <span><strong>No Blood:</strong> Trauma or blockage disrupts blood vessels.</span>
                      </li>
                      <li className="flex items-start gap-2 text-foreground/90">
                        <span className="font-bold text-primary min-w-[1.5rem]">2.</span>
                        <span><strong>Bone Dies:</strong> Bone tissue begins to die due to lack of nutrients.</span>
                      </li>
                      <li className="flex items-start gap-2 text-foreground/90">
                        <span className="font-bold text-primary min-w-[1.5rem]">3.</span>
                        <span><strong>Bone Weakens:</strong> The internal structure fails and micro-fractures occur.</span>
                      </li>
                      <li className="flex items-start gap-2 text-foreground/90">
                        <span className="font-bold text-primary min-w-[1.5rem]">4.</span>
                        <span><strong>Collapse:</strong> The articular surface collapses, leading to severe joint destruction.</span>
                      </li>
                    </ul>
                  </div>
                  
                  <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="font-semibold">Clinical Warning</AlertTitle>
                    <AlertDescription className="text-xs">
                      A bone is ALIVE and needs constant blood flow. Without it, structural integrity is lost within weeks, though X-ray findings may lag by months.
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="flex justify-center w-full">
                  <div className="rounded-xl overflow-hidden border border-border/30 bg-background/50 p-2 shadow-inner group relative max-w-md">
                    <img
                      src={avnAsset.url} 
                      alt="Avascular Necrosis (AVN) Pathophysiology and Causes" 
                      className="w-full h-auto rounded-lg shadow-sm group-hover:opacity-95 transition-opacity cursor-zoom-in"
                      onClick={() => openViewer(avnAsset.url, "Avascular Necrosis (AVN) Pathophysiology and Causes")}
                    />
                    <div className="mt-2 text-[10px] text-center text-muted-foreground italic">
                      '''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''
                                                              
                                                                  
                                                                  
                      Enable drag-to-pan behavior on the zoomable image so I can move it smoothly while zoomed.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border/50 bg-card/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-indigo-500" />
                  Common Sites
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-foreground/80">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    <strong>Femoral Head:</strong> Most common (hip pain)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    <strong>Scaphoid:</strong> Post-trauma wrist pain
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    <strong>Talus:</strong> Ankle (weight-bearing)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    <strong>Humeral Head:</strong> Shoulder (less common)
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-amber-500" />
                  Classic Causes (SATS)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-start gap-2 text-xs">
                      <div className="font-bold text-amber-600 min-w-[50px]">Steroids</div>
                      <div className="text-muted-foreground italic">Marrow fat-cell enlargement</div>
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <div className="font-bold text-amber-600 min-w-[50px]">Alcohol</div>
                      <div className="text-muted-foreground italic">Impaired microcirculation</div>
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <div className="font-bold text-amber-600 min-w-[50px]">Trauma</div>
                      <div className="text-muted-foreground italic">Vessels physically disrupted</div>
                    </div>
                    <div className="flex items-start gap-2 text-xs">
                      <div className="font-bold text-amber-600 min-w-[50px]">Sickle Cell</div>
                      <div className="text-muted-foreground italic">Microvascular occlusion</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 shadow-sm border-l-4 border-l-red-500/50">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  NOF → NO FLOW
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-foreground/80 space-y-2">
                  <p>
                    <strong>Neck of Femur (NOF)</strong> fractures are surgical emergencies due to the high risk of AVN.
                  </p>
                  <div className="p-3 bg-red-500/5 rounded-lg border border-red-500/10 text-xs">
                    Intracapsular fractures are particularly vulnerable as they damage the retrograde blood supply to the head.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="diagnosis" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AvnQuiz />
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                    <Microscope className="h-5 w-5 text-blue-500" />
                    Diagnostic Pathway
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg border bg-blue-500/5 border-blue-500/20">
                    <h5 className="font-bold text-sm mb-1 text-foreground">1. Plain X-Ray</h5>
                    <p className="text-xs text-muted-foreground">Often normal in early stages. Look for 'Crescent Sign' (subchondral lucency) in later stages.</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-purple-500/5 border-purple-500/20">
                    <h5 className="font-bold text-sm mb-1 text-foreground">2. MRI (Gold Standard)</h5>
                    <p className="text-xs text-muted-foreground">Highest sensitivity. Look for 'double-line sign' on T2-weighted images.</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-amber-500/5 border-amber-500/20">
                    <h5 className="font-bold text-sm mb-1 text-foreground">3. CT Scan</h5>
                    <p className="text-xs text-muted-foreground">Better for assessing the degree of collapse and structural planning.</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                    <Activity className="h-5 w-5 text-emerald-500" />
                    Staging System (Ficat & Arlet)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { s: "Stage I", d: "Normal X-ray, abnormal MRI/Bone scan" },
                      { s: "Stage II", d: "X-ray abnormalities (sclerosis/cysts) without collapse" },
                      { s: "Stage III", d: "Subchondral collapse (Crescent sign)" },
                      { s: "Stage IV", d: "Flattening of femoral head and joint space narrowing" },
                    ].map((stage, i) => (
                      <div key={i} className="flex justify-between items-center text-xs border-b pb-2 last:border-0 last:pb-0">
                        <span className="font-bold text-foreground">{stage.s}</span>
                        <span className="text-muted-foreground">{stage.d}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="treatment" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground">Non-Surgical Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold text-foreground">1. Protected Weight Bearing</h5>
                  <p className="text-xs text-muted-foreground">Using crutches or walkers to reduce stress on the dying bone. Low success rate as sole therapy.</p>
                </div>
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold text-foreground">2. Pharmacotherapy</h5>
                  <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1">
                    <li className="text-foreground/80"><strong className="text-foreground">Bisphosphonates:</strong> May slow bone resorption and prevent collapse.</li>
                    <li className="text-foreground/80"><strong className="text-foreground">Statins:</strong> Potentially reduces marrow fat-cell size in steroid-induced AVN.</li>
                    <li className="text-foreground/80"><strong className="text-foreground">Anticoagulants:</strong> If thrombophilia is the underlying cause.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground">Surgical Interventions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold text-emerald-600">Core Decompression (Early Stages)</h5>
                  <p className="text-xs text-muted-foreground text-foreground/80">Drilling a hole into the dead bone to relieve pressure and allow new blood vessels to grow.</p>
                </div>
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold text-emerald-600">Osteotomy</h5>
                  <p className="text-xs text-muted-foreground text-foreground/80">Cutting the bone to shift the weight-bearing load from the dead bone to healthy bone.</p>
                </div>
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold text-emerald-600 text-foreground">Total Joint Replacement (Late Stages)</h5>
                  <p className="text-xs text-muted-foreground text-foreground/80">Replacing the damaged joint with a prosthesis. High success rate for advanced collapse.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert className="bg-amber-500/5 border-amber-500/20">
            <Info className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-sm font-semibold text-foreground">Prognostic Factors</AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground">
              Survival of the femoral head depends on the <strong className="text-foreground">size</strong> and <strong className="text-foreground">location</strong> of the lesion. Lesions involving {">"}30% of the weight-bearing surface have an 80% risk of collapse within 2 years without intervention.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>

      <Card className="border-border/50 bg-card/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2 text-foreground">
            <Droplets className="h-5 w-5 text-blue-500" />
            Mechanism Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-background/40 border border-border/50">
              <h5 className="font-bold text-sm mb-1 text-foreground">Vessel Cut</h5>
              <p className="text-xs text-muted-foreground italic">Trauma / Fracture</p>
            </div>
            <div className="p-4 rounded-xl bg-background/40 border border-border/50">
              <h5 className="font-bold text-sm mb-1 text-foreground">Vessel Blocked</h5>
              <p className="text-xs text-muted-foreground italic">Sickle Cell / Thrombi</p>
            </div>
            <div className="p-4 rounded-xl bg-background/40 border border-border/50">
              <h5 className="font-bold text-sm mb-1 text-foreground">Vessel Squeezed</h5>
              <p className="text-xs text-muted-foreground italic">Steroids / Gaucher's</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AvnApp() {
  return (
    <ImageViewerProvider>
      <AvnContent />
    </ImageViewerProvider>
  );
}
