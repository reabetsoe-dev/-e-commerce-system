import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import PageHeader from "../components/PageHeader";
import api, { getApiError, resolveAssetUrl } from "../api/client";
import { useCart } from "../context/CartContext";
import { formatMoney } from "../utils/currency";
import {
  INVALID_NUMERIC_INPUT_MESSAGE,
  getNumericInputError
} from "../utils/numericValidation";

const PAYMENT_METHODS = [
  {
    value: "Mpesa",
    label: "Mpesa",
    icon: require("../../assets/payments/mpesa.png")
  },
  {
    value: "Ecocash",
    label: "Ecocash",
    icon: require("../../assets/payments/ecocash.png")
  },
  {
    value: "Debit card",
    label: "Debit card",
    icon: require("../../assets/payments/debit-card.png")
  }
];

const PAYMENT_NUMERIC_FIELDS = {
  lesothoNumber: "phone",
  cardNumber: "card",
  cvc: "digits"
};

function isMobileMoney(method) {
  return method === "Mpesa" || method === "Ecocash";
}

function getLesothoDigits(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.startsWith("266") ? digits.slice(3) : digits;
}

function isValidLesothoNumber(value) {
  return /^[56]\d{7}$/.test(getLesothoDigits(value));
}

function isValidCardNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return /^\d{13,19}$/.test(digits);
}

function isValidCvc(value) {
  return /^\d{3,4}$/.test(String(value || "").trim());
}

export default function CartScreen() {
  const navigation = useNavigation();
  const { cart, loading, refreshCart, updateItemQty, removeFromCart } = useCart();
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Mpesa");
  const [paymentDetails, setPaymentDetails] = useState({
    lesothoNumber: "",
    cardNumber: "",
    cvc: ""
  });
  const totals = cart.summary || {};
  const grandTotal = Number(totals.grandTotal ?? cart.total ?? 0);

  useFocusEffect(
    useCallback(() => {
      refreshCart().catch((refreshError) => {
        setError(getApiError(refreshError, "Failed to load cart."));
      });
    }, [])
  );

  const updateQty = async (item, change) => {
    const next = item.quantity + change;
    if (next < 1) {
      return;
    }
    setBusyId(item.productId);
    setError("");
    try {
      await updateItemQty(item.productId, next);
    } catch (updateError) {
      setError(getApiError(updateError, "Failed to update quantity."));
    } finally {
      setBusyId("");
    }
  };

  const removeItem = async (productId) => {
    setBusyId(productId);
    setError("");
    try {
      await removeFromCart(productId);
    } catch (removeError) {
      setError(getApiError(removeError, "Failed to remove item."));
    } finally {
      setBusyId("");
    }
  };

  const checkout = async () => {
    const paymentError = validatePayment();
    if (paymentError) {
      setError(paymentError);
      return;
    }

    setProcessing(true);
    setStatus("");
    setError("");
    try {
      const { data } = await api.post("/checkout", {
        paymentMethod,
        paymentDetails: getPaymentDetails(),
        shippingAddress: "Not required"
      });
      await refreshCart();
      navigation.navigate("CheckoutSuccess", { order: data.order, orderId: data.order.id });
    } catch (checkoutError) {
      setError(getApiError(checkoutError, "Checkout failed."));
    } finally {
      setProcessing(false);
    }
  };

  const updatePaymentDetail = (field, value) => {
    const numericMode = PAYMENT_NUMERIC_FIELDS[field];
    if (numericMode) {
      const inputError = getNumericInputError(value, numericMode);
      if (inputError) {
        setError(inputError);
        return;
      }
      setError((current) => (current === INVALID_NUMERIC_INPUT_MESSAGE ? "" : current));
    }

    setPaymentDetails((current) => ({ ...current, [field]: value }));
  };

  const validatePayment = () => {
    if (isMobileMoney(paymentMethod)) {
      const mobileMoneyInputError = getNumericInputError(paymentDetails.lesothoNumber, "phone");
      if (mobileMoneyInputError) {
        return INVALID_NUMERIC_INPUT_MESSAGE;
      }

      if (!isValidLesothoNumber(paymentDetails.lesothoNumber)) {
        return "Enter a valid Lesotho mobile number, for example +266 5xxx xxxx.";
      }
    }

    if (paymentMethod === "Debit card") {
      const cardInputError =
        getNumericInputError(paymentDetails.cardNumber, "card") ||
        getNumericInputError(paymentDetails.cvc, "digits");
      if (cardInputError) {
        return INVALID_NUMERIC_INPUT_MESSAGE;
      }

      if (!isValidCardNumber(paymentDetails.cardNumber)) {
        return "Enter a valid debit card number.";
      }

      if (!isValidCvc(paymentDetails.cvc)) {
        return "Enter a valid CVC.";
      }
    }

    return "";
  };

  const getPaymentDetails = () => {
    if (isMobileMoney(paymentMethod)) {
      return {
        lesothoNumber: getLesothoDigits(paymentDetails.lesothoNumber),
        amount: grandTotal
      };
    }

    return {
      cardNumber: String(paymentDetails.cardNumber || "").replace(/\D/g, ""),
      cvc: String(paymentDetails.cvc || "").trim()
    };
  };

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
        title="Shopping Cart"
        subtitle="Review item quantities, verify totals, and continue to secure checkout."
        fallback="Products"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {status ? <Text style={styles.status}>{status}</Text> : null}

      {cart.items.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <Text style={styles.emptySub}>Add products from the Products tab to begin.</Text>
          <Pressable style={styles.checkoutBtn} onPress={() => navigation.navigate("Products")}>
            <Text style={styles.checkoutBtnText}>Explore Catalog</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.itemsPanel}>
            <Text style={styles.sectionTitle}>Cart Items</Text>
            {cart.items.map((item) => (
              <View key={item.productId} style={styles.itemCard}>
                {item.imageUrl ? (
                  <Image
                    source={{ uri: resolveAssetUrl(item.imageUrl) }}
                    style={styles.itemImage}
                    resizeMode="contain"
                  />
                ) : null}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{item.name}</Text>
                  <Text style={styles.itemMeta}>{item.category}</Text>
                  <Text style={styles.itemMeta}>{formatMoney(item.price)} x {item.quantity}</Text>
                  <Text style={styles.itemMeta}>Subtotal: {formatMoney(item.subtotal)}</Text>
                </View>
                <View style={styles.itemActions}>
                  <View style={styles.qtyRow}>
                    <Pressable
                      style={styles.qtyBtn}
                      onPress={() => updateQty(item, -1)}
                      disabled={busyId === item.productId}
                    >
                      <Text style={styles.qtyBtnText}>-</Text>
                    </Pressable>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <Pressable
                      style={styles.qtyBtn}
                      onPress={() => updateQty(item, 1)}
                      disabled={busyId === item.productId}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </Pressable>
                  </View>
                  <Pressable
                    style={styles.removeBtn}
                    onPress={() => removeItem(item.productId)}
                    disabled={busyId === item.productId}
                  >
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.summaryPanel}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <SummaryLine label="Subtotal" value={formatMoney(totals.subtotal || cart.total)} />
            <SummaryLine label="Tax" value={formatMoney(totals.tax || 0)} />
            <SummaryLine label="Delivery" value={formatMoney(totals.deliveryFee || 0)} />
            <SummaryLine label="Grand Total" value={formatMoney(grandTotal)} total />

            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.paymentRow}>
              {PAYMENT_METHODS.map((method) => (
                <Pressable
                  key={method.value}
                  style={[
                    styles.paymentCard,
                    paymentMethod === method.value && styles.paymentCardActive
                  ]}
                  onPress={() => {
                    setError("");
                    setPaymentMethod(method.value);
                  }}
                >
                  <Image source={method.icon} style={styles.paymentIcon} resizeMode="contain" />
                  <Text
                    style={[
                      styles.paymentChipText,
                      paymentMethod === method.value && styles.paymentChipTextActive
                    ]}
                  >
                    {method.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {isMobileMoney(paymentMethod) ? (
              <View style={styles.paymentFields}>
                <TextInput
                  style={styles.paymentInput}
                  placeholder="+266 5xxx xxxx"
                  placeholderTextColor="#7b90a0"
                  keyboardType="phone-pad"
                  value={paymentDetails.lesothoNumber}
                  onChangeText={(value) => updatePaymentDetail("lesothoNumber", value)}
                />
                <View style={styles.paymentTotalBox}>
                  <Text style={styles.paymentTotalLabel}>Amount</Text>
                  <Text style={styles.paymentTotalValue}>
                    {formatMoney(grandTotal)}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.paymentFields}>
                <TextInput
                  style={styles.paymentInput}
                  placeholder="Card number"
                  placeholderTextColor="#7b90a0"
                  keyboardType="number-pad"
                  value={paymentDetails.cardNumber}
                  onChangeText={(value) => updatePaymentDetail("cardNumber", value)}
                />
                <TextInput
                  style={styles.paymentInput}
                  placeholder="CVC"
                  placeholderTextColor="#7b90a0"
                  keyboardType="number-pad"
                  maxLength={4}
                  value={paymentDetails.cvc}
                  onChangeText={(value) => updatePaymentDetail("cvc", value)}
                />
              </View>
            )}

            <Pressable
              style={[styles.checkoutBtn, processing && styles.disabledBtn]}
              onPress={checkout}
              disabled={processing}
            >
              <Text style={styles.checkoutBtnText}>
                {processing ? "Processing..." : "Place Order"}
              </Text>
            </Pressable>
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
    gap: 12
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#020817"
  },
  error: {
    color: "#ff8aa0",
    backgroundColor: "rgba(255,107,133,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,107,133,0.34)",
    borderRadius: 10,
    padding: 10,
    fontWeight: "700"
  },
  status: {
    color: "#20f2a3",
    backgroundColor: "rgba(32,242,163,0.1)",
    borderWidth: 1,
    borderColor: "rgba(32,242,163,0.28)",
    borderRadius: 10,
    padding: 10,
    fontWeight: "700"
  },
  emptyBox: {
    borderWidth: 1,
    borderColor: "rgba(0,166,255,0.24)",
    borderRadius: 16,
    backgroundColor: "#06152b",
    padding: 18,
    gap: 10
  },
  emptyText: {
    color: "#edf8ff",
    fontWeight: "900",
    fontSize: 22
  },
  emptySub: {
    color: "#8ea7c4",
    marginTop: 4
  },
  itemsPanel: {
    borderWidth: 1,
    borderColor: "rgba(0,166,255,0.24)",
    borderRadius: 16,
    backgroundColor: "#06152b",
    padding: 12,
    gap: 10
  },
  summaryPanel: {
    borderWidth: 1,
    borderColor: "rgba(0,166,255,0.24)",
    borderRadius: 16,
    backgroundColor: "#06152b",
    padding: 14,
    gap: 9
  },
  sectionTitle: {
    color: "#edf8ff",
    fontSize: 20,
    fontWeight: "900"
  },
  itemCard: {
    borderWidth: 1,
    borderColor: "rgba(0,166,255,0.18)",
    borderRadius: 14,
    padding: 10,
    gap: 9,
    backgroundColor: "#071b33"
  },
  itemImage: {
    width: "100%",
    height: 150,
    borderRadius: 14,
    backgroundColor: "#0b1f3d",
    borderWidth: 1,
    borderColor: "rgba(0,166,255,0.18)"
  },
  itemInfo: {
    gap: 3
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#edf8ff"
  },
  itemMeta: {
    color: "#8ea7c4"
  },
  itemActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: "rgba(0,217,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,217,255,0.28)"
  },
  qtyBtnText: {
    color: "#03d9ff",
    fontWeight: "900",
    fontSize: 18
  },
  qtyText: {
    minWidth: 22,
    textAlign: "center",
    fontWeight: "900",
    color: "#edf8ff"
  },
  removeBtn: {
    backgroundColor: "rgba(255,107,133,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,107,133,0.36)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  removeBtnText: {
    color: "#ff8aa0",
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
  label: {
    color: "#c3d2e4",
    fontWeight: "900",
    marginTop: 4
  },
  paymentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  paymentCard: {
    width: "31%",
    minWidth: 96,
    borderWidth: 1,
    borderColor: "rgba(0,166,255,0.28)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 10,
    alignItems: "center",
    gap: 6,
    backgroundColor: "#071b33"
  },
  paymentCardActive: {
    borderColor: "#03d9ff",
    backgroundColor: "rgba(0,217,255,0.12)"
  },
  paymentIcon: {
    width: 58,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#fff"
  },
  paymentChipText: {
    color: "#c3d2e4",
    fontWeight: "800",
    fontSize: 12,
    textAlign: "center"
  },
  paymentChipTextActive: {
    color: "#03d9ff"
  },
  paymentFields: {
    gap: 8
  },
  paymentInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "rgba(0,166,255,0.28)",
    borderRadius: 12,
    paddingHorizontal: 12,
    color: "#edf8ff",
    fontWeight: "800",
    backgroundColor: "#071b33"
  },
  paymentTotalBox: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: "rgba(0,166,255,0.28)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: "center",
    backgroundColor: "#071b33"
  },
  paymentTotalLabel: {
    color: "#8ea7c4",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  paymentTotalValue: {
    color: "#20f2a3",
    fontSize: 17,
    fontWeight: "900"
  },
  checkoutBtn: {
    backgroundColor: "#149dff",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 4
  },
  checkoutBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16
  },
  disabledBtn: {
    opacity: 0.65
  }
});
