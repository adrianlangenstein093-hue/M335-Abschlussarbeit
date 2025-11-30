import { Gyroscope, Pedometer } from "expo-sensors";
import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";

const gold = "#f5b400";
const dark = "#050507";
const mid = "#141414";

const PeakLogHome: React.FC = () => {
  const { user, loading, login, register } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [isPedometerAvailable, setIsPedometerAvailable] = useState<
    "unbekannt" | "verfügbar" | "nicht verfügbar"
  >("unbekannt");
  const [stepCount, setStepCount] = useState(0);
  const [tracking, setTracking] = useState(true);

  const [gyroData, setGyroData] = useState<{
    x: number;
    y: number;
    z: number;
  } | null>(null);

  useEffect(() => {
    let pedometerSub: any;
    let gyroSub: any;

    const subscribe = async () => {
      if (!user) {
        setStepCount(0);
        setGyroData(null);
        return;
      }

      try {
        const available = await Pedometer.isAvailableAsync();
        setIsPedometerAvailable(available ? "verfügbar" : "nicht verfügbar");

        if (available && tracking) {
          pedometerSub = Pedometer.watchStepCount((result) => {
            setStepCount(result.steps);
          });
        }

        if (tracking) {
          gyroSub = Gyroscope.addListener((data) => {
            setGyroData(data);
          });
          Gyroscope.setUpdateInterval(400);
        } else {
          setGyroData(null);
        }
      } catch (e) {
        setIsPedometerAvailable("nicht verfügbar");
        setGyroData(null);
      }
    };

    subscribe();

    return () => {
      if (pedometerSub) {
        pedometerSub.remove();
      }
      if (gyroSub) {
        gyroSub.remove();
      }
    };
  }, [tracking, user]);

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.logo}>PeakLog</Text>
        <Text style={styles.text}>Laedt...</Text>
      </View>
    );
  }

  if (user) {
    return (
      <View style={styles.container}>
        <Text style={styles.logo}>PeakLog</Text>
        <Text style={styles.welcome}>Willkommen</Text>
        <Text style={styles.user}>{user.displayName || user.email}</Text>
        <Text style={styles.sub}>
          Waehle unten einen Tab, um Plaene, Workouts oder History zu nutzen.
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Schrittzähler</Text>
          <Text style={styles.infoText}>
            Sensorstatus: {isPedometerAvailable}
          </Text>

          <View style={styles.row}>
            <Text style={styles.label}>Tracking aktiv</Text>
            <Switch value={tracking} onValueChange={setTracking} />
          </View>

          <Text style={styles.stepsLabel}>Aktuelle Schritte</Text>
          <Text style={styles.stepsValue}>{stepCount}</Text>

          <View style={{ marginTop: 16 }}>
            <Text style={styles.sectionTitle}>Gyroskop</Text>
            {gyroData ? (
              <Text style={styles.gyroText}>
                x: {gyroData.x.toFixed(2)} | y: {gyroData.y.toFixed(2)} | z:{" "}
                {gyroData.z.toFixed(2)}
              </Text>
            ) : (
              <Text style={styles.infoText}>
                Keine Gyroskop-Daten (Tracking aus oder kein Sensor).
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  }

  const handleSubmit = async () => {
    if (!email || !password || (mode === "register" && !username)) {
      Alert.alert("Fehler", "Bitte alle Pflichtfelder ausfuellen.");
      return;
    }

    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, username.trim());
      }
      setPassword("");
    } catch (e: any) {
      Alert.alert("Fehler", e.message ?? "Unbekannter Fehler");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>PeakLog</Text>
      <Text style={styles.subtitle}>
        Dein Log fuer starke Lifts und saubere Sessions.
      </Text>

      {mode === "register" && (
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#777"
          value={username}
          onChangeText={setUsername}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="E-Mail"
        placeholderTextColor="#777"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Passwort"
        placeholderTextColor="#777"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit}>
        <Text style={styles.primaryButtonText}>
          {mode === "login" ? "Einloggen" : "Registrieren"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          setMode((m) => (m === "login" ? "register" : "login"))
        }
      >
        <Text style={styles.link}>
          {mode === "login"
            ? "Noch kein Account? Registrieren"
            : "Schon Account? Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dark,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  center: {
    flex: 1,
    backgroundColor: dark,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  logo: {
    fontSize: 32,
    fontWeight: "900",
    color: gold,
    marginBottom: 8,
    letterSpacing: 2,
  },
  subtitle: {
    color: "#ddd",
    marginBottom: 32,
    fontSize: 14,
  },
  text: {
    color: "#eee",
    fontSize: 16,
  },
  welcome: {
    color: "#eee",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
  },
  user: {
    color: gold,
    fontSize: 18,
    marginTop: 4,
  },
  sub: {
    color: "#aaa",
    marginTop: 12,
    marginBottom: 16,
    textAlign: "center",
    fontSize: 13,
  },
  input: {
    backgroundColor: mid,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#fff",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  primaryButton: {
    backgroundColor: gold,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: dark,
    fontWeight: "700",
    fontSize: 16,
  },
  link: {
    color: gold,
    marginTop: 16,
    textAlign: "center",
  },
  card: {
    backgroundColor: mid,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    marginTop: 20,
  },
  sectionTitle: {
    color: "#f7f7f7",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  infoText: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: {
    color: "#ddd",
    fontSize: 14,
  },
  stepsLabel: {
    color: "#aaa",
    fontSize: 13,
  },
  stepsValue: {
    color: gold,
    fontSize: 28,
    fontWeight: "800",
    marginTop: 4,
  },
  gyroText: {
    color: "#ddd",
    fontSize: 13,
  },
});

export default PeakLogHome;
