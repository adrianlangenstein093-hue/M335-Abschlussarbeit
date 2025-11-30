import { Timestamp } from "firebase/firestore";

export type ExerciseCategory = "strength" | "cardio";

export interface PlanExercise {
  id: string;
  workoutPlanDayId: string;
  name: string;
  category: ExerciseCategory;
  reps?: number | null;
  weight?: number | null;
  duration?: number | null;
  distance?: number | null;
}

export interface WorkoutPlanDay {
  id: string;
  weekday: string;
  workoutPlanId: string;
  exercises: PlanExercise[];
  isRestDay: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp | null;
  updatedBy?: string | null;
  isDeleteFlagged: boolean;
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  isTemplate: boolean;
  name: string;
  workoutDays: WorkoutPlanDay[];
  createdAt: Timestamp;
  updatedAt?: Timestamp | null;
  updatedBy?: string | null;
  isDeleteFlagged: boolean;
}

export interface StrengthWorkoutExercise {
  id: string;
  name: string;
  category: "strength";
  reps: number;
  weight: number;
  duration?: number | null;
  distance?: number | null;
}

export interface CardioWorkoutExercise {
  id: string;
  name: string;
  category: "cardio";
  duration: number;
  distance: number;
  reps?: number | null;
  weight?: number | null;
}

export type WorkoutExercise = StrengthWorkoutExercise | CardioWorkoutExercise;

export interface Workout {
  id: string;
  userId: string;
  username: string;
  workoutPlanId?: string | null;
  exercises: WorkoutExercise[];
  workoutCompleted: boolean;
  date: Timestamp;
}
