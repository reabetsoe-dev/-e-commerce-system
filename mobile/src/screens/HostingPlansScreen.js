import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import PageHeader from "../components/PageHeader";
import api, { getApiError, resolveAssetUrl } from "../api/client";
import { useCart } from "../context/CartContext";
import { formatMoney } from "../utils/currency";

export default function HostingPlansScreen() {
  const navigation = useNavigation();
  const { addToCart } = useCart();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const fetchPlans = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/products/hosting-plans");
      setPlans(data.plans || []);
    } catch (fetchError) {
      setError(getApiError(fetchError, "Failed to load hosting plans."));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPlans();
    }, [])
  );

  const onAddToCart = async (productId) => {
    setBusyId(productId);
    setStatus("");
    try {
      await addToCart(productId, 1);
      setStatus("Hosting plan added to cart.");
    } catch (actionError) {
      setStatus(getApiError(actionError, "Could not add plan."));
    } finally {
      setBusyId("");
    }
  };

  return (
    <View style={styles.page}>
      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <PageHeader
              eyebrow="Web Hosting Services"
              title="Shared, VPS, and Business Hosting"
              subtitle="Compare resources, reliability, and pricing. Add hosting plans directly to your cart."
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {status ? <Text style={styles.status}>{status}</Text> : null}
            {loading ? (
              <View style={styles.loadingInline}>
                <ActivityIndicator color="#0644ca" />
                <Text style={styles.loadingText}>Loading hosting plans...</Text>
              </View>
            ) : null}
          </>
        }
        renderItem={({ item }) => {
          const discountPrice = Number(
            (item.price * (1 - Number(item.discountPercent || 0) / 100)).toFixed(2)
          );
          return (
            <View style={styles.card}>
              {item.imageUrl ? (
                <Image
                  source={{ uri: resolveAssetUrl(item.imageUrl) }}
                  style={styles.planImage}
                  resizeMode="contain"
                />
              ) : null}
              <Text style={styles.tag}>{item.subcategory}</Text>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.description}>{item.description}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{formatMoney(discountPrice)}</Text>
                <Text style={styles.perMonth}>/ month</Text>
              </View>
              {(item.specifications || []).map((spec) => (
                <Text style={styles.spec} key={`${item.id}-${spec.label}`}>
                  {spec.label}: {spec.value}
                </Text>
              ))}
              <View style={styles.actionRow}>
                <Pressable
                  style={styles.lightButton}
                  onPress={() => navigation.navigate("ProductDetails", { productId: item.id })}
                >
                  <Text style={styles.lightButtonText}>Details</Text>
                </Pressable>
                <Pressable
                  style={[styles.primaryButton, busyId === item.id && styles.disabled]}
                  onPress={() => onAddToCart(item.id)}
                  disabled={busyId === item.id}
                >
                  <Text style={styles.primaryButtonText}>
                    {busyId === item.id ? "Adding..." : "Buy Plan"}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#f4f8fb"
  },
  content: {
    padding: 12,
    paddingBottom: 28,
    gap: 10
  },
  loadingInline: {
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  loadingText: {
    color: "#174254",
    fontWeight: "800"
  },
  card: {
    borderWidth: 1,
    borderColor: "#dce8f1",
    borderRadius: 20,
    backgroundColor: "#fff",
    padding: 14,
    gap: 8,
    shadowColor: "#0b376b",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2
  },
  planImage: {
    width: "100%",
    height: 170,
    borderRadius: 16,
    backgroundColor: "#f7fbff",
    borderWidth: 1,
    borderColor: "#e7eef7"
  },
  tag: {
    alignSelf: "flex-start",
    backgroundColor: "#e8f7f3",
    color: "#0b6968",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  title: {
    color: "#12384b",
    fontSize: 20,
    fontWeight: "900"
  },
  description: {
    color: "#5d7380",
    lineHeight: 20
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6
  },
  price: {
    color: "#0b5f5c",
    fontSize: 23,
    fontWeight: "900"
  },
  perMonth: {
    color: "#5f7380",
    marginBottom: 3
  },
  spec: {
    color: "#3a5a69"
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#0644ca",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "900"
  },
  lightButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d8e5ff",
    backgroundColor: "#f5f8ff",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  lightButtonText: {
    color: "#173240",
    fontWeight: "900"
  },
  disabled: {
    opacity: 0.6
  },
  error: {
    color: "#b2353b",
    backgroundColor: "#fceced",
    borderWidth: 1,
    borderColor: "#f4c9cb",
    borderRadius: 10,
    padding: 10,
    fontWeight: "700"
  },
  status: {
    color: "#1e7d52",
    backgroundColor: "#eaf9f0",
    borderWidth: 1,
    borderColor: "#c4e9d2",
    borderRadius: 10,
    padding: 10,
    fontWeight: "700"
  }
});
