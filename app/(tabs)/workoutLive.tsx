import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { PlanExercise } from "../../src/domain/types";
import { loadPlans } from "../../src/services/workoutPlanService";
import { saveWorkout } from "../../src/services/workoutService";

const gold = "#f5b400";
const dark = "#050507";
const mid = "#141414";

const WorkoutLive = () => {
  const { user } = useAuth();
  const router = useRouter();

  const params = useLocalSearchParams();
  const modeRaw = params.mode;
  const initialCategoryRaw = params.initialCategory;
  const planIdRaw = params.planId;
  const dayIdRaw = params.dayId;

  const mode = Array.isArray(modeRaw) ? modeRaw[0] : modeRaw || "free";
  const initialCategory = Array.isArray(initialCategoryRaw)
    ? initialCategoryRaw[0]
    : initialCategoryRaw || "strength";
  const planId = Array.isArray(planIdRaw) ? planIdRaw[0] : planIdRaw || null;
  const dayId = Array.isArray(dayIdRaw) ? dayIdRaw[0] : dayIdRaw || null;

  const [exercises, setExercises] = useState<PlanExercise[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFromPlan = async () => {
    if (!user || !planId || !dayId) return;

    const plans = await loadPlans(user.uid);
    const p = plans.find((x: any) => x.id === planId);
    if (!p) return;
    const d = p.workoutDays.find((x: any) => x.id === dayId);
    if (!d) return;

    const copy: PlanExercise[] = d.exercises.map((ex: PlanExercise) => ({
      ...ex,
      workoutPlanDayId: ex.workoutPlanDayId || d.id,
    }));
    setExercises(copy);
  };

  useEffect(() => {
    const run = async () => {
      if (mode === "plan") {
        await loadFromPlan();
        setLoading(false);
        return;
      }
      const category = initialCategory === "cardio" ? "cardio" : "strength";
      const freeDayId = dayId || "free";
      setExercises([
        {
          id: `free-${Date.now()}`,
          workoutPlanDayId: freeDayId,
          name: "",
          category,
          reps: null,
          weight: null,
          duration: null,
          distance: null,
        },
      ]);
      setLoading(false);
    };
    run();
  }, [mode, planId, dayId, initialCategory]);

  const updateField = (id: string, field: string, value: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== id) return ex;

        if (field === "name") return { ...ex, name: value };

        if (field === "category") {
          const nextCategory = ex.category === "strength" ? "cardio" : "strength";
          return {
            ...ex,
            category: nextCategory,
            reps: null,
            weight: null,
            duration: null,
            distance: null,
          };
        }

        if (["reps", "weight", "duration", "distance"].includes(field)) {
          return { ...ex, [field]: value === "" ? null : Number(value) };
        }

        return ex;
      })
    );
  };

  const addExercise = () => {
    const baseCategory = initialCategory === "cardio" ? "cardio" : "strength";
    const freeDayId = dayId || "free";
    setExercises((prev) => [
      ...prev,
      {
        id: `free-${Date.now()}-${Math.random()}`,
        workoutPlanDayId: freeDayId,
        name: "",
        category: baseCategory,
        reps: null,
        weight: null,
        duration: null,
        distance: null,
      },
    ]);
  };

  const finish = async () => {
    if (!user) return;

    if (exercises.length === 0) {
      Alert.alert("Fehler", "Workout hat keine Exercises.");
      return;
    }

    for (const ex of exercises) {
      if (!ex.name || !ex.name.trim()) {
        Alert.alert("Fehler", "Jede Exercise braucht einen Namen.");
        return;
      }
    }

    await saveWorkout(user.uid, user.displayName ?? user.email ?? "user", {
      planId: planId,
      exercises: exercises as any,
    });

    router.push("/(tabs)/history");
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.logo}>PeakLog</Text>
        <Text style={styles.text}>Workout wird vorbereitet...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.logo}>PeakLog</Text>
      <Text style={styles.title}>
        {mode === "plan" ? "Plan-Workout" : "Eigenes Workout"}
      </Text>

      <Text style={styles.sub}>
        Tippe auf den Typ, um zwischen Kraft und Cardio zu wechseln.
      </Text>

      {mode === "free" && (
        <TouchableOpacity style={styles.addBtn} onPress={addExercise}>
          <Text style={styles.addText}>Exercise hinzufuegen</Text>
        </TouchableOpacity>
      )}

      {exercises.map((ex) => (
        <View key={ex.id} style={styles.card}>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.nameInput]}
              placeholder="Exercise Name"
              placeholderTextColor="#777"
              value={ex.name}
              onChangeText={(v) => updateField(ex.id, "name", v)}
            />
            <TouchableOpacity
              style={styles.typeToggle}
              onPress={() => updateField(ex.id, "category", "")}
            >
              <Text style={styles.typeToggleText}>
                {ex.category === "strength" ? "Kraft" : "Cardio"}
              </Text>
            </TouchableOpacity>
          </View>

          {ex.category === "strength" ? (
            <View style={styles.row}>
              <TextInput
                style={styles.small}
                placeholder="Reps"
                placeholderTextColor="#777"
                keyboardType="numeric"
                value={ex.reps?.toString() ?? ""}
                onChangeText={(v) => updateField(ex.id, "reps", v)}
              />
              <TextInput
                style={styles.small}
                placeholder="Weight"
                placeholderTextColor="#777"
                keyboardType="numeric"
                value={ex.weight?.toString() ?? ""}
                onChangeText={(v) => updateField(ex.id, "weight", v)}
              />
            </View>
          ) : (
            <View style={styles.row}>
              <TextInput
                style={styles.small}
                placeholder="Duration"
                placeholderTextColor="#777"
                keyboardType="numeric"
                value={ex.duration?.toString() ?? ""}
                onChangeText={(v) => updateField(ex.id, "duration", v)}
              />
              <TextInput
                style={styles.small}
                placeholder="Distance"
                placeholderTextColor="#777"
                keyboardType="numeric"
                value={ex.distance?.toString() ?? ""}
                onChangeText={(v) => updateField(ex.id, "distance", v)}
              />
            </View>
          )}
        </View>
      ))}

      <TouchableOpacity style={styles.finishBtn} onPress={finish}>
        <Text style={styles.finishText}>Workout abschliessen</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: dark, padding: 16 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: dark,
  },
  logo: {
    fontSize: 20,
    fontWeight: "900",
    color: gold,
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: { color: "#f7f7f7", fontSize: 18, fontWeight: "700", marginBottom: 8 },
  sub: { color: "#aaa", fontSize: 12, marginBottom: 12 },
  text: { color: "#ccc" },
  card: {
    backgroundColor: mid,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  row: { flexDirection: "row", marginBottom: 8 },
  input: {
    backgroundColor: "#222",
    color: "#fff",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
  },
  nameInput: { flex: 1, marginRight: 8 },
  small: {
    flex: 1,
    backgroundColor: "#222",
    color: "#fff",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
    marginRight: 8,
  },
  typeToggle: {
    borderWidth: 1,
    borderColor: gold,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: "center",
  },
  typeToggleText: { color: gold, fontWeight: "700" },
  addBtn: {
    borderWidth: 1,
    borderColor: gold,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  addText: { color: gold, fontWeight: "700" },
  finishBtn: {
    backgroundColor: gold,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 40,
  },
  finishText: { color: dark, fontWeight: "700", fontSize: 16 },
});

export default WorkoutLive;
