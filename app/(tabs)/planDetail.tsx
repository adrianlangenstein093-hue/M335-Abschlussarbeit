import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { WorkoutPlan, WorkoutPlanDay } from "../../src/domain/types";
import {
    ensureDayExists,
    getWorkoutPlans,
    updateWorkoutPlan,
} from "../../src/services/workoutPlanService";

const gold = "#f5b400";
const dark = "#050507";
const mid = "#141414";

const weekdays = [
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag",
];

const PlanDetailScreen: React.FC = () => {
  const params = useLocalSearchParams();
  const planId = typeof params.planId === "string" ? params.planId : "";
  const { user } = useAuth();
  const router = useRouter();

  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [saving, setSaving] = useState(false);

  const loadPlan = async () => {
    if (!user || !planId) return;
    try {
      const all = await getWorkoutPlans(user.uid);
      const found = all.find((p) => p.id === planId);
      if (!found) {
        Alert.alert("Fehler", "Plan wurde nicht gefunden.");
        router.back();
        return;
      }
      setPlan(found);
    } catch (e: any) {
      Alert.alert("Fehler", e.message ?? "Konnte Plan nicht laden.");
    }
  };

  useEffect(() => {
    loadPlan();
  }, [user?.uid, planId]);

  const toggleDay = async (weekday: string) => {
    if (!user || !plan) return;

    const existing = plan.workoutDays.find((d) => d.weekday === weekday);
    if (existing) {
      Alert.alert(
        "Hinweis",
        "Days werden jetzt persistent gespeichert, Loeschen ist im MVP nicht vorgesehen."
      );
      return;
    }

    const created = await ensureDayExists(user.uid, plan.id, weekday);
    setPlan({
      ...plan,
      workoutDays: [...plan.workoutDays, created],
    });
  };

  const toggleRestDay = (dayId: string) => {
    if (!plan) return;
    const days = plan.workoutDays.map((d) =>
      d.id === dayId ? { ...d, isRestDay: !d.isRestDay } : d
    );
    setPlan({ ...plan, workoutDays: days });
  };

  const openDay = (day: WorkoutPlanDay) => {
    if (day.isRestDay) {
      Alert.alert("Info", "Restday hat keine Exercises.");
      return;
    }
    router.push({
      pathname: "/(tabs)/planDayDetail",
      params: { planId: plan?.id ?? "", dayId: day.id },
    });
  };

  const handleSave = async () => {
    if (!user || !plan) return;
    try {
      setSaving(true);
      await updateWorkoutPlan(user.uid, plan);
      Alert.alert("Gespeichert", "Plan wurde aktualisiert.");
      router.back();
    } catch (e: any) {
      Alert.alert("Fehler", e.message ?? "Plan konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  };

  if (!plan) {
    return (
      <View style={styles.center}>
        <Text style={styles.logo}>PeakLog</Text>
        <Text style={styles.text}>Plan wird geladen...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>PeakLog</Text>
      <Text style={styles.title}>{plan.name}</Text>
      <Text style={styles.text}>Waehle Trainingstage, Restdays und oeffne Tage.</Text>
      <Text style={styles.hint}>
        Tap: Day erstellen/oeffnen. Long-Press: Restday toggeln.
      </Text>

      <FlatList
        data={weekdays}
        keyExtractor={(w) => w}
        renderItem={({ item }) => {
          const day = plan.workoutDays.find((d) => d.weekday === item);
          const active = !!day;
          const isRest = day?.isRestDay ?? false;

          const handlePress = async () => {
            if (!day) {
              await toggleDay(item);
              return;
            }
            openDay(day);
          };

          return (
            <TouchableOpacity
              style={[
                styles.dayRow,
                active && styles.dayRowActive,
                isRest && styles.dayRowRest,
              ]}
              onPress={handlePress}
              onLongPress={() => day && toggleRestDay(day.id)}
              delayLongPress={300}
            >
              <View>
                <Text style={styles.dayText}>{item}</Text>
                {day && !day.isRestDay && (
                  <Text style={styles.dayMeta}>
                    {day.exercises.length} Exercises
                  </Text>
                )}
                {day && day.isRestDay && (
                  <Text style={styles.dayMeta}>Restday</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity
        style={[styles.saveButton, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveText}>
          {saving ? "Speichert..." : "Plan speichern"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: dark, padding: 16 },
  center: {
    flex: 1,
    backgroundColor: dark,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    fontSize: 20,
    fontWeight: "900",
    color: gold,
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#f7f7f7",
    marginBottom: 8,
  },
  text: { color: "#eee", marginBottom: 8, fontSize: 13 },
  hint: { color: "#888", marginBottom: 16, fontSize: 12 },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: mid,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  dayRowActive: {
    borderColor: gold,
  },
  dayRowRest: {
    backgroundColor: "#3a1d1d",
  },
  dayText: { color: "#fff", fontSize: 16 },
  dayMeta: { color: "#aaa", fontSize: 12, marginTop: 2 },
  saveButton: {
    marginTop: 16,
    backgroundColor: gold,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveText: {
    color: dark,
    fontWeight: "700",
    fontSize: 16,
  },
});

export default PlanDetailScreen;
