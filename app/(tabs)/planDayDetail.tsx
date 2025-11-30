import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { ExerciseCategory, PlanExercise, WorkoutPlanDay } from "../../src/domain/types";
import { loadPlans, saveExercises } from "../../src/services/workoutPlanService";

const gold = "#f5b400";
const dark = "#050507";
const mid = "#141414";

const emptyExercise = (dayId: string): PlanExercise => ({
  id: `ex-${Date.now()}-${Math.random()}`,
  workoutPlanDayId: dayId,
  name: "",
  category: "strength",
  reps: null,
  weight: null,
  duration: null,
  distance: null,
});

const PlanDayDetail: React.FC = () => {
  const { user } = useAuth();
  const { planId, dayId } = useLocalSearchParams();
  const router = useRouter();

  const [day, setDay] = useState<WorkoutPlanDay | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user || !planId || !dayId) return;
    const planIdStr = Array.isArray(planId) ? planId[0] : planId;
    const dayIdStr = Array.isArray(dayId) ? dayId[0] : dayId;

    const plans = await loadPlans(user.uid);
    const p = plans.find((x) => x.id === planIdStr);
    if (!p) {
      Alert.alert("Fehler", "Plan nicht gefunden.");
      router.back();
      return;
    }
    const d = p.workoutDays.find((x: WorkoutPlanDay) => x.id === dayIdStr);
    if (!d) {
      Alert.alert("Fehler", "Tag nicht gefunden.");
      router.back();
      return;
    }
    if (d.isRestDay) {
      Alert.alert("Info", "Restday hat keine Exercises.");
      router.back();
      return;
    }

    const exercises: PlanExercise[] = (d.exercises || []).map((ex) => ({
      ...(ex as PlanExercise),
      workoutPlanDayId: ex.workoutPlanDayId || d.id,
      category: (ex.category === "cardio" ? "cardio" : "strength") as ExerciseCategory,
    }));

    setDay({ ...d, exercises });
  };

  useEffect(() => {
    load();
  }, [user?.uid, planId, dayId]);

  const setField = (id: string, field: keyof PlanExercise, val: string) => {
    if (!day) return;
    const updated: PlanExercise[] = day.exercises.map((ex) => {
      if (ex.id !== id) return ex;

      if (field === "name") {
        return { ...ex, name: val };
      }

      if (field === "category") {
        const next: ExerciseCategory =
          ex.category === "strength" ? "cardio" : "strength";
        return {
          ...ex,
          category: next,
          reps: null,
          weight: null,
          duration: null,
          distance: null,
        };
      }

      if (field === "reps" || field === "weight" || field === "duration" || field === "distance") {
        return { ...ex, [field]: val === "" ? null : Number(val) };
      }

      return ex;
    });
    setDay({ ...day, exercises: updated });
  };

  const add = () => {
    if (!day) return;
    setDay({
      ...day,
      exercises: [...day.exercises, emptyExercise(day.id)],
    });
  };

  const remove = (id: string) => {
    if (!day) return;
    setDay({
      ...day,
      exercises: day.exercises.filter((e) => e.id !== id),
    });
  };

  const save = async () => {
    if (!user || !day || !planId) return;
    const planIdStr = Array.isArray(planId) ? planId[0] : planId;

    if (day.exercises.length === 0) {
      Alert.alert("Fehler", "Tag braucht mindestens eine Exercise.");
      return;
    }

    for (const ex of day.exercises) {
      if (!ex.name.trim()) {
        Alert.alert("Fehler", "Exercise Name darf nicht leer sein.");
        return;
      }
    }

    try {
      setSaving(true);
      await saveExercises(user.uid, planIdStr, day.id, day.exercises);
      Alert.alert("Gespeichert", "Tag wurde aktualisiert.");
      router.back();
    } catch (e: any) {
      Alert.alert("Fehler", e.message ?? "Tag konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  };

  if (!day) {
    return (
      <View style={styles.center}>
        <Text style={styles.logo}>PeakLog</Text>
        <Text style={styles.text}>Tag wird geladen...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>PeakLog</Text>
      <Text style={styles.title}>{day.weekday}</Text>
      <Text style={styles.sub}>
        Kraft: Reps/Weight, Cardio: Duration/Distance.
      </Text>

      <FlatList
        data={day.exercises}
        keyExtractor={(e) => e.id}
        ListEmptyComponent={
          <Text style={styles.empty}>Keine Exercises. Fuege eine hinzu.</Text>
        }
        renderItem={({ item }) => {
          const isStrength = item.category === "strength";
          return (
            <View style={styles.card}>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.nameInput]}
                  placeholder="Name"
                  placeholderTextColor="#777"
                  value={item.name}
                  onChangeText={(v) => setField(item.id, "name", v)}
                />
                <TouchableOpacity
                  style={styles.catBtn}
                  onPress={() => setField(item.id, "category", item.category)}
                >
                  <Text style={styles.catText}>
                    {item.category === "strength" ? "Kraft" : "Cardio"}
                  </Text>
                </TouchableOpacity>
              </View>

              {isStrength ? (
                <View style={styles.row}>
                  <TextInput
                    style={styles.small}
                    placeholder="Reps"
                    placeholderTextColor="#777"
                    value={item.reps?.toString() ?? ""}
                    onChangeText={(v) => setField(item.id, "reps", v)}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.small}
                    placeholder="Weight"
                    placeholderTextColor="#777"
                    value={item.weight?.toString() ?? ""}
                    onChangeText={(v) => setField(item.id, "weight", v)}
                    keyboardType="numeric"
                  />
                </View>
              ) : (
                <View style={styles.row}>
                  <TextInput
                    style={styles.small}
                    placeholder="Duration"
                    placeholderTextColor="#777"
                    value={item.duration?.toString() ?? ""}
                    onChangeText={(v) => setField(item.id, "duration", v)}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.small}
                    placeholder="Distance"
                    placeholderTextColor="#777"
                    value={item.distance?.toString() ?? ""}
                    onChangeText={(v) => setField(item.id, "distance", v)}
                    keyboardType="numeric"
                  />
                </View>
              )}

              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => remove(item.id)}
              >
                <Text style={styles.remove}>Entfernen</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      <TouchableOpacity style={styles.addBtn} onPress={add}>
        <Text style={styles.addText}>Exercise hinzufuegen</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.saveBtn, saving && { opacity: 0.6 }]}
        onPress={save}
        disabled={saving}
      >
        <Text style={styles.saveText}>
          {saving ? "Speichert..." : "Tag speichern"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: dark, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: dark },
  logo: {
    fontSize: 20,
    fontWeight: "900",
    color: gold,
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: { color: "#f7f7f7", fontSize: 18, fontWeight: "700", marginBottom: 4 },
  sub: { color: "#aaa", fontSize: 12, marginBottom: 12 },
  text: { color: "#ccc" },
  empty: { color: "#777", marginTop: 12 },
  card: {
    backgroundColor: mid,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  row: { flexDirection: "row", marginBottom: 8 },
  input: {
    backgroundColor: "#222",
    color: "#fff",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#444",
  },
  nameInput: { flex: 1, marginRight: 8 },
  small: {
    flex: 1,
    backgroundColor: "#222",
    color: "#fff",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#444",
    marginRight: 8,
  },
  catBtn: {
    borderWidth: 1,
    borderColor: gold,
    paddingHorizontal: 12,
    justifyContent: "center",
    borderRadius: 8,
  },
  catText: { color: gold, fontWeight: "700" },
  removeBtn: { alignSelf: "flex-end" },
  remove: { color: "#ff5555", fontWeight: "700" },
  addBtn: {
    borderWidth: 1,
    borderColor: gold,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  addText: { color: gold, fontWeight: "700" },
  saveBtn: {
    backgroundColor: gold,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 16,
  },
  saveText: { color: dark, fontWeight: "700", fontSize: 16 },
});

export default PlanDayDetail;
