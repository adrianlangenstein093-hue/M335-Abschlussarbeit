import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { PlanExercise, WorkoutPlan, WorkoutPlanDay } from "../domain/types";
import { validateWorkoutPlan } from "../domain/validation";

const plansCol = (userId: string) =>
  collection(db, "users", userId, "workoutPlans");
const daysCol = (userId: string, planId: string) =>
  collection(db, "users", userId, "workoutPlans", planId, "days");
const exCol = (userId: string, planId: string, dayId: string) =>
  collection(db, "users", userId, "workoutPlans", planId, "days", dayId, "exercises");

const mapPlanExercise = (dayId: string, raw: any): PlanExercise => ({
  id: String(raw.id ?? `ex-${Math.random()}`),
  workoutPlanDayId: dayId,
  name: String(raw.name ?? ""),
  category: raw.category === "cardio" ? "cardio" : "strength",
  reps: raw.reps ?? null,
  weight: raw.weight ?? null,
  duration: raw.duration ?? null,
  distance: raw.distance ?? null,
});

const mapWorkoutPlanDayBase = (
  planId: string,
  dayId: string,
  raw: any
): WorkoutPlanDay => ({
  id: dayId,
  weekday: String(raw.weekday ?? ""),
  workoutPlanId: planId,
  exercises: [],
  isRestDay: Boolean(raw.isRestDay),
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt ?? null,
  updatedBy: raw.updatedBy ?? null,
  isDeleteFlagged: raw.isDeleteFlagged ?? false,
});

export const createEmptyWorkoutPlan = async (
  userId: string,
  name: string
): Promise<string> => {
  if (!userId) throw new Error("UserId fehlt.");
  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 3) {
    throw new Error("Plan Name muss mindestens 3 Zeichen haben.");
  }

  const existingQ = query(
    plansCol(userId),
    where("name", "==", trimmed),
    where("isDeleteFlagged", "==", false)
  );
  const existingSnap = await getDocs(existingQ);
  if (!existingSnap.empty) {
    throw new Error("Es existiert bereits ein Plan mit diesem Namen.");
  }

  const docRef = await addDoc(plansCol(userId), {
    userId,
    isTemplate: false,
    name: trimmed,
    createdAt: serverTimestamp(),
    updatedAt: null,
    updatedBy: null,
    isDeleteFlagged: false,
  });

  return docRef.id;
};

export const getWorkoutPlans = async (
  userId: string
): Promise<WorkoutPlan[]> => {
  const q = query(plansCol(userId), where("isDeleteFlagged", "==", false));
  const snap = await getDocs(q);

  const plans: WorkoutPlan[] = [];
  for (const d of snap.docs) {
    const data = d.data() as any;
    const planId = d.id;

    const daysSnap = await getDocs(daysCol(userId, planId));
    const days: WorkoutPlanDay[] = [];
    for (const dayDoc of daysSnap.docs) {
      const dayData = dayDoc.data() as any;
      const dayId = dayDoc.id;
      const baseDay = mapWorkoutPlanDayBase(planId, dayId, dayData);

      const exSnap = await getDocs(exCol(userId, planId, dayId));
      const exercises: PlanExercise[] = exSnap.docs.map((exDoc) =>
        mapPlanExercise(dayId, { id: exDoc.id, ...exDoc.data() })
      );

      days.push({ ...baseDay, exercises });
    }

    plans.push({
      id: planId,
      userId: String(data.userId),
      isTemplate: data.isTemplate ?? false,
      name: String(data.name),
      workoutDays: days,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt ?? null,
      updatedBy: data.updatedBy ?? null,
      isDeleteFlagged: data.isDeleteFlagged ?? false,
    } as WorkoutPlan);
  }

  return plans;
};

export const loadPlans = getWorkoutPlans;

export const softDeleteWorkoutPlan = async (
  userId: string,
  planId: string
): Promise<void> => {
  const ref = doc(plansCol(userId), planId);
  await updateDoc(ref, {
    isDeleteFlagged: true,
    updatedAt: serverTimestamp(),
  });
};

export const updateWorkoutPlan = async (
  userId: string,
  plan: WorkoutPlan
): Promise<void> => {
  const result = validateWorkoutPlan(plan);
  if (!result.isValid) {
    throw new Error(result.errors.join("\n"));
  }

  const ref = doc(plansCol(userId), plan.id);
  await updateDoc(ref, {
    name: plan.name,
    isTemplate: plan.isTemplate,
    isDeleteFlagged: plan.isDeleteFlagged,
    updatedAt: serverTimestamp(),
    updatedBy: plan.updatedBy ?? null,
  });
};

export const ensureDayExists = async (
  userId: string,
  planId: string,
  weekday: string
): Promise<WorkoutPlanDay> => {
  const q = query(daysCol(userId, planId), where("weekday", "==", weekday));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const d = snap.docs[0];
    const data = d.data() as any;
    return mapWorkoutPlanDayBase(planId, d.id, data);
  }

  const ref = await addDoc(daysCol(userId, planId), {
    weekday,
    isRestDay: false,
    createdAt: serverTimestamp(),
    updatedAt: null,
    updatedBy: null,
    isDeleteFlagged: false,
  });

  return {
    id: ref.id,
    weekday,
    workoutPlanId: planId,
    exercises: [],
    isRestDay: false,
    createdAt: serverTimestamp() as any,
    updatedAt: null,
    updatedBy: null,
    isDeleteFlagged: false,
  };
};

export const saveExercises = async (
  userId: string,
  planId: string,
  dayId: string,
  exercises: PlanExercise[]
): Promise<void> => {
  const dayRef = doc(daysCol(userId, planId), dayId);
  await updateDoc(dayRef, {
    updatedAt: serverTimestamp(),
  });

  for (const ex of exercises) {
    const exRef = doc(exCol(userId, planId, dayId), ex.id);
    await updateDoc(exRef, {
      name: ex.name,
      category: ex.category,
      reps: ex.reps ?? null,
      weight: ex.weight ?? null,
      duration: ex.duration ?? null,
      distance: ex.distance ?? null,
    }).catch(async () => {
      await addDoc(exCol(userId, planId, dayId), {
        name: ex.name,
        category: ex.category,
        reps: ex.reps ?? null,
        weight: ex.weight ?? null,
        duration: ex.duration ?? null,
        distance: ex.distance ?? null,
      });
    });
  }
};
