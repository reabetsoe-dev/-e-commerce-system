import { useNavigation, useRoute } from "@react-navigation/native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import PageHeader from "../components/PageHeader";
import { formatMoney } from "../utils/currency";

export default function CheckoutSuccessScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const order = route.params?.order;
  const orderId = route.params?.orderId || order?.id;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <PageHeader
        title="Payment Successful"
        subtitle="Your order has been placed successfully. Tracking updates are available in your orders dashboard."
        fallback="Orders"
      />

      <View style={styles.card}>
        <Text style={styles.label}>Order ID</Text>
        <Text style={styles.value}>{order?.id || orderId}</Text>
        <Text style={styles.label}>Order Number</Text>
        <Text style={styles.value}>{order?.orderNumber || "Generated"}</Text>
        <Text style={styles.label}>Amount Paid</Text>
        <Text style={styles.value}>{formatMoney(order?.total || 0)}</Text>
        <Text style={styles.label}>Transaction Ref</Text>
        <Text style={styles.value}>{order?.payment?.transactionRef || "N/A"}</Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          style={styles.primaryButton}
          onPress={() => navigation.navigate("OrderDetails", { orderId })}
        >
          <Text style={styles.primaryButtonText}>View Order Details</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("Tabs", { screen: "Catalog" })}
        >
          <Text style={styles.secondaryButtonText}>Continue Shopping</Text>
        </Pressable>
      </View>
    </ScrollView>
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
  card: {
    borderWidth: 1,
    borderColor: "rgba(0,166,255,0.24)",
    borderRadius: 16,
    backgroundColor: "#06152b",
    padding: 14,
    gap: 5
  },
  label: {
    color: "#8ea7c4",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    marginTop: 6
  },
  value: {
    color: "#edf8ff",
    fontWeight: "800"
  },
  actionRow: {
    gap: 8
  },
  primaryButton: {
    backgroundColor: "#149dff",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center"
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "900"
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "rgba(0,217,255,0.34)",
    backgroundColor: "rgba(0,217,255,0.05)",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center"
  },
  secondaryButtonText: {
    color: "#03d9ff",
    fontWeight: "900"
  }
});
