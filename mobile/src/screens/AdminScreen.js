import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import PageHeader from "../components/PageHeader";
import api, { getApiError } from "../api/client";
import {
  PRODUCT_CATEGORIES,
  getDefaultProductType,
  getDefaultSubcategory,
  getSubcategoriesForCategory
} from "../data/shopCategories";
import { formatMoney } from "../utils/currency";
import {
  INVALID_NUMERIC_INPUT_MESSAGE,
  getNumericInputError
} from "../utils/numericValidation";

const ORDER_STATUSES = ["Pending", "Paid", "Processing", "Shipped", "Delivered", "Cancelled"];

const INITIAL_PRODUCT = {
  name: "",
  description: "",
  category: "Computers",
  subcategory: "Laptops",
  type: "physical",
  price: "",
  stock: "",
  imageUrl: "",
  discountPercent: "0"
};

const PRODUCT_NUMERIC_FIELDS = {
  price: "decimal",
  stock: "digits",
  discountPercent: "decimal"
};

export default function AdminScreen() {
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [newProduct, setNewProduct] = useState(INITIAL_PRODUCT);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const subcategories = useMemo(
    () => getSubcategoriesForCategory(newProduct.category),
    [newProduct.category]
  );

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [summaryRes, productsRes, usersRes, ordersRes] = await Promise.all([
        api.get("/admin/summary"),
        api.get("/products", { params: { pageSize: 60 } }),
        api.get("/admin/users"),
        api.get("/orders")
      ]);
      setSummary(summaryRes.data);
      setProducts(productsRes.data.products || []);
      setUsers(usersRes.data.users || []);
      setOrders(ordersRes.data.orders || []);
    } catch (fetchError) {
      setError(getApiError(fetchError, "Failed to load admin data."));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const setProductField = (field, value) => {
    if (field === "category") {
      setNewProduct((current) => ({
        ...current,
        category: value,
        type: getDefaultProductType(value),
        subcategory: getDefaultSubcategory(value),
        stock: getDefaultProductType(value) === "service" ? "" : current.stock
      }));
      return;
    }

    const numericMode = PRODUCT_NUMERIC_FIELDS[field];
    if (numericMode) {
      const inputError = getNumericInputError(value, numericMode);
      if (inputError) {
        setError(inputError);
        return;
      }
      setError((current) => (current === INVALID_NUMERIC_INPUT_MESSAGE ? "" : current));
    }

    setNewProduct((current) => ({ ...current, [field]: value }));
  };

  const getProductNumericError = () => {
    const productNumericError =
      getNumericInputError(newProduct.price, "decimal") ||
      getNumericInputError(newProduct.discountPercent, "decimal") ||
      (newProduct.type === "service" ? "" : getNumericInputError(newProduct.stock, "digits"));

    return productNumericError ? INVALID_NUMERIC_INPUT_MESSAGE : "";
  };

  const createProduct = async () => {
    setMessage("");
    setError("");
    const productNumericError = getProductNumericError();
    if (productNumericError) {
      setError(productNumericError);
      return;
    }

    try {
      await api.post("/products", {
        ...newProduct,
        price: Number(newProduct.price),
        stock: newProduct.type === "service" ? 0 : Number(newProduct.stock || 0),
        discountPercent: Number(newProduct.discountPercent || 0)
      });
      setNewProduct(INITIAL_PRODUCT);
      setMessage("Product created successfully.");
      await loadData();
    } catch (createError) {
      setError(getApiError(createError, "Failed to create product."));
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    setMessage("");
    setError("");
    try {
      await api.patch(`/orders/${orderId}/status`, {
        status,
        note: `Updated from mobile admin to ${status}.`
      });
      setMessage("Order status updated.");
      await loadData();
    } catch (statusError) {
      setError(getApiError(statusError, "Failed to update order."));
    }
  };

  const updateUserRole = async (userId, role) => {
    setMessage("");
    setError("");
    try {
      await api.patch(`/admin/users/${userId}/role`, { role });
      setMessage("User role updated.");
      await loadData();
    } catch (roleError) {
      setError(getApiError(roleError, "Failed to update user."));
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0644ca" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <PageHeader
        title="Admin Control Center"
        subtitle="Manage products, users, orders, inventory, and commerce insights."
        fallback="Profile"
      />
      {message ? <Text style={styles.status}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.summaryGrid}>
        <SummaryCard label="Users" value={summary?.users} />
        <SummaryCard label="Products" value={summary?.products} />
        <SummaryCard label="Orders" value={summary?.orders} />
        <SummaryCard label="Revenue" value={formatMoney(summary?.totalRevenue)} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Add Product</Text>
        <TextInput style={styles.input} placeholder="Name" value={newProduct.name} onChangeText={(value) => setProductField("name", value)} />
        <TextInput style={styles.input} placeholder="Description" value={newProduct.description} onChangeText={(value) => setProductField("description", value)} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {PRODUCT_CATEGORIES.map((category) => (
            <Pressable
              key={category.category}
              style={[styles.chip, newProduct.category === category.category && styles.chipActive]}
              onPress={() => setProductField("category", category.category)}
            >
              <Text style={[styles.chipText, newProduct.category === category.category && styles.chipTextActive]}>
                {category.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {subcategories.map((subcategory) => (
            <Pressable
              key={subcategory}
              style={[styles.chip, newProduct.subcategory === subcategory && styles.chipActive]}
              onPress={() => setProductField("subcategory", subcategory)}
            >
              <Text style={[styles.chipText, newProduct.subcategory === subcategory && styles.chipTextActive]}>
                {subcategory}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.row}>
          <TextInput style={styles.input} placeholder="Price" keyboardType="numeric" value={newProduct.price} onChangeText={(value) => setProductField("price", value)} />
          {newProduct.type !== "service" ? (
            <TextInput style={styles.input} placeholder="Stock" keyboardType="numeric" value={newProduct.stock} onChangeText={(value) => setProductField("stock", value)} />
          ) : null}
        </View>
        <TextInput style={styles.input} placeholder="Image URL" value={newProduct.imageUrl} onChangeText={(value) => setProductField("imageUrl", value)} />
        <TextInput style={styles.input} placeholder="Discount %" keyboardType="numeric" value={newProduct.discountPercent} onChangeText={(value) => setProductField("discountPercent", value)} />
        <Pressable style={styles.primaryButton} onPress={createProduct}>
          <Text style={styles.primaryButtonText}>Create Product</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Orders</Text>
        {orders.slice(0, 12).map((order) => (
          <View style={styles.listItem} key={order.id}>
            <Text style={styles.itemTitle}>{order.orderNumber || order.id.slice(0, 8)}</Text>
            <Text style={styles.meta}>{formatMoney(order.total)} - {order.status}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {ORDER_STATUSES.map((status) => (
                <Pressable
                  key={status}
                  style={[styles.smallChip, order.status === status && styles.chipActive]}
                  onPress={() => updateOrderStatus(order.id, status)}
                >
                  <Text style={[styles.smallChipText, order.status === status && styles.chipTextActive]}>
                    {status}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Products</Text>
        {products.slice(0, 14).map((product) => (
          <Text style={styles.meta} key={product.id}>
            {product.name} - {formatMoney(product.price)} - {product.type === "service" ? "Service" : `Stock ${product.stock}`}
          </Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Users</Text>
        {users.map((user) => (
          <View style={styles.listItem} key={user.id}>
            <Text style={styles.itemTitle}>{user.name}</Text>
            <Text style={styles.meta}>{user.email} - {user.role}</Text>
            <View style={styles.row}>
              <Pressable style={styles.lightButton} onPress={() => updateUserRole(user.id, "customer")}>
                <Text style={styles.lightButtonText}>Customer</Text>
              </Pressable>
              <Pressable style={styles.lightButton} onPress={() => updateUserRole(user.id, "admin")}>
                <Text style={styles.lightButtonText}>Admin</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function SummaryCard({ label, value }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f4f8fb"
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  summaryCard: {
    flexGrow: 1,
    flexBasis: "47%",
    borderWidth: 1,
    borderColor: "#dce8f1",
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: 12
  },
  summaryLabel: {
    color: "#5f7380",
    fontWeight: "800"
  },
  summaryValue: {
    color: "#12384b",
    fontSize: 21,
    fontWeight: "900",
    marginTop: 4
  },
  card: {
    borderWidth: 1,
    borderColor: "#dce8f1",
    borderRadius: 20,
    backgroundColor: "#fff",
    padding: 14,
    gap: 9
  },
  sectionTitle: {
    color: "#12384b",
    fontSize: 19,
    fontWeight: "900"
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccddda",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff"
  },
  row: {
    flexDirection: "row",
    gap: 8
  },
  chipRow: {
    gap: 8
  },
  chip: {
    borderWidth: 1,
    borderColor: "#c8deda",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  smallChip: {
    borderWidth: 1,
    borderColor: "#c8deda",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  chipActive: {
    borderColor: "#0644ca",
    backgroundColor: "#eef4ff"
  },
  chipText: {
    color: "#173240",
    fontWeight: "800"
  },
  smallChipText: {
    color: "#173240",
    fontSize: 12,
    fontWeight: "800"
  },
  chipTextActive: {
    color: "#0644ca"
  },
  primaryButton: {
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
    borderColor: "#c8deda",
    backgroundColor: "#f2f8f6",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center"
  },
  lightButtonText: {
    color: "#173240",
    fontWeight: "900"
  },
  listItem: {
    borderTopWidth: 1,
    borderTopColor: "#edf2f1",
    paddingTop: 9,
    gap: 6
  },
  itemTitle: {
    color: "#12384b",
    fontWeight: "900"
  },
  meta: {
    color: "#5d7380",
    lineHeight: 20
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
