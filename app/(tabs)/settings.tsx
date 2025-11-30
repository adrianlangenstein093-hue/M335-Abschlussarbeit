import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";

const gold = "#f5b400";
const dark = "#050507";
const mid = "#141414";

const SettingsScreen: React.FC = () => {
  const { user, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e: any) {
      Alert.alert("Fehler", e.message ?? "Logout fehlgeschlagen");
    }
  };

  const handleChangePassword = async () => {
    setMessage(null);
    setStatus("idle");

    if (!user || !user.email) {
      setStatus("error");
      setMessage("Kein Nutzer eingeloggt oder keine E-Mail vorhanden.");
      return;
    }

    if (!currentPassword || !newPassword) {
      setStatus("error");
      setMessage("Bitte altes und neues Passwort eingeben.");
      return;
    }

    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );

      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setStatus("success");
      setMessage("Passwort erfolgreich geändert.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (e: any) {
      console.error(e);
      setStatus("error");
      setMessage("Passwortänderung fehlgeschlagen. Prüfe dein altes Passwort.");
    } finally {
      setLoading(false);
    }
  };

  const name = user?.displayName || user?.email || "Unbekannt";

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>PeakLog</Text>
      <Text style={styles.title}>Profil</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Eingeloggt als</Text>
        <Text style={styles.value}>{name}</Text>

        {user?.uid ? (
          <>
            <Text style={styles.labelSmall}>User ID</Text>
            <Text style={styles.valueSmall}>{user.uid}</Text>
          </>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Passwort ändern</Text>
        <Text style={styles.infoText}>
          Gib zuerst dein aktuelles Passwort ein, danach das neue Passwort.
        </Text>

        <TextInput
          style={styles.input}
          secureTextEntry
          placeholder="Altes Passwort"
          placeholderTextColor="#666"
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />

        <TextInput
          style={styles.input}
          secureTextEntry
          placeholder="Neues Passwort"
          placeholderTextColor="#666"
          value={newPassword}
          onChangeText={setNewPassword}
        />

        {message && (
          <Text
            style={
              status === "success"
                ? styles.messageSuccess
                : styles.messageError
            }
          >
            {message}
          </Text>
        )}

        <TouchableOpacity
          style={[
            styles.changePwButton,
            loading && { opacity: 0.6 },
          ]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          <Text style={styles.changePwText}>
            {loading ? "Ändere Passwort..." : "Passwort ändern"}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
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
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#f7f7f7",
    marginBottom: 16,
  },
  card: {
    backgroundColor: mid,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 24,
  },
  label: {
    color: "#aaa",
    marginBottom: 4,
    fontSize: 13,
  },
  value: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  labelSmall: {
    color: "#777",
    marginTop: 6,
    fontSize: 11,
  },
  valueSmall: {
    color: "#ccc",
    fontSize: 11,
  },
  sectionTitle: {
    color: "#f7f7f7",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  infoText: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#1f1f1f",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: "#fff",
    fontSize: 14,
    marginBottom: 10,
  },
  messageSuccess: {
    color: "#6dd96d",
    fontSize: 12,
    marginBottom: 8,
  },
  messageError: {
    color: "#ff6b6b",
    fontSize: 12,
    marginBottom: 8,
  },
  changePwButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: gold,
    paddingVertical: 10,
    alignItems: "center",
  },
  changePwText: {
    color: gold,
    fontWeight: "600",
    fontSize: 14,
  },
  logoutButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: gold,
    paddingVertical: 12,
    alignItems: "center",
  },
  logoutText: {
    color: gold,
    fontWeight: "600",
  },
});

export default SettingsScreen;
