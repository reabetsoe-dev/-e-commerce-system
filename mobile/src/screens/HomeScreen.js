import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { resolveAssetUrl } from "../api/client";
import { useAuth } from "../context/AuthContext";

const TRUST_ITEMS = [
  { title: "Secure Payments", text: "100% secure checkout", icon: "shield-checkmark-outline" },
  { title: "Fast Delivery", text: "Across Lesotho", icon: "car-outline" },
  { title: "Quality Products", text: "Genuine and reliable", icon: "ribbon-outline" },
  { title: "24/7 Support", text: "We're here to help", icon: "headset-outline" }
];

const PUBLIC_LINKS = [
  { label: "Catalog", screen: "Catalog", icon: "storefront-outline" },
  { label: "Hosting", screen: "Hosting", icon: "server-outline" },
  { label: "About", screen: "About", icon: "business-outline" },
  { label: "Contact", screen: "Contact", icon: "mail-outline" },
  { label: "FAQ", screen: "FAQ", icon: "help-circle-outline" }
];

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";
  const primaryScreen = isAdmin ? "Admin" : "Catalog";

  const goToAuth = () => {
    navigation.navigate("Auth", { redirectScreen: "Home" });
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroHeader}>
          <View style={styles.logo}>
            <Text style={styles.logoMark}>D</Text>
            <View style={styles.logoCopy}>
              <Text style={styles.logoTitle}>Datamak Technologies</Text>
              <Text style={styles.logoSub}>Shop Smart. Build Fast. Host Secure.</Text>
            </View>
          </View>

          {!user ? (
            <Pressable style={styles.headerButton} onPress={goToAuth}>
              <Text style={styles.headerButtonText}>Login / Register</Text>
            </Pressable>
          ) : (
            <View style={styles.userActions}>
              <Pressable
                style={styles.userChip}
                onPress={() => navigation.navigate(isAdmin ? "Admin" : "Profile")}
              >
                <Ionicons name="person-circle-outline" size={18} color="#0644ca" />
                <Text style={styles.userChipText} numberOfLines={1}>
                  Hi, {user.name}
                </Text>
              </Pressable>
              <Pressable style={styles.logoutButton} onPress={logout}>
                <Ionicons name="log-out-outline" size={18} color="#ff8aa0" />
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.heroBody}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Power Your World with Reliable Technology</Text>
            <Text style={styles.heroText}>
              Shop the latest computers, ICT products, software, and web hosting solutions.
            </Text>
            <View style={styles.heroActions}>
              <Pressable style={styles.primaryButton} onPress={() => navigation.navigate(primaryScreen)}>
                <Ionicons name={isAdmin ? "shield-checkmark-outline" : "bag-outline"} size={18} color="#fff" />
                <Text style={styles.primaryButtonText}>{isAdmin ? "Admin Dashboard" : "Shop Now"}</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("Hosting")}>
                <Ionicons name="server-outline" size={18} color="#03d9ff" />
                <Text style={styles.secondaryButtonText}>Hosting</Text>
              </Pressable>
            </View>
          </View>

          <Image
            source={{ uri: resolveAssetUrl("/images/tech-e-comm.jpg") }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>
      </View>

      <View style={styles.trustGrid}>
        {TRUST_ITEMS.map((item) => (
          <View style={styles.trustCard} key={item.title}>
            <View style={styles.trustIcon}>
              <Ionicons name={item.icon} size={20} color="#20f2a3" />
            </View>
            <View style={styles.trustCopy}>
              <Text style={styles.trustTitle}>{item.title}</Text>
              <Text style={styles.trustText}>{item.text}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.linkPanel}>
        <Text style={styles.sectionTitle}>Explore Datamak</Text>
        <View style={styles.linkGrid}>
          {PUBLIC_LINKS.map((item) => (
            <Pressable
              style={styles.linkButton}
              key={item.screen}
              onPress={() => navigation.navigate(item.screen)}
            >
              <Ionicons name={item.icon} size={20} color="#0644ca" />
              <Text style={styles.linkButtonText}>{item.label}</Text>
            </Pressable>
          ))}
          {user && !isAdmin ? (
            <Pressable style={styles.linkButton} onPress={() => navigation.navigate("Wishlist")}>
              <Ionicons name="heart-outline" size={20} color="#0644ca" />
              <Text style={styles.linkButtonText}>Wishlist</Text>
            </Pressable>
          ) : null}
          {isAdmin ? (
            <Pressable style={styles.linkButton} onPress={() => navigation.navigate("Admin")}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#0644ca" />
              <Text style={styles.linkButtonText}>Admin</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#f5f8fb"
  },
  content: {
    padding: 14,
    paddingBottom: 30,
    gap: 14
  },
  hero: {
    borderWidth: 1,
    borderColor: "#dbe5ef",
    borderRadius: 18,
    backgroundColor: "#fff",
    overflow: "hidden"
  },
  heroHeader: {
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#edf2f7"
  },
  logo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  logoMark: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#12b886",
    color: "#fff",
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 22,
    fontWeight: "900"
  },
  logoCopy: {
    flex: 1
  },
  logoTitle: {
    color: "#07142a",
    fontSize: 16,
    fontWeight: "900"
  },
  logoSub: {
    color: "#53647c",
    fontSize: 12,
    fontWeight: "700"
  },
  headerButton: {
    minHeight: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fbff",
    borderWidth: 1,
    borderColor: "#dce6f0",
    paddingHorizontal: 14
  },
  headerButtonText: {
    color: "#07142a",
    fontWeight: "900"
  },
  userActions: {
    flexDirection: "row",
    gap: 8
  },
  userChip: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dce6f0",
    backgroundColor: "#f8fbff",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 7
  },
  userChipText: {
    flex: 1,
    color: "#07142a",
    fontWeight: "900"
  },
  logoutButton: {
    width: 46,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,107,133,0.35)",
    backgroundColor: "rgba(255,107,133,0.12)",
    alignItems: "center",
    justifyContent: "center"
  },
  heroBody: {
    gap: 12,
    padding: 14,
    backgroundColor: "#fff"
  },
  heroCopy: {
    gap: 11,
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#061333"
  },
  heroTitle: {
    color: "#fff",
    fontSize: 31,
    lineHeight: 37,
    fontWeight: "900"
  },
  heroText: {
    color: "#c3d2e4",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700"
  },
  heroActions: {
    flexDirection: "row",
    gap: 9
  },
  primaryButton: {
    flex: 1.2,
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: "#0644ca",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "900"
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(42,177,255,0.5)",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7
  },
  secondaryButtonText: {
    color: "#03d9ff",
    fontWeight: "900"
  },
  heroImage: {
    width: "100%",
    height: 210,
    borderRadius: 12,
    backgroundColor: "#eef3f8"
  },
  trustGrid: {
    gap: 10
  },
  trustCard: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: "#e3e9f3",
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  trustIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(32,242,163,0.12)",
    alignItems: "center",
    justifyContent: "center"
  },
  trustCopy: {
    flex: 1
  },
  trustTitle: {
    color: "#07142a",
    fontWeight: "900"
  },
  trustText: {
    color: "#53647c",
    marginTop: 2
  },
  linkPanel: {
    borderWidth: 1,
    borderColor: "#e3e9f3",
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 14,
    gap: 12
  },
  sectionTitle: {
    color: "#07142a",
    fontSize: 18,
    fontWeight: "900"
  },
  linkGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9
  },
  linkButton: {
    flexBasis: "47%",
    flexGrow: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dce6f0",
    backgroundColor: "#f8fbff",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  linkButtonText: {
    color: "#07142a",
    fontWeight: "900"
  }
});
