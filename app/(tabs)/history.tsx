import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { listWorkouts } from "../../src/services/workoutService";

const gold = "#f5b400";
const dark = "#050507";
const mid = "#141414";

type HistoryItem = {
  id: string;
  username: string;
  exercises: any[];
  date: any;
  workoutPlanId?: string | null;
};

const HistoryScreen: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const items = await listWorkouts(user.uid);
    setData(items as HistoryItem[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [user])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>PeakLog</Text>
      <Text style={styles.title}>Workout History</Text>
      <Text style={styles.text}>Abgeschlossene Workouts</Text>

      <FlatList
        data={data}
        keyExtractor={(w) => w.id}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={<Text style={styles.empty}>Keine Workouts gefunden.</Text>}
        renderItem={({ item }) => {
          let dateLabel = "Datum unbekannt";
          if (item.date && typeof (item.date as any).toDate === "function") {
            dateLabel = (item.date as any).toDate().toLocaleDateString();
          }
          const typLabel = item.workoutPlanId ? "Plan-Workout" : "Eigenes Workout";
          return (
            <View style={styles.card}>
              <Text style={styles.name}>{dateLabel}</Text>
              <Text style={styles.meta}>
                {typLabel} • {item.exercises.length} Exercises
              </Text>
            </View>
          );
        }}
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
  title: { color: "#f7f7f7", fontSize: 18, fontWeight: "700", marginBottom: 4 },
  text: { color: "#ccc", marginBottom: 12 },
  empty: { color: "#666", marginTop: 20 },
  card: {
    backgroundColor: mid,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 8,
  },
  name: { color: "#fff", fontSize: 16, fontWeight: "700" },
  meta: { color: "#aaa", marginTop: 4, fontSize: 12 },
});

export default HistoryScreen;
