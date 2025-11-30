import {
    ExerciseCategory,
    PlanExercise,
    Workout,
    WorkoutExercise,
    WorkoutPlan,
    WorkoutPlanDay,
} from "./types";

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

const ok = (): ValidationResult => ({ isValid: true, errors: [] });

const fail = (errors: string[]): ValidationResult => ({
  isValid: false,
  errors,
});

const isEmpty = (value: string | null | undefined): boolean =>
  !value || value.trim().length === 0;

const ensurePositive = (value: number | null | undefined, field: string, errors: string[]) => {
  if (value == null) return;
  if (Number.isNaN(value) || value <= 0) {
    errors.push(`${field} muss > 0 sein.`);
  }
};

const validateCategory = (category: ExerciseCategory, errors: string[]) => {
  if (category !== "strength" && category !== "cardio") {
    errors.push("Category muss 'strength' oder 'cardio' sein.");
  }
};

export const validatePlanExercise = (exercise: PlanExercise): ValidationResult => {
  const errors: string[] = [];

  if (isEmpty(exercise.name)) {
    errors.push("Exercise Name darf nicht leer sein.");
  }

  validateCategory(exercise.category, errors);

  ensurePositive(exercise.reps ?? null, "Reps", errors);
  ensurePositive(exercise.weight ?? null, "Weight", errors);
  ensurePositive(exercise.duration ?? null, "Duration", errors);
  ensurePositive(exercise.distance ?? null, "Distance", errors);

  return errors.length ? fail(errors) : ok();
};

export const validateWorkoutPlanDay = (day: WorkoutPlanDay): ValidationResult => {
  const errors: string[] = [];

  if (isEmpty(day.weekday)) {
    errors.push("Weekday darf nicht leer sein.");
  }

  if (!day.isRestDay && day.exercises.length === 0) {
    errors.push("Nicht Restday braucht mindestens eine Exercise.");
  }

  day.exercises.forEach((ex, index) => {
    const res = validatePlanExercise(ex);
    if (!res.isValid) {
      res.errors.forEach((e) => errors.push(`Exercise #${index + 1}: ${e}`));
    }
  });

  return errors.length ? fail(errors) : ok();
};

export const validateWorkoutPlan = (plan: WorkoutPlan): ValidationResult => {
  const errors: string[] = [];

  if (isEmpty(plan.name) || plan.name.trim().length < 3) {
    errors.push("Plan Name muss mindestens 3 Zeichen haben.");
  }

  if (!plan.userId) {
    errors.push("Plan braucht einen UserId.");
  }

  if (plan.workoutDays.length === 0) {
    errors.push("Plan braucht mindestens einen Workout Tag.");
  }

  plan.workoutDays.forEach((day, index) => {
    const res = validateWorkoutPlanDay(day);
    if (!res.isValid) {
      res.errors.forEach((e) => errors.push(`Tag #${index + 1}: ${e}`));
    }
  });

  return errors.length ? fail(errors) : ok();
};

export const validateWorkoutExercise = (exercise: WorkoutExercise): ValidationResult => {
  const errors: string[] = [];

  if (isEmpty(exercise.name)) {
    errors.push("Exercise Name darf nicht leer sein.");
  }

  validateCategory(exercise.category, errors);

  if (exercise.category === "strength") {
    if (exercise.reps == null || exercise.reps <= 0) {
      errors.push("Strength Exercise braucht Reps > 0.");
    }
    if (exercise.weight == null || exercise.weight <= 0) {
      errors.push("Strength Exercise braucht Weight > 0.");
    }
    ensurePositive(exercise.duration ?? null, "Duration", errors);
    ensurePositive(exercise.distance ?? null, "Distance", errors);
  }

  if (exercise.category === "cardio") {
    if (exercise.duration == null || exercise.duration <= 0) {
      errors.push("Cardio Exercise braucht Duration > 0.");
    }
    if (exercise.distance == null || exercise.distance <= 0) {
      errors.push("Cardio Exercise braucht Distance > 0.");
    }
    ensurePositive(exercise.reps ?? null, "Reps", errors);
    ensurePositive(exercise.weight ?? null, "Weight", errors);
  }

  return errors.length ? fail(errors) : ok();
};

export const validateWorkout = (workout: Workout): ValidationResult => {
  const errors: string[] = [];

  if (!workout.userId) {
    errors.push("Workout braucht einen UserId.");
  }
  if (isEmpty(workout.username)) {
    errors.push("Workout braucht einen Username.");
  }
  if (workout.exercises.length === 0) {
    errors.push("Workout braucht mindestens eine Exercise.");
  }

  workout.exercises.forEach((ex, index) => {
    const res = validateWorkoutExercise(ex);
    if (!res.isValid) {
      res.errors.forEach((e) => errors.push(`Exercise #${index + 1}: ${e}`));
    }
  });

  return errors.length ? fail(errors) : ok();
};
