import type { Patient, Prediction } from "./health-store";

type Vitals = Patient["vitals"];

type Model = {
  disease: string;
  bias: number;
  symptomWeights: Record<string, number>;
  vitals: (v: Vitals, age: number) => number;
  advice: string;
};

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

const MODELS: Model[] = [
  {
    disease: "Type 2 Diabetes",
    bias: -3.2,
    symptomWeights: {
      "Frequent Urination": 1.5,
      "Excessive Thirst": 1.5,
      Fatigue: 0.6,
      "Blurred Vision": 1.1,
      "Weight Loss": 0.8,
    },
    vitals: (v, age) =>
      (v.glucose - 110) * 0.035 + (v.bmi - 25) * 0.11 + Math.max(0, age - 45) * 0.02,
    advice: "Recommend HbA1c and fasting glucose panel; endocrinology review.",
  },
  {
    disease: "Cardiovascular Risk",
    bias: -3.0,
    symptomWeights: {
      "Chest Pain": 1.8,
      "Shortness of Breath": 1.3,
      Dizziness: 0.7,
      Fatigue: 0.4,
    },
    vitals: (v, age) =>
      (v.bp - 125) * 0.045 + (v.bmi - 25) * 0.08 + Math.max(0, age - 50) * 0.03,
    advice: "Recommend ECG, lipid profile and cardiology consultation.",
  },
  {
    disease: "Respiratory Infection",
    bias: -2.8,
    symptomWeights: {
      Fever: 1.4,
      Cough: 1.6,
      "Shortness of Breath": 0.9,
      Fatigue: 0.5,
      Headache: 0.4,
    },
    vitals: (v) => Math.max(0, v.temperature - 98.6) * 0.75,
    advice: "Recommend chest X-ray and CBC if symptoms persist beyond 3 days.",
  },
  {
    disease: "Hypertension",
    bias: -3.4,
    symptomWeights: { Headache: 0.9, Dizziness: 1.1, "Chest Pain": 0.6, Fatigue: 0.3 },
    vitals: (v, age) => (v.bp - 120) * 0.075 + Math.max(0, age - 40) * 0.02,
    advice: "Recommend 7-day ambulatory BP monitoring and sodium-restricted diet.",
  },
  {
    disease: "Anemia / General Fatigue",
    bias: -3.1,
    symptomWeights: {
      Fatigue: 1.6,
      Dizziness: 1.0,
      Headache: 0.6,
      "Weight Loss": 0.7,
      "Joint Pain": 0.4,
    },
    vitals: (v) => (v.bmi < 19 ? 0.8 : 0),
    advice: "Recommend CBC with iron studies and vitamin B12 levels.",
  },
];

export type Scored = {
  disease: string;
  confidence: number;
  risk: Prediction["risk"];
  advice: string;
};

export function predict(input: {
  age: number;
  symptoms: string[];
  vitals: Vitals;
}): Scored[] {
  return MODELS.map((m) => {
    const symptomScore = input.symptoms.reduce(
      (sum, s) => sum + (m.symptomWeights[s] ?? 0),
      0,
    );
    const z = m.bias + symptomScore + m.vitals(input.vitals, input.age);
    const confidence = Math.round(sigmoid(z) * 1000) / 10;
    const risk: Prediction["risk"] =
      confidence >= 65 ? "High" : confidence >= 35 ? "Moderate" : "Low";
    return { disease: m.disease, confidence, risk, advice: m.advice };
  }).sort((a, b) => b.confidence - a.confidence);
}
