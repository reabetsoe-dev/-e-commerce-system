import { useFocusEffect, useRoute } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import PageHeader from "../components/PageHeader";
import api, { getApiError } from "../api/client";
import { formatMoney } from "../utils/currency";

function formatDate(date) {
  return new Date(date).toLocaleString();
}

export default function OrderDetailsScreen() {
  const route = useRoute();
  const orderId = route.params?.orderId;
  const [order, setOrder] = useState(route.params?.order || null);
  const [loading, setLoading] = useState(!route.params?.order);
  const [error, setError] = useState("");

  const fetchOrder = async () => {
    if (!orderId) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      setOrder(data.order);
    } catch (fetchError) {
      setError(getApiError(fetchError, "Failed to load order details."));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrder();
    }, [orderId])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#03d9ff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <PageHeader
        title={order?.orderNumber || "Order Details"}
        subtitle={order ? `Placed on ${formatDate(order.createdAt)}` : "Review invoice and delivery details."}
        fallback="Orders"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!order ? (
        <View style={styles.card}>
          <Text style={styles.meta}>Order not found.</Text>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{order.status}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Invoice Summary</Text>
            <SummaryLine label="Subtotal" value={formatMoney(order.totals?.subtotal || order.total)} />
            <SummaryLine label="Tax" value={formatMoney(order.totals?.tax || 0)} />
            <SummaryLine label="Delivery" value={formatMoney(order.totals?.deliveryFee || 0)} />
            <SummaryLine label="Discount" value={`-${formatMoney(order.totals?.discountAmount || 0)}`} />
            <SummaryLine label="Grand Total" value={formatMoney(order.total)} total />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Payment & Delivery</Text>
            <Text style={styles.meta}>Payment Method: {order.payment?.method}</Text>
            <Text style={styles.meta}>Transaction Ref: {order.payment?.transactionRef}</Text>
            <Text style={styles.meta}>Shipping Address: {order.shippingAddress}</Text>
            <Text style={styles.meta}>Billing Address: {order.billingAddress || "Not provided"}</Text>
            {order.customer ? <Text style={styles.meta}>Customer: {order.customer.name}</Text> : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Order Items</Text>
            {(order.items || []).map((item) => (
              <Text style={styles.meta} key={item.productId}>
                {item.name} x {item.quantity} = {formatMoney(item.subtotal)}
              </Text>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Status Timeline</Text>
            {(order.statusHistory || []).map((entry, index) => (
              <View style={styles.timelineRow} key={`${entry.timestamp}-${index}`}>
                <Text style={styles.timelineTime}>{formatDate(entry.timestamp)}</Text>
                <Text style={styles.timelineStatus}>{entry.status}</Text>
                <Text style={styles.timelineNote}>{entry.note}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function SummaryLine({ label, value, total }) {
  return (
    <View style={[styles.summaryLine, total && styles.totalLine]}>
      <Text style={[styles.summaryLabel, total && styles.totalText]}>{label}</Text>
      <Text style={[styles.summaryValue, total && styles.totalText]}>{value}</Text>
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#020817"
  },
  card: {
    borderWidth: 1,
    borderColor: "rgba(0,166,255,0.24)",
    borderRadius: 16,
    backgroundColor: "#06152b",
    padding: 14,
    gap: 7
  },
  sectionTitle: {
    color: "#edf8ff",
    fontSize: 18,
    fontWeight: "900"
  },
  meta: {
    color: "#c3d2e4",
    lineHeight: 20
  },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(32,242,163,0.12)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  statusText: {
    color: "#20f2a3",
    fontWeight: "900"
  },
  summaryLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12
  },
  summaryLabel: {
    color: "#8ea7c4",
    fontWeight: "800"
  },
  summaryValue: {
    color: "#edf8ff",
    fontWeight: "900"
  },
  totalLine: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,166,255,0.24)",
    paddingTop: 10,
    marginTop: 2
  },
  totalText: {
    color: "#20f2a3",
    fontSize: 18,
    fontWeight: "900"
  },
  timelineRow: {
    borderLeftWidth: 3,
    borderLeftColor: "rgba(0,217,255,0.35)",
    paddingLeft: 10,
    gap: 1
  },
  timelineTime: {
    color: "#8ea7c4",
    fontSize: 12
  },
  timelineStatus: {
    color: "#edf8ff",
    fontWeight: "900"
  },
  timelineNote: {
    color: "#8ea7c4",
    fontSize: 12
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
