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
          onPress={() => navigation.navigate("Tabs", { screen: "Products" })}
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
    backgroundColor: "#f4f8fb"
  },
  content: {
    padding: 12,
    paddingBottom: 28,
    gap: 10
  },
  card: {
    borderWidth: 1,
    borderColor: "#d8e5e1",
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: 14,
    gap: 5
  },
  label: {
    color: "#5f7280",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    marginTop: 6
  },
  value: {
    color: "#163a4c",
    fontWeight: "800"
  },
  actionRow: {
    gap: 8
  },
  primaryButton: {
    backgroundColor: "#0644ca",
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
    borderColor: "#c8deda",
    backgroundColor: "#f2f8f6",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center"
  },
  secondaryButtonText: {
    color: "#173240",
    fontWeight: "900"
  }
});
