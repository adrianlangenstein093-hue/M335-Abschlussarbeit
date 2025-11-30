import {
    addDoc,
    collection,
    getDocs,
    query,
    serverTimestamp,
    where,
} from "firebase/firestore";
import { db } from "../config/firebase";

const workoutsCol = collection(db, "workouts");

export const saveWorkout = async (
  userId: string,
  username: string,
  data: {
    planId: string | null;
    exercises: any[];
  }
): Promise<string> => {
  const ref = await addDoc(workoutsCol, {
    userId,
    username,
    planId: data.planId,
    exercises: data.exercises,
    workoutCompleted: true,
    date: serverTimestamp(),
  });
  return ref.id;
};

export const listWorkouts = async (userId: string): Promise<any[]> => {
  const q = query(workoutsCol, where("userId", "==", userId));
  const snap = await getDocs(q);

  const items: any[] = [];
  for (const docu of snap.docs) {
    const d = docu.data() as any;
    items.push({
      id: docu.id,
      userId: d.userId,
      username: d.username,
      workoutPlanId: d.planId ?? null,
      exercises: d.exercises ?? [],
      workoutCompleted: d.workoutCompleted ?? true,
      date: d.date,
    });
  }
  return items;
};
