export type Vitals = {
  glucose: number;
  bp: number;
  bmi: number;
  temperature: number;
};

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
  vitals: Vitals;
  predictions: Prediction[];
  createdAt: string;
};

export type PatientInput = {
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  contact: string;
  history: string;
  symptoms: string[];
  vitals: Vitals;
};

export type Profile = {
  fullName: string | null;
  clinicName: string | null;
} | null;

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
