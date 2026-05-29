import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function PageHeader({ title, subtitle, eyebrow, fallback = "Products", children }) {
  const navigation = useNavigation();

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate(fallback);
  };

  return (
    <>
      <View style={styles.navLine}>
        <Pressable style={styles.backButton} onPress={goBack} accessibilityLabel="Go back">
          <Text style={styles.backText}>{"<"}</Text>
        </Pressable>
        <Text style={styles.crumb}>{fallback === "Products" ? "Home / " : ""}{title}</Text>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroAccent} />
        <View style={styles.heroCircle} />
        <View style={styles.heroSmallCircle} />
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {children}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  navLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#dce8f1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    shadowColor: "#0b376b",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  backText: {
    color: "#0644ca",
    fontSize: 22,
    fontWeight: "900"
  },
  crumb: {
    flex: 1,
    color: "#10264a",
    fontWeight: "900"
  },
  hero: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: "#0e7a78",
    padding: 18,
    marginBottom: 12,
    minHeight: 142,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.36)"
  },
  heroAccent: {
    position: "absolute",
    left: -80,
    bottom: -90,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "#188fc0",
    opacity: 0.65
  },
  heroCircle: {
    position: "absolute",
    right: -78,
    top: -86,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#0b376b",
    opacity: 0.5
  },
  heroSmallCircle: {
    position: "absolute",
    right: 34,
    bottom: 22,
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "rgba(255,255,255,0.12)"
  },
  eyebrow: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
    color: "rgba(255,255,255,0.92)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 9,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase"
  },
  title: {
    color: "#fff",
    fontSize: 27,
    fontWeight: "900",
    letterSpacing: -0.4
  },
  subtitle: {
    color: "rgba(255,255,255,0.88)",
    marginTop: 7,
    lineHeight: 20,
    fontWeight: "700"
  }
});
