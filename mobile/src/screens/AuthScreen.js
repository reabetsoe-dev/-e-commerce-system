import { useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";

const INITIAL_FORM = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  token: ""
};

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function isStrongPassword(password) {
  const candidate = String(password || "");
  return (
    candidate.length >= 8 &&
    /[A-Z]/.test(candidate) &&
    /[a-z]/.test(candidate) &&
    /\d/.test(candidate)
  );
}

export default function AuthScreen({ embedded = false }) {
  const navigation = useNavigation();
  const route = useRoute();
  const { login, register, forgotPassword, resetPassword, getApiError } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(INITIAL_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setStatus("");
  };

  const validateForm = () => {
    if (mode === "login") {
      if (!isValidEmail(form.email)) {
        return "Please enter a valid email address.";
      }
      if (!form.password) {
        return "Please enter your password.";
      }
    }

    if (mode === "register") {
      if (!form.name.trim()) {
        return "Please enter your full name.";
      }
      if (!isValidEmail(form.email)) {
        return "Please enter a valid email address.";
      }
      if (!isStrongPassword(form.password)) {
        return "Password must be at least 8 characters and include uppercase, lowercase, and a number.";
      }
      if (form.password !== form.confirmPassword) {
        return "Password and confirm password do not match.";
      }
    }

    if (mode === "forgot" && !isValidEmail(form.email)) {
      return "Please enter a valid email address.";
    }

    if (mode === "reset") {
      if (!form.token.trim()) {
        return "Please enter the reset token.";
      }
      if (!isStrongPassword(form.password)) {
        return "Password must be at least 8 characters and include uppercase, lowercase, and a number.";
      }
      if (form.password !== form.confirmPassword) {
        return "Passwords do not match.";
      }
    }

    return "";
  };

  const onSubmit = async () => {
    setBusy(true);
    setError("");
    setStatus("");

    const validationError = validateForm();
    if (validationError) {
      setBusy(false);
      setError(validationError);
      return;
    }

    try {
      if (mode === "login") {
        const authenticatedUser = await login(form.email.trim(), form.password);
        afterAuth(authenticatedUser);
      } else if (mode === "register") {
        const authenticatedUser = await register(form.name.trim(), form.email.trim(), form.password);
        afterAuth(authenticatedUser);
      } else if (mode === "forgot") {
        const data = await forgotPassword(form.email.trim());
        setStatus(
          data.resetToken
            ? `${data.message} Token: ${data.resetToken}`
            : data.message
        );
        if (data.resetToken) {
          update("token", data.resetToken);
        }
      } else if (mode === "reset") {
        const data = await resetPassword({ token: form.token.trim(), password: form.password });
        setStatus(data.message || "Password reset successful.");
        setMode("login");
      }
    } catch (submitError) {
      setError(getApiError(submitError, "Authentication failed."));
    } finally {
      setBusy(false);
    }
  };

  const afterAuth = (authenticatedUser) => {
    if (embedded) {
      return;
    }

    const nextScreen =
      authenticatedUser?.role === "admin" ? "Admin" : route.params?.redirectScreen || "Home";
    navigation.navigate("Tabs", { screen: nextScreen });
  };

  const title =
    mode === "login"
      ? "Member Login"
      : mode === "register"
      ? "Create Account"
      : mode === "forgot"
      ? "Forgot Password"
      : "Reset Password";

  const submitLabel =
    mode === "login"
      ? "Login"
      : mode === "register"
      ? "Create Account"
      : mode === "forgot"
      ? "Generate Token"
      : "Reset Password";

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.backgroundBase} />
        <View style={styles.orbOne} />
        <View style={styles.orbTwo} />
        <View style={styles.orbThree} />
        <View style={styles.bottomShade} />

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={[styles.card, mode === "register" && styles.cardRegister]}>
            <View style={styles.cardGlow} />

            <View style={styles.avatar}>
              <UserGlyph large />
            </View>

            <Text style={styles.title}>{title}</Text>

            <View style={styles.modeTabs}>
              <ModeButton active={mode === "login"} label="Login" onPress={() => switchMode("login")} />
              <ModeButton active={mode === "register"} label="Register" onPress={() => switchMode("register")} />
            </View>

            <View style={styles.form}>
              {mode === "register" ? (
                <AuthInput
                  icon={<UserGlyph />}
                  placeholder="Full Name"
                  value={form.name}
                  onChangeText={(value) => update("name", value)}
                  autoCapitalize="words"
                />
              ) : null}

              {mode !== "reset" ? (
                <AuthInput
                  icon={<MailGlyph />}
                  placeholder="Email ID"
                  value={form.email}
                  onChangeText={(value) => update("email", value)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              ) : null}

              {mode === "reset" ? (
                <AuthInput
                  icon={<LockGlyph />}
                  placeholder="Reset Token"
                  value={form.token}
                  onChangeText={(value) => update("token", value)}
                  autoCapitalize="none"
                />
              ) : null}

              {mode !== "forgot" ? (
                <AuthInput
                  icon={<LockGlyph />}
                  placeholder="Password"
                  value={form.password}
                  onChangeText={(value) => update("password", value)}
                  secureTextEntry={!showPassword}
                  actionLabel={showPassword ? "HIDE" : "VIEW"}
                  onActionPress={() => setShowPassword((current) => !current)}
                />
              ) : null}

              {mode === "register" || mode === "reset" ? (
                <AuthInput
                  icon={<LockGlyph />}
                  placeholder="Confirm Password"
                  value={form.confirmPassword}
                  onChangeText={(value) => update("confirmPassword", value)}
                  secureTextEntry={!showPassword}
                />
              ) : null}

              {mode === "login" ? (
                <View style={styles.optionsRow}>
                  <Pressable style={styles.rememberRow} onPress={() => setRemember((current) => !current)}>
                    <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
                      {remember ? <CheckGlyph /> : null}
                    </View>
                    <Text style={styles.optionText}>Remember me</Text>
                  </Pressable>
                  <Pressable onPress={() => switchMode("forgot")}>
                    <Text style={styles.optionLink}>Forget password?</Text>
                  </Pressable>
                </View>
              ) : null}

              {error ? <Text style={styles.error}>{error}</Text> : null}
              {status ? <Text style={styles.status}>{status}</Text> : null}

              <Pressable
                style={[styles.submitButton, busy && styles.submitButtonDisabled]}
                onPress={onSubmit}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>{submitLabel}</Text>
                )}
              </Pressable>

              {mode === "login" ? (
                <Pressable style={styles.secondaryLink} onPress={() => switchMode("reset")}>
                  <Text style={styles.secondaryLinkText}>Have a reset token?</Text>
                </Pressable>
              ) : (
                <View style={styles.secondaryActions}>
                  <Pressable onPress={() => switchMode("login")}>
                    <Text style={styles.secondaryLinkText}>Back to login</Text>
                  </Pressable>
                  {mode !== "reset" ? (
                    <Pressable onPress={() => switchMode("reset")}>
                      <Text style={styles.secondaryLinkText}>Have a token?</Text>
                    </Pressable>
                  ) : (
                    <Pressable onPress={() => switchMode("forgot")}>
                      <Text style={styles.secondaryLinkText}>Need a token?</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function ModeButton({ label, active, onPress }) {
  return (
    <Pressable style={[styles.modeButton, active && styles.modeButtonActive]} onPress={onPress}>
      <Text style={[styles.modeButtonText, active && styles.modeButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

function AuthInput({ icon, actionLabel, onActionPress, ...inputProps }) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldIcon}>{icon}</View>
      <TextInput
        {...inputProps}
        style={[styles.input, actionLabel && styles.inputWithAction]}
        placeholderTextColor="rgba(255,255,255,0.72)"
      />
      {actionLabel ? (
        <Pressable style={styles.passwordAction} onPress={onActionPress}>
          <Text style={styles.passwordActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function UserGlyph({ large = false }) {
  return (
    <View style={[styles.userGlyph, large && styles.userGlyphLarge]}>
      <View style={[styles.userHead, large && styles.userHeadLarge]} />
      <View style={[styles.userBody, large && styles.userBodyLarge]} />
    </View>
  );
}

function MailGlyph() {
  return (
    <View style={styles.mailGlyph}>
      <View style={styles.mailLeftFold} />
      <View style={styles.mailRightFold} />
    </View>
  );
}

function LockGlyph() {
  return (
    <View style={styles.lockGlyph}>
      <View style={styles.lockShackle} />
      <View style={styles.lockBody}>
        <View style={styles.lockDot} />
      </View>
    </View>
  );
}

function CheckGlyph() {
  return (
    <View style={styles.checkGlyph}>
      <View style={styles.checkShort} />
      <View style={styles.checkLong} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#2078be"
  },
  safeArea: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#2078be"
  },
  backgroundBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#2078be"
  },
  orbOne: {
    position: "absolute",
    top: -60,
    left: -42,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "rgba(93,213,244,0.58)"
  },
  orbTwo: {
    position: "absolute",
    top: -70,
    right: -60,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(57,188,230,0.36)"
  },
  orbThree: {
    position: "absolute",
    right: -88,
    bottom: 80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(255,255,255,0.08)"
  },
  bottomShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "42%",
    backgroundColor: "rgba(1,9,32,0.24)"
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 24
  },
  card: {
    width: "100%",
    maxWidth: 365,
    position: "relative",
    overflow: "hidden",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
    backgroundColor: "rgba(35,132,204,0.92)",
    shadowColor: "#030f36",
    shadowOpacity: 0.46,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 24 },
    elevation: 16
  },
  cardRegister: {
    paddingTop: 18
  },
  cardGlow: {
    position: "absolute",
    top: -26,
    right: -40,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "rgba(135,236,250,0.2)"
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#213a78",
    shadowColor: "#0b2c6f",
    shadowOpacity: 0.38,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8
  },
  title: {
    marginTop: 14,
    marginBottom: 12,
    textAlign: "center",
    color: "rgba(255,255,255,0.95)",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 6,
    textTransform: "uppercase"
  },
  modeTabs: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16
  },
  modeButton: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.36)",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.08)"
  },
  modeButtonActive: {
    backgroundColor: "#fff",
    shadowColor: "#14408a",
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4
  },
  modeButtonText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
    textTransform: "uppercase"
  },
  modeButtonTextActive: {
    color: "#1f3975"
  },
  form: {
    gap: 11
  },
  field: {
    height: 54,
    position: "relative",
    justifyContent: "center"
  },
  fieldIcon: {
    position: "absolute",
    left: 18,
    zIndex: 2,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center"
  },
  input: {
    height: 54,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.94)",
    borderRadius: 999,
    paddingLeft: 58,
    paddingRight: 24,
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    backgroundColor: "rgba(80,210,240,0.18)",
    shadowColor: "#062a68",
    shadowOpacity: 0.36,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3
  },
  inputWithAction: {
    paddingRight: 78
  },
  passwordAction: {
    position: "absolute",
    right: 10,
    width: 58,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(31,57,117,0.48)"
  },
  passwordActionText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8
  },
  optionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 8,
    marginTop: 1
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  checkbox: {
    width: 15,
    height: 15,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)"
  },
  checkboxChecked: {
    backgroundColor: "#213a78"
  },
  optionText: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  optionLink: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
    textTransform: "uppercase"
  },
  submitButton: {
    alignSelf: "center",
    minWidth: 188,
    minHeight: 52,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    marginTop: 4,
    backgroundColor: "#213a78",
    shadowColor: "#051e5b",
    shadowOpacity: 0.44,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6
  },
  submitButtonDisabled: {
    opacity: 0.7
  },
  submitText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    textTransform: "uppercase"
  },
  error: {
    color: "#fff",
    backgroundColor: "rgba(196,55,58,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    fontWeight: "800"
  },
  status: {
    color: "#fff",
    backgroundColor: "rgba(23,138,83,0.32)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    fontWeight: "800"
  },
  secondaryLink: {
    alignSelf: "center",
    paddingVertical: 2
  },
  secondaryActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 8
  },
  secondaryLinkText: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    textDecorationLine: "underline"
  },
  userGlyph: {
    width: 24,
    height: 24,
    alignItems: "center"
  },
  userGlyphLarge: {
    width: 36,
    height: 36
  },
  userHead: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#fff",
    marginTop: 2
  },
  userHeadLarge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4
  },
  userBody: {
    width: 18,
    height: 10,
    marginTop: 3,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: "#fff",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12
  },
  userBodyLarge: {
    width: 26,
    height: 14,
    marginTop: 5,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16
  },
  mailGlyph: {
    width: 22,
    height: 16,
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 2,
    overflow: "hidden"
  },
  mailLeftFold: {
    position: "absolute",
    left: 2,
    top: 1,
    width: 14,
    height: 2,
    backgroundColor: "#fff",
    transform: [{ rotate: "34deg" }]
  },
  mailRightFold: {
    position: "absolute",
    right: 2,
    top: 1,
    width: 14,
    height: 2,
    backgroundColor: "#fff",
    transform: [{ rotate: "-34deg" }]
  },
  lockGlyph: {
    width: 22,
    height: 24,
    alignItems: "center",
    justifyContent: "flex-end"
  },
  lockShackle: {
    position: "absolute",
    top: 1,
    width: 13,
    height: 12,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: "#fff",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8
  },
  lockBody: {
    width: 17,
    height: 14,
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center"
  },
  lockDot: {
    width: 3,
    height: 5,
    borderRadius: 2,
    backgroundColor: "#fff"
  },
  checkGlyph: {
    width: 10,
    height: 8,
    position: "relative"
  },
  checkShort: {
    position: "absolute",
    left: 1,
    bottom: 2,
    width: 5,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#fff",
    transform: [{ rotate: "45deg" }]
  },
  checkLong: {
    position: "absolute",
    right: 0,
    bottom: 3,
    width: 9,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#fff",
    transform: [{ rotate: "-48deg" }]
  }
});
