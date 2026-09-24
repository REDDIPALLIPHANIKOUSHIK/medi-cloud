import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity,
  Brain,
  CloudCog,
  HeartPulse,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Toaster } from "@/components/ui/sonner";
import { SYMPTOMS, usePatients, type Patient } from "@/lib/health-store";
import { predict } from "@/lib/predict";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MediCloud — Cloud Healthcare Data & AI Disease Prediction" },
      {
        name: "description",
        content:
          "Cloud-based healthcare data management system with AI-powered disease risk prediction for clinical decision support.",
      },
      { property: "og:title", content: "MediCloud — Cloud Healthcare Data & AI Prediction" },
      {
        property: "og:description",
        content:
          "Securely manage patient records and run AI-powered disease risk predictions as clinical decision support.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});

const RISK_COLOR: Record<string, string> = {
  High: "var(--color-destructive)",
  Moderate: "var(--color-chart-4)",
  Low: "var(--color-primary)",
};

function App() {
  const { patients, addPatient, savePrediction } = usePatients();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = patients.find((p) => p.id === selectedId) ?? patients[0] ?? null;

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <HeartPulse className="size-5" />
          </div>
          <div className="mr-auto">
            <h1 className="text-lg font-semibold tracking-tight">MediCloud</h1>
            <p className="text-xs text-muted-foreground">
              Cloud Healthcare Data Management + AI Disease Prediction
            </p>
          </div>
          <Badge variant="secondary" className="gap-1">
            <CloudCog className="size-3.5" /> Cloud sync active
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Tabs defaultValue="dashboard">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="predict">AI Prediction</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <Dashboard patients={patients} />
          </TabsContent>

          <TabsContent value="patients" className="mt-6">
            <PatientsTab
              patients={patients}
              onAdd={addPatient}
              onSelect={(id) => setSelectedId(id)}
            />
          </TabsContent>

          <TabsContent value="predict" className="mt-6">
            <PredictTab
              patients={patients}
              selected={selected}
              onSelect={setSelectedId}
              onSave={savePrediction}
            />
          </TabsContent>
        </Tabs>

        <p className="mt-10 rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
          <ShieldCheck className="mr-1 inline size-3.5" />
          AI output is clinical decision support only and is not a confirmed diagnosis. A
          qualified healthcare professional makes the final diagnosis and treatment decision.
        </p>
      </main>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-5">
        <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-semibold leading-none">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard({ patients }: { patients: Patient[] }) {
  const preds = patients.flatMap((p) => p.predictions);
  const riskData = ["High", "Moderate", "Low"].map((risk) => ({
    name: risk,
    value: preds.filter((p) => p.risk === risk).length,
  }));
  const diseaseData = useMemo(() => {
    const map = new Map<string, number>();
    preds.forEach((p) => map.set(p.disease, (map.get(p.disease) ?? 0) + 1));
    return [...map.entries()].map(([name, count]) => ({ name, count }));
  }, [preds]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Users className="size-5" />} label="Patients" value={patients.length} />
        <Stat icon={<Brain className="size-5" />} label="AI predictions" value={preds.length} />
        <Stat
          icon={<Activity className="size-5" />}
          label="High risk alerts"
          value={preds.filter((p) => p.risk === "High").length}
        />
        <Stat
          icon={<CloudCog className="size-5" />}
          label="Records stored"
          value={patients.length + preds.length}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Risk level distribution</CardTitle>
            <CardDescription>Across all saved AI predictions</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {preds.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={riskData} dataKey="value" nameKey="name" innerRadius={50} label>
                    {riskData.map((d) => (
                      <Cell key={d.name} fill={RISK_COLOR[d.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Predicted conditions</CardTitle>
            <CardDescription>Frequency of top predicted conditions</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {diseaseData.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={diseaseData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={6} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Run an AI prediction to populate this chart.
    </div>
  );
}

function PatientsTab({
  patients,
  onAdd,
  onSelect,
}: {
  patients: Patient[];
  onAdd: ReturnType<typeof usePatients>["addPatient"];
  onSelect: (id: string) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "Female",
    contact: "",
    history: "",
    glucose: "95",
    bp: "120",
    bmi: "24",
    temperature: "98.6",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.age) {
      toast.error("Name and age are required");
      return;
    }
    const p = onAdd({
      name: form.name,
      age: Number(form.age),
      gender: form.gender as Patient["gender"],
      contact: form.contact,
      history: form.history,
      symptoms: [],
      vitals: {
        glucose: Number(form.glucose),
        bp: Number(form.bp),
        bmi: Number(form.bmi),
        temperature: Number(form.temperature),
      },
    });
    onSelect(p.id);
    toast.success(`${p.name} saved to cloud records`);
    setForm({ ...form, name: "", age: "", contact: "", history: "" });
  };

  const field = (key: keyof typeof form, label: string, type = "text") => (
    <div className="space-y-1.5">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        type={type}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Register patient</CardTitle>
          <CardDescription>Stored in the cloud patient records collection</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {field("name", "Full name")}
              {field("age", "Age", "number")}
              <div className="space-y-1.5">
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </select>
              </div>
              {field("contact", "Contact")}
              {field("glucose", "Glucose (mg/dL)", "number")}
              {field("bp", "Systolic BP", "number")}
              {field("bmi", "BMI", "number")}
              {field("temperature", "Temperature (°F)", "number")}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="history">Medical history</Label>
              <Textarea
                id="history"
                value={form.history}
                onChange={(e) => setForm({ ...form, history: e.target.value })}
                placeholder="Chronic conditions, allergies, surgeries…"
              />
            </div>
            <Button type="submit" className="w-full">
              <Plus className="size-4" /> Save patient record
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Patient records ({patients.length})</CardTitle>
          <CardDescription>Latest records first</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {patients.map((p) => (
            <div key={p.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{p.name}</span>
                <Badge variant="outline">{p.id}</Badge>
                <span className="text-xs text-muted-foreground">
                  {p.age} yrs · {p.gender}
                </span>
                {p.predictions[0] && (
                  <Badge
                    className="ml-auto"
                    variant={p.predictions[0].risk === "High" ? "destructive" : "secondary"}
                  >
                    {p.predictions[0].disease} · {p.predictions[0].risk}
                  </Badge>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {p.history || "No recorded history"} · Glucose {p.vitals.glucose} · BP{" "}
                {p.vitals.bp} · BMI {p.vitals.bmi}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function PredictTab({
  patients,
  selected,
  onSelect,
  onSave,
}: {
  patients: Patient[];
  selected: Patient | null;
  onSelect: (id: string) => void;
  onSave: ReturnType<typeof usePatients>["savePrediction"];
}) {
  const [symptoms, setSymptoms] = useState<string[] | null>(null);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ReturnType<typeof predict> | null>(null);

  if (!selected) {
    return <p className="text-sm text-muted-foreground">Add a patient first.</p>;
  }

  const active = symptoms ?? selected.symptoms;

  const toggle = (s: string) =>
    setSymptoms(active.includes(s) ? active.filter((x) => x !== s) : [...active, s]);

  const run = () => {
    setRunning(true);
    setTimeout(() => {
      const out = predict({
        age: selected.age,
        symptoms: active,
        vitals: selected.vitals,
      });
      setResults(out);
      onSave(selected.id, {
        disease: out[0].disease,
        risk: out[0].risk,
        confidence: out[0].confidence,
        createdAt: new Date().toISOString(),
      });
      setRunning(false);
      toast.success("AI analysis complete — result saved to patient record");
    }, 700);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Run AI analysis</CardTitle>
          <CardDescription>Select a patient and their current symptoms</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="patient">Patient</Label>
            <select
              id="patient"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={selected.id}
              onChange={(e) => {
                onSelect(e.target.value);
                setSymptoms(null);
                setResults(null);
              }}
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
            <span>Age: {selected.age}</span>
            <span>Glucose: {selected.vitals.glucose}</span>
            <span>BP: {selected.vitals.bp}</span>
            <span>BMI: {selected.vitals.bmi}</span>
          </div>

          <div>
            <Label>Symptoms</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {SYMPTOMS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggle(s)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    active.includes(s)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-background hover:bg-accent"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={run} disabled={running} className="w-full">
            <Brain className="size-4" />
            {running ? "Analyzing…" : "Run disease prediction"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prediction results</CardTitle>
          <CardDescription>Ranked probability of possible conditions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!results && (
            <p className="text-sm text-muted-foreground">
              Run an analysis to see predicted conditions, risk levels and recommended next
              steps.
            </p>
          )}
          {results?.map((r, i) => (
            <div key={r.disease} className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">{r.disease}</span>
                <Badge
                  variant={
                    r.risk === "High"
                      ? "destructive"
                      : r.risk === "Moderate"
                        ? "default"
                        : "secondary"
                  }
                >
                  {r.risk} risk
                </Badge>
                <span className="ml-auto text-sm font-semibold">{r.confidence}%</span>
              </div>
              <Progress value={r.confidence} className="mt-3" />
              {i === 0 && <p className="mt-3 text-xs text-muted-foreground">{r.advice}</p>}
            </div>
          ))}

          {selected.predictions.length > 0 && (
            <div className="pt-2">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Saved history
              </p>
              <div className="space-y-1.5">
                {selected.predictions.slice(0, 5).map((p) => (
                  <div key={p.createdAt} className="flex gap-2 text-xs text-muted-foreground">
                    <span>{new Date(p.createdAt).toLocaleString()}</span>
                    <span className="ml-auto">
                      {p.disease} · {p.risk} · {p.confidence}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
