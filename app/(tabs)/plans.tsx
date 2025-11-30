import { useRouter } from "expo-router";
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
import { WorkoutPlan } from "../../src/domain/types";
import {
    createEmptyWorkoutPlan,
    getWorkoutPlans,
    softDeleteWorkoutPlan,
} from "../../src/services/workoutPlanService";

const gold = "#f5b400";
const dark = "#050507";
const mid = "#141414";

const PlansScreen: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");

  const loadPlans = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getWorkoutPlans(user.uid);
      setPlans(data);
    } catch (e: any) {
      Alert.alert("Fehler", e.message ?? "Konnte Plaene nicht laden.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, [user?.uid]);

  const handleCreate = async () => {
    if (!user) {
      Alert.alert("Fehler", "Bitte zuerst einloggen.");
      return;
    }
    const trimmed = newName.trim();
    if (!trimmed || trimmed.length < 3) {
      Alert.alert("Validation", "Planname muss mindestens 3 Zeichen haben.");
      return;
    }
    try {
      await createEmptyWorkoutPlan(user.uid, trimmed);
      setNewName("");
      await loadPlans();
    } catch (e: any) {
      Alert.alert("Fehler", e.message ?? "Plan konnte nicht erstellt werden.");
    }
  };

  const handleDelete = async (planId: string) => {
    if (!user) return;
    try {
      await softDeleteWorkoutPlan(user.uid, planId);
      await loadPlans();
    } catch (e: any) {
      Alert.alert("Fehler", e.message ?? "Plan konnte nicht geloescht werden.");
    }
  };

  const openDetail = (planId: string) => {
    router.push({
      pathname: "/(tabs)/planDetail",
      params: { planId },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>PeakLog</Text>
      <Text style={styles.title}>Deine Trainingsplaene</Text>

      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Neuer Planname"
          placeholderTextColor="#777"
          value={newName}
          onChangeText={setNewName}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleCreate}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={loadPlans}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Noch keine Plaene. Lege oben deinen ersten Plan an.
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.planItem}
            onPress={() => openDetail(item.id)}
          >
            <View>
              <Text style={styles.planName}>{item.name}</Text>
              <Text style={styles.planMeta}>
                {(item.workoutDays ? item.workoutDays.length : 0) + " Tage"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(item.id)}
            >
              <Text style={styles.deleteText}>Loeschen</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dark,
    padding: 16,
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
    fontWeight: "700",
    color: "#f7f7f7",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: mid,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#333",
  },
  addButton: {
    marginLeft: 8,
    backgroundColor: gold,
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: dark,
    fontSize: 24,
    fontWeight: "bold",
  },
  empty: {
    color: "#aaa",
    marginTop: 24,
    fontSize: 13,
  },
  planItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: mid,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  planName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  planMeta: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 2,
  },
  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ff5555",
  },
  deleteText: {
    color: "#ff5555",
    fontWeight: "600",
  },
});

export default PlansScreen;
