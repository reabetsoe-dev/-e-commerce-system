import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import PageHeader from "../components/PageHeader";
import api, { getApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
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
    helper: "Mobile money",
    icon: require("../../assets/payments/mpesa.png")
  },
  {
    value: "Ecocash",
    label: "Ecocash",
    helper: "Mobile money",
    icon: require("../../assets/payments/ecocash.png")
  },
  {
    value: "Debit card",
    label: "Debit Card",
    helper: "Visa or Mastercard",
    icon: require("../../assets/payments/debit-card.png")
  }
];

const DELIVERY_OPTIONS = [
  {
    value: "standard",
    title: "Standard Delivery",
    details: "3 - 5 working days",
    price: "Current rate",
    icon: "car-outline"
  },
  {
    value: "express",
    title: "Express Delivery",
    details: "1 - 2 working days",
    price: "M80 estimate",
    icon: "flash-outline"
  },
  {
    value: "digital",
    title: "Digital Delivery",
    details: "For web hosting services",
    price: "Instant activation",
    icon: "cloud-outline"
  }
];

const NUMERIC_FORM_FIELDS = {
  phoneNumber: "phone",
  postalCode: "digits",
  lesothoNumber: "phone",
  cardNumber: "card",
  expiryDate: "expiry",
  cvc: "digits"
};

function isMobileMoney(method) {
  return method === "Mpesa" || method === "Ecocash";
}

function getLesothoDigits(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.startsWith("266") ? digits.slice(3) : digits;
}

function isValidMpesaNumber(value) {
  return /^5\d{7}$/.test(getLesothoDigits(value));
}

function isValidEcocashNumber(value) {
  return /^6\d{7}$/.test(getLesothoDigits(value));
}

function getMobileMoneyNumberExample(method) {
  return method === "Ecocash" ? "+266 6xxx xxxx" : "+266 5xxx xxxx";
}

function isValidCardNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return /^\d{13,19}$/.test(digits);
}

function isValidCvc(value) {
  return /^\d{3,4}$/.test(String(value || "").trim());
}

function maskCardNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits ? `**** ${digits.slice(-4)}` : "";
}

export default function CheckoutScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { cart, refreshCart } = useCart();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({
    fullName: user?.name || "",
    emailAddress: user?.email || "",
    phoneNumber: "",
    deliveryAddress: "",
    city: "",
    postalCode: "",
    saveAddress: true,
    deliveryMethod: "standard",
    paymentMethod: "Mpesa",
    lesothoNumber: "",
    cardholderName: user?.name || "",
    cardNumber: "",
    expiryDate: "",
    cvc: ""
  });

  const totals = useMemo(() => {
    const subtotal = Number(cart.summary?.subtotal ?? cart.total ?? 0);
    const tax = Number(cart.summary?.tax ?? 0);
    const deliveryFee = Number(cart.summary?.deliveryFee ?? 0);
    const grandTotal = Number(cart.summary?.grandTotal ?? cart.total ?? 0);
    return { subtotal, tax, deliveryFee, grandTotal };
  }, [cart.summary, cart.total]);

  const selectedPayment = PAYMENT_METHODS.find((method) => method.value === form.paymentMethod);
  const paymentIsMobileMoney = isMobileMoney(form.paymentMethod);
  const selectedDelivery =
    DELIVERY_OPTIONS.find((option) => option.value === form.deliveryMethod) || DELIVERY_OPTIONS[0];

  if (!cart.items.length) {
    return (
      <ScrollView style={styles.page} contentContainerStyle={styles.content}>
        <PageHeader
          title="No items for checkout"
          subtitle="Add products to your cart before starting checkout."
          fallback="Cart"
        />
        <Pressable style={styles.primaryButton} onPress={() => navigation.navigate("Tabs", { screen: "Catalog" })}>
          <Text style={styles.primaryButtonText}>Explore Catalog</Text>
        </Pressable>
      </ScrollView>
    );
  }

  const updateForm = (field, value) => {
    const numericMode = NUMERIC_FORM_FIELDS[field];
    if (numericMode) {
      const inputError = getNumericInputError(value, numericMode);
      if (inputError) {
        setFieldErrors((current) => ({ ...current, [field]: inputError }));
        return;
      }
      setFieldErrors((current) => {
        const nextErrors = { ...current };
        delete nextErrors[field];
        return nextErrors;
      });
    }

    setForm((current) => ({ ...current, [field]: value }));
  };

  const validatePayment = () => {
    const mobileMoneyNumber = form.lesothoNumber || form.phoneNumber;
    const nextFieldErrors = {};

    const phoneInputError = getNumericInputError(form.phoneNumber, "phone");
    if (phoneInputError) {
      nextFieldErrors.phoneNumber = phoneInputError;
    }

    const postalInputError = getNumericInputError(form.postalCode, "digits");
    if (postalInputError) {
      nextFieldErrors.postalCode = postalInputError;
    }

    if (paymentIsMobileMoney) {
      const mobileMoneyInputError = getNumericInputError(mobileMoneyNumber, "phone");
      if (mobileMoneyInputError) {
        nextFieldErrors[form.lesothoNumber ? "lesothoNumber" : "phoneNumber"] = mobileMoneyInputError;
      }

      const isValidMobileMoneyNumber =
        form.paymentMethod === "Ecocash"
          ? isValidEcocashNumber(mobileMoneyNumber)
          : isValidMpesaNumber(mobileMoneyNumber);
      if (!isValidMobileMoneyNumber) {
        setFieldErrors(nextFieldErrors);
        return `Enter a valid Lesotho mobile number, for example ${getMobileMoneyNumberExample(form.paymentMethod)}.`;
      }
    }

    if (form.paymentMethod === "Debit card") {
      const cardInputError = getNumericInputError(form.cardNumber, "card");
      if (cardInputError) {
        nextFieldErrors.cardNumber = cardInputError;
      }

      const expiryInputError = getNumericInputError(form.expiryDate, "expiry");
      if (expiryInputError) {
        nextFieldErrors.expiryDate = expiryInputError;
      }

      const cvcInputError = getNumericInputError(form.cvc, "digits");
      if (cvcInputError) {
        nextFieldErrors.cvc = cvcInputError;
      }

      if (!isValidCardNumber(form.cardNumber)) {
        setFieldErrors(nextFieldErrors);
        return "Enter a valid debit card number.";
      }
      if (!isValidCvc(form.cvc)) {
        setFieldErrors(nextFieldErrors);
        return "Enter a valid CVC.";
      }
    }

    setFieldErrors(nextFieldErrors);
    return Object.keys(nextFieldErrors).length ? INVALID_NUMERIC_INPUT_MESSAGE : "";
  };

  const getShippingAddress = () => {
    const address = [form.deliveryAddress, form.city, form.postalCode]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .join(", ");
    const contact = [form.fullName, form.emailAddress, form.phoneNumber]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .join(" | ");

    return [
      address || "Not required",
      contact ? `Contact: ${contact}` : "",
      `Delivery: ${selectedDelivery.title}`
    ]
      .filter(Boolean)
      .join(" | ");
  };

  const getPaymentDetails = () => {
    if (paymentIsMobileMoney) {
      return {
        lesothoNumber: getLesothoDigits(form.lesothoNumber || form.phoneNumber),
        amount: totals.grandTotal
      };
    }

    return {
      cardNumber: String(form.cardNumber || "").replace(/\D/g, ""),
      cvc: String(form.cvc || "").trim()
    };
  };

  const nextStep = () => {
    const validationError = validatePayment();
    if (validationError) {
      if (validationError !== INVALID_NUMERIC_INPUT_MESSAGE) {
        setError(validationError);
      }
      return;
    }

    setError("");
    setStep(1);
  };

  const placeOrder = async () => {
    const validationError = validatePayment();
    if (validationError) {
      if (validationError !== INVALID_NUMERIC_INPUT_MESSAGE) {
        setError(validationError);
      }
      setStep(0);
      return;
    }

    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/checkout", {
        shippingAddress: getShippingAddress(),
        paymentMethod: form.paymentMethod,
        paymentDetails: getPaymentDetails()
      });
      await refreshCart();
      navigation.navigate("CheckoutSuccess", { order: data.order, orderId: data.order.id });
    } catch (checkoutError) {
      setError(getApiError(checkoutError, "Checkout failed."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <PageHeader
        eyebrow="Secure Checkout"
        title="Checkout"
        subtitle="Enter delivery details, select payment, and confirm your order."
        fallback="Cart"
      />

      <View style={styles.flowRow}>
        {["Cart", "Delivery", "Payment", "Confirmation"].map((label, index) => (
          <View
            key={label}
            style={[
              styles.flowStep,
              index <= (step === 0 ? 2 : 3) && styles.flowStepActive
            ]}
          >
            <Text style={[styles.flowIndex, index <= (step === 0 ? 2 : 3) && styles.flowIndexActive]}>
              {index + 1}
            </Text>
            <Text style={styles.flowLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {step === 0 ? (
        <View style={styles.card}>
          <SectionTitle icon="person-outline" title="Customer Details" />
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#8ea7c4"
            value={form.fullName}
            onChangeText={(value) => updateForm("fullName", value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#8ea7c4"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.emailAddress}
            onChangeText={(value) => updateForm("emailAddress", value)}
          />
          <TextInput
            style={styles.input}
            placeholder="+266 5800 0000"
            placeholderTextColor="#8ea7c4"
            keyboardType="phone-pad"
            value={form.phoneNumber}
            onChangeText={(value) => updateForm("phoneNumber", value)}
          />
          {fieldErrors.phoneNumber ? <Text style={styles.fieldError}>{fieldErrors.phoneNumber}</Text> : null}
          <TextInput
            style={styles.input}
            placeholder="Delivery Address"
            placeholderTextColor="#8ea7c4"
            value={form.deliveryAddress}
            onChangeText={(value) => updateForm("deliveryAddress", value)}
          />
          <View style={styles.twoCol}>
            <TextInput
              style={styles.input}
              placeholder="City / District"
              placeholderTextColor="#8ea7c4"
              value={form.city}
              onChangeText={(value) => updateForm("city", value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Postal Code"
              placeholderTextColor="#8ea7c4"
              keyboardType="number-pad"
              value={form.postalCode}
              onChangeText={(value) => updateForm("postalCode", value)}
            />
          </View>
          {fieldErrors.postalCode ? <Text style={styles.fieldError}>{fieldErrors.postalCode}</Text> : null}

          <Pressable
            style={styles.checkboxRow}
            onPress={() => updateForm("saveAddress", !form.saveAddress)}
          >
            <View style={[styles.checkbox, form.saveAddress && styles.checkboxChecked]}>
              {form.saveAddress ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
            </View>
            <Text style={styles.checkboxText}>Save this address for future use</Text>
          </Pressable>

          <SectionTitle icon="car-outline" title="Delivery Method" />
          <View style={styles.optionGrid}>
            {DELIVERY_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.deliveryCard,
                  form.deliveryMethod === option.value && styles.optionActive
                ]}
                onPress={() => updateForm("deliveryMethod", option.value)}
              >
                <Ionicons name={option.icon} size={20} color="#03d9ff" />
                <View style={styles.optionCopy}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionText}>{option.details}</Text>
                  <Text style={styles.optionMeta}>
                    {option.value === "standard"
                      ? totals.deliveryFee > 0
                        ? formatMoney(totals.deliveryFee)
                        : "Free"
                      : option.price}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          <SectionTitle icon="card-outline" title="Payment Method" />
          <View style={styles.paymentList}>
            {PAYMENT_METHODS.map((method) => (
              <Pressable
                key={method.value}
                style={[
                  styles.paymentCard,
                  form.paymentMethod === method.value && styles.optionActive
                ]}
                onPress={() => {
                  setError("");
                  setFieldErrors({});
                  updateForm("paymentMethod", method.value);
                }}
              >
                <Image source={method.icon} style={styles.paymentIcon} resizeMode="contain" />
                <View style={styles.optionCopy}>
                  <Text style={styles.optionTitle}>{method.label}</Text>
                  <Text style={styles.optionText}>{method.helper}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          {paymentIsMobileMoney ? (
            <View style={styles.paymentFields}>
              <TextInput
                style={styles.input}
                placeholder={getMobileMoneyNumberExample(form.paymentMethod)}
                placeholderTextColor="#8ea7c4"
                keyboardType="phone-pad"
                value={form.lesothoNumber}
                onChangeText={(value) => updateForm("lesothoNumber", value)}
              />
              {fieldErrors.lesothoNumber ? <Text style={styles.fieldError}>{fieldErrors.lesothoNumber}</Text> : null}
              <View style={styles.amountBox}>
                <Text style={styles.amountLabel}>Amount</Text>
                <Text style={styles.amountValue}>{formatMoney(totals.grandTotal)}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.paymentFields}>
              <TextInput
                style={styles.input}
                placeholder="Account Name"
                placeholderTextColor="#8ea7c4"
                value={form.cardholderName}
                onChangeText={(value) => updateForm("cardholderName", value)}
              />
              <TextInput
                style={styles.input}
                placeholder="Account Number"
                placeholderTextColor="#8ea7c4"
                keyboardType="number-pad"
                value={form.cardNumber}
                onChangeText={(value) => updateForm("cardNumber", value)}
              />
              {fieldErrors.cardNumber ? <Text style={styles.fieldError}>{fieldErrors.cardNumber}</Text> : null}
              <View style={styles.twoCol}>
                <TextInput
                  style={styles.input}
                  placeholder="MM/YY"
                  placeholderTextColor="#8ea7c4"
                  keyboardType="number-pad"
                  value={form.expiryDate}
                  onChangeText={(value) => updateForm("expiryDate", value)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="CVC"
                  placeholderTextColor="#8ea7c4"
                  keyboardType="number-pad"
                  maxLength={4}
                  value={form.cvc}
                  onChangeText={(value) => updateForm("cvc", value)}
                />
              </View>
              {fieldErrors.expiryDate ? <Text style={styles.fieldError}>{fieldErrors.expiryDate}</Text> : null}
              {fieldErrors.cvc ? <Text style={styles.fieldError}>{fieldErrors.cvc}</Text> : null}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.card}>
          <SectionTitle icon="receipt-outline" title="Order Review" />
          <View style={styles.reviewPayment}>
            {selectedPayment ? <Image source={selectedPayment.icon} style={styles.paymentIcon} resizeMode="contain" /> : null}
            <View style={styles.optionCopy}>
              <Text style={styles.optionTitle}>{selectedPayment?.label || form.paymentMethod}</Text>
              <Text style={styles.optionText}>
                {paymentIsMobileMoney
                  ? `+266 ${getLesothoDigits(form.lesothoNumber || form.phoneNumber)}`
                  : maskCardNumber(form.cardNumber)}
              </Text>
            </View>
          </View>
          <View style={styles.reviewBox}>
            <Text style={styles.optionTitle}>{selectedDelivery.title}</Text>
            <Text style={styles.optionText}>{getShippingAddress()}</Text>
          </View>
          {cart.items.map((item) => (
            <View style={styles.reviewLine} key={item.productId}>
              <Text style={styles.reviewName}>
                {item.name} <Text style={styles.optionText}>x {item.quantity}</Text>
              </Text>
              <Text style={styles.reviewValue}>{formatMoney(item.subtotal)}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Order Summary</Text>
        <SummaryLine label="Subtotal" value={formatMoney(totals.subtotal)} />
        <SummaryLine label="Tax" value={formatMoney(totals.tax)} />
        <SummaryLine label="Delivery" value={totals.deliveryFee === 0 ? "FREE" : formatMoney(totals.deliveryFee)} />
        <SummaryLine label="Grand Total" value={formatMoney(totals.grandTotal)} total />
      </View>

      <View style={styles.actionRow}>
        {step > 0 ? (
          <Pressable style={styles.secondaryButton} onPress={() => setStep(0)}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>
        ) : null}
        {step === 0 ? (
          <Pressable style={styles.primaryButton} onPress={nextStep}>
            <Text style={styles.primaryButtonText}>Continue</Text>
          </Pressable>
        ) : (
          <Pressable style={[styles.primaryButton, busy && styles.disabled]} onPress={placeOrder} disabled={busy}>
            <Text style={styles.primaryButtonText}>{busy ? "Processing..." : "Place Order"}</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={18} color="#03d9ff" />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
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
    paddingBottom: 30,
    gap: 12
  },
  flowRow: {
    flexDirection: "row",
    gap: 6
  },
  flowStep: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(0,166,255,0.2)",
    borderRadius: 12,
    backgroundColor: "#06152b",
    padding: 8,
    alignItems: "center",
    gap: 4
  },
  flowStepActive: {
    borderColor: "rgba(0,217,255,0.38)",
    backgroundColor: "rgba(0,217,255,0.08)"
  },
  flowIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: "center",
    textAlignVertical: "center",
    backgroundColor: "#071b33",
    color: "#8ea7c4",
    fontWeight: "900"
  },
  flowIndexActive: {
    backgroundColor: "#149dff",
    color: "#fff"
  },
  flowLabel: {
    color: "#c3d2e4",
    fontSize: 10,
    fontWeight: "900"
  },
  card: {
    borderWidth: 1,
    borderColor: "rgba(0,166,255,0.24)",
    borderRadius: 16,
    backgroundColor: "#06152b",
    padding: 14,
    gap: 10
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: "rgba(0,166,255,0.24)",
    borderRadius: 16,
    backgroundColor: "#06152b",
    padding: 14,
    gap: 10
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(0,217,255,0.1)",
    alignItems: "center",
    justifyContent: "center"
  },
  sectionTitle: {
    color: "#edf8ff",
    fontSize: 18,
    fontWeight: "900"
  },
  input: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: "rgba(0,166,255,0.28)",
    borderRadius: 12,
    paddingHorizontal: 12,
    color: "#edf8ff",
    backgroundColor: "#071b33",
    fontWeight: "800"
  },
  twoCol: {
    flexDirection: "row",
    gap: 8
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(0,217,255,0.36)",
    alignItems: "center",
    justifyContent: "center"
  },
  checkboxChecked: {
    backgroundColor: "#149dff"
  },
  checkboxText: {
    color: "#c3d2e4",
    fontWeight: "800"
  },
  optionGrid: {
    gap: 8
  },
  deliveryCard: {
    borderWidth: 1,
    borderColor: "rgba(0,166,255,0.24)",
    borderRadius: 12,
    backgroundColor: "#071b33",
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  paymentCard: {
    borderWidth: 1,
    borderColor: "rgba(0,166,255,0.24)",
    borderRadius: 12,
    backgroundColor: "#071b33",
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  reviewPayment: {
    borderWidth: 1,
    borderColor: "rgba(0,166,255,0.24)",
    borderRadius: 12,
    backgroundColor: "#071b33",
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  reviewBox: {
    borderWidth: 1,
    borderColor: "rgba(0,166,255,0.24)",
    borderRadius: 12,
    backgroundColor: "#071b33",
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  optionActive: {
    borderColor: "#03d9ff",
    backgroundColor: "rgba(0,217,255,0.12)"
  },
  optionCopy: {
    flex: 1,
    gap: 2
  },
  optionTitle: {
    color: "#edf8ff",
    fontWeight: "900"
  },
  optionText: {
    color: "#8ea7c4",
    fontWeight: "700"
  },
  optionMeta: {
    color: "#20f2a3",
    fontSize: 12,
    fontWeight: "900"
  },
  paymentList: {
    gap: 8
  },
  paymentIcon: {
    width: 58,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#fff"
  },
  paymentFields: {
    gap: 8
  },
  amountBox: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: "rgba(0,166,255,0.28)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: "center",
    backgroundColor: "#071b33"
  },
  amountLabel: {
    color: "#8ea7c4",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  amountValue: {
    color: "#20f2a3",
    fontSize: 17,
    fontWeight: "900"
  },
  reviewLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,166,255,0.18)",
    paddingTop: 9
  },
  reviewName: {
    flex: 1,
    color: "#edf8ff",
    fontWeight: "800"
  },
  reviewValue: {
    color: "#20f2a3",
    fontWeight: "900"
  },
  summaryTitle: {
    color: "#edf8ff",
    fontSize: 18,
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
  actionRow: {
    flexDirection: "row",
    gap: 8
  },
  primaryButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: "#149dff",
    alignItems: "center",
    justifyContent: "center"
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 15
  },
  secondaryButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,217,255,0.34)",
    backgroundColor: "rgba(0,217,255,0.05)",
    alignItems: "center",
    justifyContent: "center"
  },
  secondaryButtonText: {
    color: "#03d9ff",
    fontWeight: "900"
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
  fieldError: {
    color: "#ff8aa0",
    fontWeight: "800"
  },
  disabled: {
    opacity: 0.65
  }
});
