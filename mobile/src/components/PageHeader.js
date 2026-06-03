import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

const TAB_ROUTES = new Set(["Home", "Catalog", "Hosting", "Wishlist", "Cart", "Orders", "Profile", "Admin"]);

export default function PageHeader({ title, subtitle, eyebrow, fallback = "Catalog", children }) {
  const navigation = useNavigation();

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    if (TAB_ROUTES.has(fallback)) {
      navigation.navigate("Tabs", { screen: fallback });
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
        <Text style={styles.crumb}>{fallback === "Catalog" ? "Home / " : ""}{title}</Text>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,217,255,0.28)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(3,217,255,0.08)",
    shadowColor: "#03d9ff",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  backText: {
    color: "#03d9ff",
    fontSize: 22,
    fontWeight: "900"
  },
  crumb: {
    flex: 1,
    color: "#8ea7c4",
    fontWeight: "900"
  },
  hero: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 16,
    backgroundColor: "#06152b",
    padding: 18,
    marginBottom: 12,
    minHeight: 142,
    borderWidth: 1,
    borderColor: "rgba(0,217,255,0.26)",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5
  },
  heroAccent: {
    position: "absolute",
    left: -80,
    bottom: -90,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "#03d9ff",
    opacity: 0.18
  },
  heroCircle: {
    position: "absolute",
    right: -78,
    top: -86,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#145cff",
    opacity: 0.28
  },
  heroSmallCircle: {
    position: "absolute",
    right: 34,
    bottom: 22,
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "rgba(32,242,163,0.12)"
  },
  eyebrow: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "rgba(0,217,255,0.12)",
    color: "#20f2a3",
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
    color: "#c3d2e4",
    marginTop: 7,
    lineHeight: 20,
    fontWeight: "700"
  }
});
