import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, logout, updateProfile, getApiError } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    currentPassword: "",
    newPassword: ""
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const onSubmit = async () => {
    setBusy(true);
    setStatus("");
    setError("");
    try {
      await updateProfile({
        name: form.name,
        currentPassword: form.currentPassword || undefined,
        newPassword: form.newPassword || undefined
      });
      setStatus("Profile updated successfully.");
      setForm((current) => ({ ...current, currentPassword: "", newPassword: "" }));
    } catch (submitError) {
      setError(getApiError(submitError, "Failed to update profile."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <PageHeader title="User Profile" subtitle="Manage your account details and password securely." />
      {status ? <Text style={styles.status}>{status}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={form.name}
          onChangeText={(value) => setForm((current) => ({ ...current, name: value }))}
        />
        <Text style={styles.label}>Email</Text>
        <TextInput style={[styles.input, styles.disabledInput]} value={user?.email || ""} editable={false} />
        <Text style={styles.label}>Role</Text>
        <Text style={styles.value}>{user?.role}</Text>
        <Text style={styles.label}>Current Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            value={form.currentPassword}
            onChangeText={(value) => setForm((current) => ({ ...current, currentPassword: value }))}
            placeholder="Required only if changing password"
            placeholderTextColor="#8ea7c4"
            secureTextEntry={!showCurrent}
          />
          <Pressable style={styles.passwordToggle} onPress={() => setShowCurrent((state) => !state)}>
            <Text style={styles.passwordToggleText}>{showCurrent ? "Hide" : "Show"}</Text>
          </Pressable>
        </View>
        <Text style={styles.label}>New Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            value={form.newPassword}
            onChangeText={(value) => setForm((current) => ({ ...current, newPassword: value }))}
            placeholder="At least 8 chars with mixed case and number"
            placeholderTextColor="#8ea7c4"
            secureTextEntry={!showNew}
          />
          <Pressable style={styles.passwordToggle} onPress={() => setShowNew((state) => !state)}>
            <Text style={styles.passwordToggleText}>{showNew ? "Hide" : "Show"}</Text>
          </Pressable>
        </View>
        <Pressable style={[styles.primaryButton, busy && styles.disabled]} onPress={onSubmit} disabled={busy}>
          <Text style={styles.primaryButtonText}>{busy ? "Saving..." : "Save Profile"}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>More Pages</Text>
        <NavButton label="About Datamak" onPress={() => navigation.navigate("About")} />
        <NavButton label="Contact & Support" onPress={() => navigation.navigate("Contact")} />
        <NavButton label="Frequently Asked Questions" onPress={() => navigation.navigate("FAQ")} />
        {user?.role === "admin" ? (
          <NavButton label="Admin Control Center" onPress={() => navigation.navigate("Admin")} />
        ) : null}
      </View>

      <Pressable style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

function NavButton({ label, onPress }) {
  return (
    <Pressable style={styles.navButton} onPress={onPress}>
      <Text style={styles.navButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#f5f8fb"
  },
  content: {
    padding: 12,
    paddingBottom: 28,
    gap: 10
  },
  card: {
    borderWidth: 1,
    borderColor: "#dce8f1",
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 14,
    gap: 8
  },
  sectionTitle: {
    color: "#12384b",
    fontSize: 18,
    fontWeight: "900"
  },
  label: {
    color: "#5f7280",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    marginTop: 4
  },
  value: {
    color: "#163a4c",
    fontWeight: "800"
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccddda",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    color: "#163a4c",
    fontWeight: "800"
  },
  disabledInput: {
    color: "#607582",
    backgroundColor: "#f5f8f7"
  },
  passwordRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "stretch"
  },
  passwordInput: {
    flex: 1
  },
  passwordToggle: {
    width: 70,
    borderWidth: 1,
    borderColor: "#d8e5ff",
    borderRadius: 12,
    backgroundColor: "#f5f8ff",
    alignItems: "center",
    justifyContent: "center"
  },
  passwordToggleText: {
    color: "#0644ca",
    fontWeight: "900"
  },
  primaryButton: {
    backgroundColor: "#0644ca",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 4
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "900"
  },
  navButton: {
    borderWidth: 1,
    borderColor: "#c8deda",
    backgroundColor: "#f2f8f6",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12
  },
  navButtonText: {
    color: "#173240",
    fontWeight: "900"
  },
  logoutBtn: {
    backgroundColor: "rgba(255,107,133,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,107,133,0.36)",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 13
  },
  logoutText: {
    color: "#ff8aa0",
    fontWeight: "900"
  },
  disabled: {
    opacity: 0.65
  },
  status: {
    color: "#1e7d52",
    backgroundColor: "#eaf9f0",
    borderWidth: 1,
    borderColor: "#c4e9d2",
    borderRadius: 10,
    padding: 10,
    fontWeight: "700"
  },
  error: {
    color: "#b2353b",
    backgroundColor: "#fceced",
    borderWidth: 1,
    borderColor: "#f4c9cb",
    borderRadius: 10,
    padding: 10,
    fontWeight: "700"
  }
});
