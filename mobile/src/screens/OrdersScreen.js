import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import PageHeader from "../components/PageHeader";
import api, { getApiError } from "../api/client";
import { formatMoney } from "../utils/currency";

function formatDate(date) {
  return new Date(date).toLocaleString();
}

export default function OrdersScreen() {
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/orders");
      setOrders(data.orders || []);
    } catch (fetchError) {
      setError(getApiError(fetchError, "Failed to load orders."));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  return (
    <View style={styles.page}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <PageHeader
              title="Order Tracking"
              subtitle="Track each order from payment to delivery."
              fallback="Catalog"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {loading ? (
              <View style={styles.loadingInline}>
                <ActivityIndicator color="#03d9ff" />
                <Text style={styles.loadingText}>Loading orders...</Text>
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptyText}>Complete checkout to create and track your first order.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate("OrderDetails", { orderId: item.id, order: item })}
          >
            <View style={styles.cardHead}>
              <Text style={styles.orderId}>{item.orderNumber || `Order #${item.id.slice(0, 8)}`}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.meta}>Total: {formatMoney(item.total)}</Text>
            <Text style={styles.meta}>Placed: {formatDate(item.createdAt)}</Text>
            <Text style={styles.meta}>Payment: {item.payment?.method}</Text>
            {item.customer ? <Text style={styles.meta}>Customer: {item.customer.name}</Text> : null}
            <Text style={styles.linkText}>View Full Details</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#020817"
  },
  content: {
    padding: 14,
    paddingBottom: 28,
    gap: 10
  },
  loadingInline: {
    borderRadius: 12,
    backgroundColor: "#06152b",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  loadingText: {
    color: "#c3d2e4",
    fontWeight: "800"
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
  empty: {
    borderWidth: 1,
    borderColor: "rgba(0,166,255,0.24)",
    borderRadius: 16,
    backgroundColor: "#06152b",
    padding: 16
  },
  emptyTitle: {
    fontWeight: "900",
    color: "#edf8ff",
    fontSize: 18
  },
  emptyText: {
    color: "#8ea7c4",
    marginTop: 4
  },
  card: {
    borderWidth: 1,
    borderColor: "rgba(0,166,255,0.24)",
    borderRadius: 16,
    backgroundColor: "#06152b",
    padding: 13,
    gap: 5
  },
  cardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 4
  },
  orderId: {
    flex: 1,
    color: "#edf8ff",
    fontWeight: "900"
  },
  statusBadge: {
    backgroundColor: "rgba(32,242,163,0.12)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  statusText: {
    color: "#20f2a3",
    fontWeight: "900",
    fontSize: 12
  },
  meta: {
    color: "#8ea7c4"
  },
  linkText: {
    color: "#03d9ff",
    fontWeight: "900",
    marginTop: 5
  }
});
