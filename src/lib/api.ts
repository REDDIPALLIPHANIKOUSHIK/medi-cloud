import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Patient, Prediction, Profile, Vitals } from "./types";

function mapVitals(v: Record<string, unknown> | null): Vitals {
  return {
    glucose: Number(v?.glucose ?? 0),
    bp: Number(v?.bp ?? 0),
    bmi: Number(v?.bmi ?? 0),
    temperature: Number(v?.temperature ?? 0),
  };
}

function mapPrediction(p: Record<string, unknown>): Prediction {
  return {
    disease: String(p.disease),
    risk: (p.risk as Prediction["risk"]) ?? "Low",
    confidence: Number(p.confidence),
    createdAt: String(p.created_at),
  };
}

function mapPatient(row: Record<string, unknown>): Patient {
  const preds = Array.isArray(row.predictions) ? row.predictions : [];
  return {
    id: String(row.id),
    name: String(row.name),
    age: Number(row.age),
    gender: (row.gender as Patient["gender"]) ?? "Other",
    contact: String(row.contact ?? ""),
    history: String(row.history ?? ""),
    symptoms: Array.isArray(row.symptoms) ? (row.symptoms as string[]) : [],
    vitals: mapVitals(row.vitals as Record<string, unknown> | null),
    predictions: preds.map(mapPrediction),
    createdAt: String(row.created_at),
  };
}

export const getPatients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("patients")
      .select("*, predictions(*)")
      .order("created_at", { ascending: false })
      .order("created_at", { ascending: false, referencedTable: "predictions" });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapPatient);
  });

export const addPatient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    name: string;
    age: number;
    gender: "Male" | "Female" | "Other";
    contact: string;
    history: string;
    symptoms: string[];
    vitals: Vitals;
  }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("patients")
      .insert({
        user_id: userId,
        name: data.name,
        age: data.age,
        gender: data.gender,
        contact: data.contact,
        history: data.history,
        symptoms: data.symptoms,
        vitals: data.vitals,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapPatient({ ...row, predictions: [] });
  });

export const removePatient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("patients").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const savePrediction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    patientId: string;
    disease: string;
    risk: "Low" | "Moderate" | "High";
    confidence: number;
  }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("predictions")
      .insert({
        patient_id: data.patientId,
        user_id: userId,
        disease: data.disease,
        risk: data.risk,
        confidence: data.confidence,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapPrediction(row as unknown as Record<string, unknown>);
  });

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Profile> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, clinic_name")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      fullName: (data.full_name as string | null) ?? null,
      clinicName: (data.clinic_name as string | null) ?? null,
    };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { fullName: string; clinicName: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: data.fullName, clinic_name: data.clinicName })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
