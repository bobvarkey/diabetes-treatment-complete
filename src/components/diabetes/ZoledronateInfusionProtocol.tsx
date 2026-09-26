import { useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Droplets, Syringe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Callout, ExportBar, KeyRow, Pill, SectionCard } from "./shared";

const SPECS: { k: string; v: string }[] = [
  { k: "Standard indication", v: "Osteoporosis treatment / prevention" },
  { k: "Target dose", v: "5 mg total, single dose" },
  { k: "Supplied form", v: "Ready-to-infuse solution, 5 mg / 100 mL" },
  { k: "Diluent", v: "None — do not dilute or mix with other solutions" },
  { k: "Infusion duration", v: "Strictly no less than 15 minutes" },
  { k: "Post-infusion flush", v: "10 mL normal saline (0.9% NaCl)" },
];

interface CheckItem {
  id: string;
  label: string;
  detail: string;
  blocking?: boolean;
}

const PRE_INFUSION: CheckItem[] = [
  {
    id: "crcl",
    label: "Renal function verified: CrCl ≥ 35 mL/min (Cockcroft-Gault)",
    detail: "Do not administer if creatinine clearance is below 35 mL/min.",
    blocking: true,
  },
  {
    id: "calcium",
    label: "Serum calcium documented within normal limits",
    detail: "Correct any hypocalcaemia before starting the infusion.",
    blocking: true,
  },
  {
    id: "dental",
    label: "Dental clearance or routine checkup confirmed",
    detail: "Evaluates risk of osteonecrosis of the jaw (ONJ).",
  },
  {
    id: "hydration",
    label: "Hydration baseline: at least 2 glasses of fluid before arrival",
    detail: "Pre-hydration reduces renal and acute-phase risk.",
  },
];

const PREPARATION: CheckItem[] = [
  {
    id: "temp",
    label: "Solution equilibrated to room temperature",
    detail: "If the 100 mL bag/bottle was refrigerated, allow it to warm completely before use.",
  },
  {
    id: "visual",
    label: "Visual inspection: clear, no particulate matter, no discolouration",
    detail: "Discard if any defect is present.",
  },
  {
    id: "line",
    label: "Dedicated, vented intravenous infusion line set up",
    detail: "Zoledronic acid runs on its own line.",
  },
  {
    id: "incompat",
    label: "No calcium-containing solution on the same line",
    detail: "Never allow contact with Lactated Ringer's or other divalent-cation solutions.",
    blocking: true,
  },
];

const ADMINISTRATION: CheckItem[] = [
  {
    id: "access",
    label: "Stable peripheral IV access established and patency verified",
    detail: "Confirm before starting the pump.",
  },
  {
    id: "rate",
    label: "Pump programmed to deliver 100 mL at a constant rate over ≥ 15 minutes",
    detail: "Never shorten the infusion time.",
    blocking: true,
  },
  {
    id: "flush",
    label: "Line flushed with ≥ 10 mL normal saline immediately after the dose",
    detail: "Ensures complete medication delivery.",
  },
  {
    id: "paracetamol",
    label: "Acetaminophen (paracetamol) given per physician orders post-infusion",
    detail: "Mitigates acute-phase reactions — fever, myalgia, arthralgia.",
  },
];

const POST_INFUSION: CheckItem[] = [
  {
    id: "observe",
    label: "Observed 15–30 minutes for immediate hypersensitivity",
    detail: "Keep the patient in the unit for the full observation window.",
    blocking: true,
  },
  {
    id: "fluids",
    label: "Hydration education given for the rest of the day",
    detail: "Maintain oral fluid intake after discharge.",
  },
  {
    id: "counsel",
    label: "Adverse-reaction counselling completed",
    detail:
      "Flu-like symptoms may appear within 24–72 hours. Report severe bone pain, muscle spasms or tingling around the mouth (hypocalcaemia) immediately.",
  },
];

const GROUPS: { title: string; items: CheckItem[] }[] = [
  { title: "1. Pre-infusion screening verification", items: PRE_INFUSION },
  { title: "2. Medication preparation & inspection", items: PREPARATION },
  { title: "3. Administration protocol", items: ADMINISTRATION },
  { title: "4. Post-infusion & discharge safety", items: POST_INFUSION },
];

const ALL_ITEMS = GROUPS.flatMap((g) => g.items);

function CockcroftGault() {
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [creat, setCreat] = useState("");
  const [female, setFemale] = useState(false);

  const crcl = useMemo(() => {
    const a = Number(age);
    const w = Number(weight);
    const c = Number(creat);
    if (!a || !w || !c || a <= 0 || w <= 0 || c <= 0) return null;
    const value = ((140 - a) * w) / (72 * c) * (female ? 0.85 : 1);
    return Math.round(value * 10) / 10;
  }, [age, weight, creat, female]);

  const eligible = crcl === null ? null : crcl >= 35;

  return (
    <div className="rounded-md border border-border p-3">
      <div className="mb-2 text-sm font-semibold">Creatinine clearance check (Cockcroft-Gault)</div>
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="space-y-1">
          <Label htmlFor="zol-age" className="text-xs">Age (years)</Label>
          <Input id="zol-age" inputMode="decimal" value={age} onChange={(e) => setAge(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="zol-wt" className="text-xs">Weight (kg)</Label>
          <Input id="zol-wt" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="zol-cr" className="text-xs">Serum creatinine (mg/dL)</Label>
          <Input id="zol-cr" inputMode="decimal" value={creat} onChange={(e) => setCreat(e.target.value)} />
        </div>
        <div className="flex items-end gap-2 pb-1">
          <Checkbox id="zol-female" checked={female} onCheckedChange={(v) => setFemale(v === true)} />
          <Label htmlFor="zol-female" className="text-xs">Female (×0.85)</Label>
        </div>
      </div>
      <div className="mt-3">
        {crcl === null ? (
          <p className="text-xs text-muted-foreground">Enter age, weight and creatinine to estimate CrCl.</p>
        ) : eligible ? (
          <Callout tone="success" title={`Estimated CrCl ${crcl} mL/min — at or above the 35 mL/min threshold`}>
            Renal criterion met. Still confirm serum calcium, vitamin D status and dental review before infusing.
          </Callout>
        ) : (
          <Callout tone="danger" title={`Estimated CrCl ${crcl} mL/min — below 35 mL/min`}>
            Do not administer zoledronic acid. Discuss an alternative agent with the prescribing clinician.
          </Callout>
        )}
      </div>
    </div>
  );
}

export default function ZoledronateInfusionProtocol() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});

  const toggle = (id: string, value: boolean) => setDone((prev) => ({ ...prev, [id]: value }));
  const completed = ALL_ITEMS.filter((i) => done[i.id]).length;
  const blockingOutstanding = ALL_ITEMS.filter((i) => i.blocking && !done[i.id]);

  return (
    <div ref={rootRef} className="space-y-4">
      <Callout tone="warning" title="Clinical infusion reference — for trained staff">
        Educational reference handout for infusion nursing staff. Always follow local protocol and the
        prescriber's written orders.
      </Callout>

      <div className="rounded-md border border-border p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Syringe className="h-4 w-4" aria-hidden />
          Zoledronic acid (Reclast®) 5 mg — key specification
        </div>
        {SPECS.map((s) => (
          <KeyRow key={s.k} k={s.k} v={s.v} />
        ))}
      </div>

      <Callout tone="danger" title="Critical incompatibility alert">
        Zoledronic acid must never come into contact with calcium-containing solutions (for example Lactated
        Ringer's) or other divalent cations. Use a separate, dedicated vented line.
      </Callout>

      <CockcroftGault />

      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={completed === ALL_ITEMS.length ? "success" : "info"}>
          {completed} / {ALL_ITEMS.length} steps confirmed
        </Pill>
        {blockingOutstanding.length > 0 ? (
          <Pill tone="danger">{blockingOutstanding.length} safety-critical step(s) outstanding</Pill>
        ) : (
          <Pill tone="success">All safety-critical steps confirmed</Pill>
        )}
      </div>

      {GROUPS.map((group) => (
        <div key={group.title} className="rounded-md border border-border p-3">
          <div className="mb-2 text-sm font-semibold">{group.title}</div>
          <ul className="space-y-2.5">
            {group.items.map((item) => (
              <li key={item.id} className="flex items-start gap-2.5">
                <Checkbox
                  id={`zol-${item.id}`}
                  className="mt-0.5"
                  checked={!!done[item.id]}
                  onCheckedChange={(v) => toggle(item.id, v === true)}
                />
                <Label htmlFor={`zol-${item.id}`} className="cursor-pointer text-sm font-normal leading-snug">
                  <span className="font-medium">{item.label}</span>
                  {item.blocking ? <span className="ml-1.5 align-middle"><Pill tone="danger">safety-critical</Pill></span> : null}
                  <span className="block text-xs text-muted-foreground">{item.detail}</span>
                </Label>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <Callout tone="warning" title="Report immediately">
        <ul className="list-disc pl-5">
          <li className="flex-none">Severe bone pain, muscle spasms, or tingling around the mouth — possible hypocalcaemia.</li>
          <li>Rash, breathlessness, wheeze or hypotension during or shortly after the infusion.</li>
          <li>Reduced urine output or rising creatinine after the infusion.</li>
        </ul>
      </Callout>

      <p className="text-xs text-muted-foreground">
        Source: uploaded Zoledronic Acid (Reclast®) Infusion Protocol — clinical reference handout for infusion
        nursing staff. Informational only; confirm against local policy.
      </p>

      <ExportBar title="Zoledronic acid (Reclast) 5 mg infusion protocol" getNode={() => rootRef.current} />
    </div>
  );
}

export function ZoledronateInfusionProtocolSection({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <SectionCard
      id="osteo-zoledronate-infusion"
      title="Zoledronic acid (Reclast®) infusion protocol"
      subtitle="5 mg / 100 mL over ≥ 15 minutes — pre-infusion screening, CrCl check, administration and discharge safety"
      icon={<Droplets className="h-4 w-4" />}
      defaultOpen={defaultOpen}
    >
      <ZoledronateInfusionProtocol />
    </SectionCard>
  );
}

export const ZOLEDRONATE_PROTOCOL_ICONS = { AlertTriangle, CheckCircle2 };
