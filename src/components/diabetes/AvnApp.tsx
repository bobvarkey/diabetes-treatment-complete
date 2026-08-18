import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageViewerProvider, useImageViewer } from "@/components/ImageViewer";
import { AlertCircle, Bone, Info, Stethoscope, Droplets, FlaskConical, AlertTriangle, Search, Activity, Microscope, ClipboardList, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Term } from "@/lib/glossary";
import avnAsset from "@/assets/avascular-necrosis.png.asset.json";

function AvnQuiz() {
  const [pain, setPain] = useState<string | null>(null);
  const [mobility, setMobility] = useState<string | null>(null);
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
              <Label htmlFor="p-none" className="text-xs">No pain</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="stress" id="p-stress" />
              <Label htmlFor="p-stress" className="text-xs">Pain only with weight-bearing</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="rest" id="p-rest" />
              <Label htmlFor="p-rest" className="text-xs">Constant pain / pain at rest</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-semibold">Imaging Findings (Best Available)</Label>
          <RadioGroup onValueChange={setImaging} className="grid grid-cols-1 gap-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="normal" id="i-normal" />
              <Label htmlFor="i-normal" className="text-xs">Normal X-ray</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="normal-mri" id="i-mri" />
              <Label htmlFor="i-mri" className="text-xs">Abnormal MRI / Bone Scan (X-ray normal)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sclerosis" id="i-scler" />
              <Label htmlFor="i-scler" className="text-xs">X-ray: Sclerosis or cystic changes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="crescent" id="i-cres" />
              <Label htmlFor="i-cres" className="text-xs">X-ray: 'Crescent sign' (subchondral break)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="collapse" id="i-coll" />
              <Label htmlFor="i-coll" className="text-xs">X-ray: Flattening / Articular collapse</Label>
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
          Clinical guide for the diagnosis, etiology, and management of osteonecrosis due to interrupted blood supply.
        </p>
      </div>

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
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary min-w-[1.5rem]">1.</span>
                    <span><strong>No Blood:</strong> Trauma or blockage disrupts blood vessels.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary min-w-[1.5rem]">2.</span>
                    <span><strong>Bone Dies:</strong> Bone tissue begins to die due to lack of nutrients.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary min-w-[1.5rem]">3.</span>
                    <span><strong>Bone Weakens:</strong> The internal structure fails and micro-fractures occur.</span>
                  </li>
                  <li className="flex items-start gap-2">
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

            <div className="rounded-xl overflow-hidden border border-border/30 bg-background/50 p-2 shadow-inner group relative">
              <img
                src={avnAsset.url} 
                alt="Avascular Necrosis (AVN) Pathophysiology and Causes" 
                className="w-full h-auto rounded-lg shadow-sm group-hover:opacity-95 transition-opacity cursor-zoom-in"
                onClick={() => openViewer(avnAsset.url, "Avascular Necrosis (AVN) Pathophysiology and Causes")}
              />
              <div className="mt-2 text-[10px] text-center text-muted-foreground italic">
                Infographic: Pathogenesis and vulnerable sites of AVN
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

      <Card className="border-border/50 bg-card/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-500" />
            Mechanism Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-background/40 border border-border/50">
              <h5 className="font-bold text-sm mb-1">Vessel Cut</h5>
              <p className="text-xs text-muted-foreground italic">Trauma / Fracture</p>
            </div>
            <div className="p-4 rounded-xl bg-background/40 border border-border/50">
              <h5 className="font-bold text-sm mb-1">Vessel Blocked</h5>
              <p className="text-xs text-muted-foreground italic">Sickle Cell / Thrombi</p>
            </div>
            <div className="p-4 rounded-xl bg-background/40 border border-border/50">
              <h5 className="font-bold text-sm mb-1">Vessel Squeezed</h5>
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
