import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BONE_HEALTH_PROVENANCE,
  BONE_HEALTH_PURPOSE,
  BONE_HEALTH_SAFETY_RULES,
  BONE_HEALTH_SOURCES,
  BONE_HEALTH_TITLE,
  BONE_HEALTH_VALIDATION,
  BONE_HEALTH_VERSION,
  FlowError,
  createSession,
  goBack,
  openUrgent,
  renderScreen,
  restartSession,
  selectOption,
  type FlowSession,
  type FlowState,
} from "./boneHealthFlow";

function populationLabel(group: FlowState["group"]): string {
  if (group === "younger") return "Premenopausal / under 50";
  if (group === "older") return "Postmenopausal / 50+";
  return "Population not selected";
}

function riskLabel(initial: FlowState["initial"]): string {
  if (initial === "very_high") return "Provisional very high risk";
  if (initial === "high") return "Provisional high risk";
  if (initial === "low") return "Provisional low risk";
  return "Provisional risk not selected";
}

export default function BoneHealthApp() {
  const [session, setSession] = useState<FlowSession>(() => createSession());
  const [error, setError] = useState<string | null>(null);

  const screen = useMemo(() => {
    try {
      return renderScreen(session);
    } catch (caught) {
      return caught;
    }
  }, [session]);

  const trail = useMemo(() => {
    return session.history.map((snapshot) => {
      try {
        return renderScreen({ nodeId: snapshot.nodeId, state: snapshot.state, history: [] }).title;
      } catch {
        return snapshot.nodeId;
      }
    });
  }, [session.history]);

  function run(change: (current: FlowSession) => FlowSession) {
    try {
      const next = change(session);
      setError(null);
      setSession(next);
    } catch (caught) {
      setError(caught instanceof FlowError ? caught.message : "The guide could not apply that choice.");
    }
  }

  const rendered = screen instanceof Error ? null : screen;
  const renderError = screen instanceof Error ? screen.message : error;

  return (
    <div className="space-y-5" data-testid="bone-health-app">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">Bone health</h2>
            <Badge variant="outline">Algorithm {BONE_HEALTH_VERSION}</Badge>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">{BONE_HEALTH_TITLE}</p>
        </div>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Clinician-guided navigation</AlertTitle>
        <AlertDescription>
          {BONE_HEALTH_PURPOSE} {BONE_HEALTH_VALIDATION} Buttons record your choice. This guide does not
          calculate FRAX, infer risk from measurements, choose a dose, or authorise a prescription.
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap gap-2" data-testid="bone-health-context">
        <Badge variant="secondary">{populationLabel(session.state.group)}</Badge>
        <Badge variant="secondary">{riskLabel(session.state.initial)}</Badge>
        {session.state.secondary && <Badge variant="secondary">Secondary context</Badge>}
        {session.state.treated && <Badge variant="secondary">Treatment context</Badge>}
      </div>

      {trail.length > 0 && rendered && (
        <p className="overflow-x-auto text-xs text-muted-foreground" data-testid="bone-health-trail">
          {trail.join(" → ")} → <span className="text-foreground">{rendered.title}</span>
        </p>
      )}

      {renderError && (
        <Alert variant="destructive">
          <AlertTitle>This screen could not be shown</AlertTitle>
          <AlertDescription>{renderError}</AlertDescription>
        </Alert>
      )}

      {rendered && (
        <Card data-testid="bone-health-screen">
          <CardHeader className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {rendered.terminal ? "Urgent assessment" : `Step ${session.history.length + 1}`}
            </p>
            <h3 className="text-xl font-semibold leading-snug tracking-tight" data-testid="bone-health-title">
              {rendered.title}
            </h3>
          </CardHeader>
          <CardContent className="space-y-5">
            <ul className="list-disc space-y-2 pl-5 text-sm leading-6">
              {rendered.body.map((paragraph) => (
                <li key={paragraph}>{paragraph}</li>
              ))}
            </ul>

            {rendered.options.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {rendered.options.map((option) => (
                  <Button
                    key={option.id}
                    type="button"
                    variant="outline"
                    className="h-auto min-h-11 whitespace-normal px-4 py-3 text-left justify-start"
                    data-testid={`bone-health-option-${option.id}`}
                    onClick={() => run((current) => selectOption(current, option.id))}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No further pathway from this screen. Back restores the previous assessment, or Restart begins again.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          disabled={session.history.length === 0}
          onClick={() => run(goBack)}
          data-testid="bone-health-back"
        >
          <ArrowLeft />
          Back
        </Button>
        <Button type="button" variant="outline" onClick={() => run(() => restartSession())} data-testid="bone-health-restart">
          <RotateCcw />
          Restart
        </Button>
        <Button
          type="button"
          variant="destructive"
          className="sm:ml-auto"
          onClick={() => run(openUrgent)}
          data-testid="bone-health-urgent"
        >
          Urgent assessment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Safety rules</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6">
            {BONE_HEALTH_SAFETY_RULES.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <details className="rounded-xl border bg-card px-4 py-3 text-sm">
        <summary className="cursor-pointer font-medium">Sources and how this guide was built</summary>
        <div className="mt-3 space-y-3 text-muted-foreground">
          <p>{BONE_HEALTH_PROVENANCE.baseline}</p>
          <p>{BONE_HEALTH_PROVENANCE.supplement}</p>
          <ul className="list-disc space-y-1 pl-5">
            {BONE_HEALTH_SOURCES.map((source) => (
              <li key={source.url}>
                <a className="underline underline-offset-4" href={source.url} target="_blank" rel="noreferrer">
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </details>
    </div>
  );
}
