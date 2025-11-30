import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { WorkoutPlan } from "../../src/domain/types";
import { loadPlans } from "../../src/services/workoutPlanService";

const gold = "#f5b400";
const dark = "#050507";
const mid = "#141414";

const WorkoutScreen = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [plans, setPlans] = useState<WorkoutPlan[]>([]);

  const load = async () => {
    if (!user) return;
    const p = await loadPlans(user.uid);
    setPlans(p);
  };

  useEffect(() => {
    load();
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>PeakLog</Text>
      <Text style={styles.title}>Workout starten</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Eigenes Workout erstellen</Text>

        <TouchableOpacity
          style={styles.typeButton}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/workoutLive",
              params: { mode: "free", initialCategory: "strength" },
            })
          }
        >
          <Text style={styles.typeText}>Krafttraining starten</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.typeButton}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/workoutLive",
              params: { mode: "free", initialCategory: "cardio" },
            })
          }
        >
          <Text style={styles.typeText}>Cardio starten</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Oder aus deinem Trainingsplan:</Text>

      <FlatList
        data={plans}
        keyExtractor={(p) => p.id}
        ListEmptyComponent={<Text style={styles.empty}>Keine Plaene vorhanden.</Text>}
        renderItem={({ item }) => (
          <View style={styles.planCard}>
            <Text style={styles.planName}>{item.name}</Text>

            {item.workoutDays
              .filter((d) => !d.isRestDay)
              .map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={styles.dayButton}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/workoutLive",
                      params: {
                        mode: "plan",
                        planId: item.id,
                        dayId: d.id,
                      },
                    })
                  }
                >
                  <Text style={styles.dayText}>
                    {d.weekday} ({d.exercises.length} Exercises)
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: dark, padding: 16 },
  logo: {
    fontSize: 20,
    fontWeight: "900",
    color: gold,
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: { fontSize: 18, color: "#f7f7f7", fontWeight: "700", marginBottom: 16 },
  subtitle: { color: "#ccc", marginTop: 20, marginBottom: 10 },
  empty: { color: "#666", marginTop: 20 },
  card: {
    backgroundColor: mid,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10,
  },
  typeButton: {
    backgroundColor: "#222",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: gold,
    marginTop: 8,
  },
  typeText: { color: gold, fontWeight: "700", textAlign: "center" },
  planCard: {
    backgroundColor: mid,
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#333",
  },
  planName: { color: "#fff", fontSize: 17, fontWeight: "700", marginBottom: 6 },
  dayButton: {
    backgroundColor: "#222",
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#333",
  },
  dayText: { color: "#ccc" },
});

export default WorkoutScreen;
