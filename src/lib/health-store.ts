import { useEffect, useState } from "react";

export type Prediction = {
  disease: string;
  risk: "Low" | "Moderate" | "High";
  confidence: number;
  createdAt: string;
};

export type Patient = {
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  contact: string;
  history: string;
  symptoms: string[];
  vitals: { glucose: number; bp: number; bmi: number; temperature: number };
  predictions: Prediction[];
  createdAt: string;
};

const KEY = "medicloud.patients.v1";

export const SYMPTOMS = [
  "Fever",
  "Cough",
  "Fatigue",
  "Chest Pain",
  "Shortness of Breath",
  "Headache",
  "Frequent Urination",
  "Excessive Thirst",
  "Blurred Vision",
  "Dizziness",
  "Weight Loss",
  "Joint Pain",
];

const seed: Patient[] = [
  {
    id: "P-1001",
    name: "Anita Sharma",
    age: 54,
    gender: "Female",
    contact: "+91 98450 11223",
    history: "Type 2 diabetes (2018), hypothyroidism",
    symptoms: ["Frequent Urination", "Excessive Thirst", "Fatigue", "Blurred Vision"],
    vitals: { glucose: 186, bp: 138, bmi: 31.4, temperature: 98.6 },
    predictions: [],
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: "P-1002",
    name: "Rahul Verma",
    age: 61,
    gender: "Male",
    contact: "+91 99000 45611",
    history: "Smoker, high cholesterol",
    symptoms: ["Chest Pain", "Shortness of Breath", "Dizziness"],
    vitals: { glucose: 104, bp: 162, bmi: 28.9, temperature: 98.2 },
    predictions: [],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "P-1003",
    name: "Meera Nair",
    age: 27,
    gender: "Female",
    contact: "+91 90876 33221",
    history: "No chronic illness",
    symptoms: ["Fever", "Cough", "Headache"],
    vitals: { glucose: 92, bp: 118, bmi: 22.1, temperature: 101.4 },
    predictions: [],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

function read(): Patient[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      window.localStorage.setItem(KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as Patient[];
  } catch {
    return seed;
  }
}

function write(patients: Patient[]) {
  window.localStorage.setItem(KEY, JSON.stringify(patients));
  window.dispatchEvent(new Event("medicloud:update"));
}

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>(seed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setPatients(read());
    sync();
    setReady(true);
    window.addEventListener("medicloud:update", sync);
    return () => window.removeEventListener("medicloud:update", sync);
  }, []);

  return {
    patients,
    ready,
    addPatient(p: Omit<Patient, "id" | "predictions" | "createdAt">) {
      const all = read();
      const next: Patient = {
        ...p,
        id: `P-${1000 + all.length + 1}`,
        predictions: [],
        createdAt: new Date().toISOString(),
      };
      write([next, ...all]);
      return next;
    },
    savePrediction(patientId: string, prediction: Prediction) {
      write(
        read().map((p) =>
          p.id === patientId ? { ...p, predictions: [prediction, ...p.predictions] } : p,
        ),
      );
    },
    removePatient(id: string) {
      write(read().filter((p) => p.id !== id));
    },
  };
}
