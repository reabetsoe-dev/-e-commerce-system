import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import PageHeader from "../components/PageHeader";
import ProductCard from "../components/ProductCard";
import api, { getApiError, resolveAssetUrl } from "../api/client";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useShop } from "../context/ShopContext";
import { SHOP_CATEGORIES, getSubcategoriesForCategory } from "../data/shopCategories";
import {
  INVALID_NUMERIC_INPUT_MESSAGE,
  getNumericInputError
} from "../utils/numericValidation";

const DEFAULT_FILTERS = {
  search: "",
  category: "",
  subcategory: "",
  type: "",
  minPrice: "",
  maxPrice: "",
  categoryFilter: "",
  priceRange: "",
  brand: "",
  availability: "",
  sort: "newest"
};

const CATEGORY_FILTERS = [
  {
    value: "laptops",
    label: "Laptops",
    params: { category: "Computers", subcategory: "Laptops" }
  },
  {
    value: "printers",
    label: "Printers",
    params: { category: "ICT Products", subcategory: "Printers & Scanners" }
  },
  {
    value: "keyboards",
    label: "Keyboards",
    params: { category: "ICT Products", search: "keyboard" }
  },
  {
    value: "hosting",
    label: "Hosting Services",
    params: { category: "Web Hosting Services" }
  }
];

const PRICE_FILTERS = [
  { value: "below-5000", label: "Below M5,000", params: { maxPrice: "5000" } },
  { value: "5000-10000", label: "M5,000-M10,000", params: { minPrice: "5000", maxPrice: "10000" } },
  { value: "above-10000", label: "Above M10,000", params: { minPrice: "10000" } }
];

const BRAND_FILTERS = ["HP", "Dell", "Lenovo", "Asus"];

const AVAILABILITY_FILTERS = [
  { value: "in-stock", label: "In Stock" },
  { value: "out-of-stock", label: "Out of Stock" }
];

const FILTER_COUNT_KEYS = [
  "search",
  "category",
  "subcategory",
  "type",
  "minPrice",
  "maxPrice",
  "categoryFilter",
  "priceRange",
  "brand",
  "availability"
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest", api: "newest" },
  { value: "popularity", label: "Popular", api: "popularity_desc" },
  { value: "rating", label: "Top Rated", api: "rating_desc" },
  { value: "price_asc", label: "Low Price", api: "price_asc" },
  { value: "price_desc", label: "High Price", api: "price_desc" },
  { value: "name", label: "A-Z", api: "name_asc" }
];

function getOptionParams(options, value) {
  return options.find((option) => option.value === value)?.params || {};
}

function applyClientFilters(items, currentFilters) {
  return items.filter((product) => {
    if (currentFilters.brand) {
      const haystack = [
        product.name,
        product.description,
        product.brand,
        product.provider,
        ...(product.badges || []),
        ...(product.specifications || []).map((spec) => `${spec.label} ${spec.value}`)
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(currentFilters.brand.toLowerCase())) {
        return false;
      }
    }

    if (currentFilters.availability === "in-stock") {
      return product.type === "service" || Number(product.stock || 0) > 0;
    }

    if (currentFilters.availability === "out-of-stock") {
      return product.type !== "service" && Number(product.stock || 0) <= 0;
    }

    return true;
  });
}

export default function ProductsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { wishlistIds, toggleWishlist, refreshWishlist } = useShop();
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busyId, setBusyId] = useState("");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  const subcategories = useMemo(
    () => getSubcategoriesForCategory(filters.category),
    [filters.category]
  );

  const activeFilterCount = useMemo(
    () =>
      FILTER_COUNT_KEYS.filter(
        (key) => filters[key] && filters[key] !== DEFAULT_FILTERS[key]
      ).length,
    [filters]
  );

  const fetchProducts = async (nextFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      const categoryParams = getOptionParams(CATEGORY_FILTERS, nextFilters.categoryFilter);
      const priceParams = getOptionParams(PRICE_FILTERS, nextFilters.priceRange);
      const apiFilters = {
        ...nextFilters,
        ...categoryParams,
        ...priceParams
      };
      const selectedSort =
        SORT_OPTIONS.find((option) => option.value === nextFilters.sort) || SORT_OPTIONS[0];
      const { data } = await api.get("/products", {
        params: {
          search: apiFilters.search || undefined,
          category: apiFilters.category || undefined,
          subcategory: apiFilters.subcategory || undefined,
          type: apiFilters.type || undefined,
          minPrice: apiFilters.minPrice || undefined,
          maxPrice: apiFilters.maxPrice || undefined,
          pageSize: 60,
          sort: selectedSort.api
        }
      });
      setProducts(applyClientFilters(data.products || [], nextFilters));
    } catch (fetchError) {
      setError(getApiError(fetchError, "Failed to load products."));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
      refreshWishlist().catch(() => {});
    }, [])
  );

  const updateFilters = (updates, apply = false) => {
    const priceInputError =
      updates.minPrice !== undefined
        ? getNumericInputError(updates.minPrice, "decimal")
        : updates.maxPrice !== undefined
          ? getNumericInputError(updates.maxPrice, "decimal")
          : "";

    if (priceInputError) {
      setError(priceInputError);
      return;
    }

    if (updates.minPrice !== undefined || updates.maxPrice !== undefined) {
      setError((current) => (current === INVALID_NUMERIC_INPUT_MESSAGE ? "" : current));
    }

    const next = { ...filters, ...updates };
    if (updates.category !== undefined) {
      next.subcategory = "";
      next.type = updates.category === "Web Hosting Services" ? "service" : "";
      next.categoryFilter = "";
    }
    if (updates.categoryFilter !== undefined) {
      next.category = "";
      next.subcategory = "";
      next.type = "";
    }
    if (updates.priceRange !== undefined) {
      next.minPrice = "";
      next.maxPrice = "";
    }
    setFilters(next);
    if (apply) {
      fetchProducts(next);
    }
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSortMenuOpen(false);
    fetchProducts(DEFAULT_FILTERS);
  };

  const onAddToCart = async (productId) => {
    if (!user) {
      setStatus("Login or register to add products to your cart.");
      navigation.navigate("Auth", { redirectScreen: "Cart" });
      return;
    }

    setStatus("");
    setBusyId(productId);
    try {
      await addToCart(productId, 1);
      setStatus("Product added to cart.");
    } catch (addError) {
      setStatus(getApiError(addError, "Could not add item."));
    } finally {
      setBusyId("");
    }
  };

  const onWishlist = async (productId) => {
    if (!user) {
      setStatus("Login or register to save products to your wishlist.");
      navigation.navigate("Auth", { redirectScreen: "Wishlist" });
      return;
    }

    try {
      await toggleWishlist(productId);
      setStatus("Wishlist updated.");
    } catch (wishlistError) {
      setStatus(getApiError(wishlistError, "Could not update wishlist."));
    }
  };

  return (
    <View style={styles.page}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <PageHeader
              eyebrow="Datamak Marketplace"
              title="Product Catalog"
              subtitle="Find computers, ICT gear, networking devices, software licenses, and cloud hosting packages from one curated catalog."
            />

            <View style={styles.panel}>
              <View style={styles.panelHead}>
                <Text style={styles.panelTitle}>Shop by Category</Text>
                <Pressable onPress={clearFilters}>
                  <Text style={styles.linkText}>View all</Text>
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {SHOP_CATEGORIES.map((item) => (
                  <Pressable
                    key={item.category}
                    style={[
                      styles.categoryCard,
                      filters.category === item.category && styles.categoryCardActive
                    ]}
                    onPress={() => updateFilters({ category: item.category }, true)}
                  >
                    <Image
                      source={{ uri: resolveAssetUrl(item.imageUrl) }}
                      style={styles.categoryImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.categoryTitle}>{item.title}</Text>
                    <Text style={styles.categoryDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.panel}>
              <View style={styles.searchRow}>
                <TextInput
                  style={[styles.input, styles.searchInput]}
                  placeholder="Search products..."
                  placeholderTextColor="#8ea7c4"
                  value={filters.search}
                  onChangeText={(value) => updateFilters({ search: value })}
                  onSubmitEditing={() => fetchProducts()}
                />
                <Pressable
                  style={[styles.sortButton, sortMenuOpen && styles.sortButtonActive]}
                  onPress={() => setSortMenuOpen((open) => !open)}
                  accessibilityRole="button"
                  accessibilityLabel="Open sort and filters"
                >
                  <Ionicons
                    name="options-outline"
                    size={21}
                    color={sortMenuOpen ? "#ffffff" : "#03d9ff"}
                  />
                  <View style={styles.sortButtonCopy}>
                    <Text style={[styles.sortButtonText, sortMenuOpen && styles.sortButtonTextActive]}>
                      Sort
                    </Text>
                    <Text style={[styles.sortButtonMeta, sortMenuOpen && styles.sortButtonMetaActive]}>
                      {activeFilterCount > 0
                        ? `${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"}`
                        : "Filters"}
                    </Text>
                  </View>
                  <Ionicons
                    name={sortMenuOpen ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={sortMenuOpen ? "#ffffff" : "#8ea7c4"}
                  />
                </Pressable>
              </View>

              {sortMenuOpen ? (
                <View style={styles.filterMenu}>
                  <View style={styles.twoCol}>
                    <TextInput
                      style={styles.input}
                      placeholder="Min price"
                      placeholderTextColor="#8ea7c4"
                      keyboardType="numeric"
                      value={filters.minPrice}
                      onChangeText={(value) => updateFilters({ minPrice: value })}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Max price"
                      placeholderTextColor="#8ea7c4"
                      keyboardType="numeric"
                      value={filters.maxPrice}
                      onChangeText={(value) => updateFilters({ maxPrice: value })}
                    />
                  </View>

                  <Text style={styles.filterTitle}>Category filters</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {CATEGORY_FILTERS.map((option) => (
                      <Pressable
                        key={option.value}
                        style={[styles.chip, filters.categoryFilter === option.value && styles.chipActive]}
                        onPress={() =>
                          updateFilters(
                            { categoryFilter: filters.categoryFilter === option.value ? "" : option.value },
                            true
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.chipText,
                            filters.categoryFilter === option.value && styles.chipTextActive
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  <Text style={styles.filterTitle}>Price filters</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {PRICE_FILTERS.map((option) => (
                      <Pressable
                        key={option.value}
                        style={[styles.chip, filters.priceRange === option.value && styles.chipActive]}
                        onPress={() =>
                          updateFilters(
                            { priceRange: filters.priceRange === option.value ? "" : option.value },
                            true
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.chipText,
                            filters.priceRange === option.value && styles.chipTextActive
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  <Text style={styles.filterTitle}>Brand filters</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {BRAND_FILTERS.map((brand) => (
                      <Pressable
                        key={brand}
                        style={[styles.chip, filters.brand === brand && styles.chipActive]}
                        onPress={() => updateFilters({ brand: filters.brand === brand ? "" : brand }, true)}
                      >
                        <Text style={[styles.chipText, filters.brand === brand && styles.chipTextActive]}>
                          {brand}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  <Text style={styles.filterTitle}>Availability</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {AVAILABILITY_FILTERS.map((option) => (
                      <Pressable
                        key={option.value}
                        style={[styles.chip, filters.availability === option.value && styles.chipActive]}
                        onPress={() =>
                          updateFilters(
                            { availability: filters.availability === option.value ? "" : option.value },
                            true
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.chipText,
                            filters.availability === option.value && styles.chipTextActive
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  <Text style={styles.filterTitle}>Product type</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {["", "physical", "service"].map((type) => (
                      <Pressable
                        key={type || "all"}
                        style={[styles.chip, filters.type === type && styles.chipActive]}
                        onPress={() => updateFilters({ type }, true)}
                      >
                        <Text style={[styles.chipText, filters.type === type && styles.chipTextActive]}>
                          {type ? type : "All Types"}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                  {subcategories.length > 0 ? (
                    <>
                      <Text style={styles.filterTitle}>Subcategory</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                        {subcategories.map((subcategory) => (
                          <Pressable
                            key={subcategory}
                            style={[styles.chip, filters.subcategory === subcategory && styles.chipActive]}
                            onPress={() => updateFilters({ subcategory }, true)}
                          >
                            <Text
                              style={[
                                styles.chipText,
                                filters.subcategory === subcategory && styles.chipTextActive
                              ]}
                            >
                              {subcategory}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </>
                  ) : null}

                  <Text style={styles.filterTitle}>Sort by</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {SORT_OPTIONS.map((option) => (
                      <Pressable
                        key={option.value}
                        style={[styles.chip, filters.sort === option.value && styles.chipActive]}
                        onPress={() => updateFilters({ sort: option.value }, true)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            filters.sort === option.value && styles.chipTextActive
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  <View style={styles.buttonRow}>
                    <Pressable style={styles.secondaryButton} onPress={clearFilters}>
                      <Text style={styles.secondaryButtonText}>Clear</Text>
                    </Pressable>
                    <Pressable
                      style={styles.primaryButton}
                      onPress={() => {
                        setSortMenuOpen(false);
                        fetchProducts();
                      }}
                    >
                      <Text style={styles.primaryButtonText}>Apply Filters</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {status ? <Text style={styles.status}>{status}</Text> : null}
            {loading ? (
              <View style={styles.loadingInline}>
                <ActivityIndicator color="#03d9ff" />
                <Text style={styles.loadingText}>Loading products...</Text>
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptyText}>Adjust search, category, type, or price filters.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            busy={busyId === item.id}
            wishlisted={wishlistIds.includes(item.id)}
            onAddToCart={onAddToCart}
            onWishlist={onWishlist}
            onDetails={(product) => navigation.navigate("ProductDetails", { productId: product.id })}
          />
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
  listContent: {
    padding: 14,
    paddingBottom: 30,
    gap: 12
  },
  panel: {
    borderWidth: 1,
    borderColor: "rgba(0,166,255,0.24)",
    borderRadius: 16,
    backgroundColor: "#06152b",
    padding: 14,
    gap: 10,
    marginBottom: 2,
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5
  },
  panelHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  panelTitle: {
    color: "#edf8ff",
    fontSize: 18,
    fontWeight: "900"
  },
  linkText: {
    color: "#03d9ff",
    fontWeight: "900"
  },
  categoryCard: {
    width: 224,
    minHeight: 176,
    borderWidth: 1,
    borderColor: "rgba(0,166,255,0.22)",
    borderRadius: 14,
    backgroundColor: "#071b33",
    padding: 10,
    gap: 6
  },
  categoryCardActive: {
    borderColor: "#03d9ff",
    backgroundColor: "rgba(0,217,255,0.1)"
  },
  categoryImage: {
    width: "100%",
    height: 92,
    borderRadius: 14,
    backgroundColor: "#0b1f3d"
  },
  categoryTitle: {
    color: "#edf8ff",
    fontWeight: "900",
    fontSize: 16
  },
  categoryDescription: {
    color: "#8ea7c4",
    lineHeight: 18
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(0,166,255,0.3)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#071b33",
    color: "#edf8ff",
    fontWeight: "700"
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8
  },
  searchInput: {
    minHeight: 52
  },
  sortButton: {
    width: 132,
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,166,255,0.3)",
    backgroundColor: "#071b33",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  sortButtonActive: {
    borderColor: "#03d9ff",
    backgroundColor: "#149dff"
  },
  sortButtonCopy: {
    minWidth: 48
  },
  sortButtonText: {
    color: "#edf8ff",
    fontSize: 13,
    fontWeight: "900"
  },
  sortButtonTextActive: {
    color: "#ffffff"
  },
  sortButtonMeta: {
    color: "#8ea7c4",
    fontSize: 10,
    fontWeight: "900"
  },
  sortButtonMetaActive: {
    color: "rgba(255,255,255,0.82)"
  },
  filterMenu: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,166,255,0.18)",
    paddingTop: 12,
    gap: 10
  },
  twoCol: {
    flexDirection: "row",
    gap: 8
  },
  chipRow: {
    gap: 8,
    paddingVertical: 2
  },
  filterTitle: {
    color: "#c3d2e4",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.4,
    textTransform: "uppercase"
  },
  chip: {
    borderWidth: 1,
    borderColor: "rgba(0,166,255,0.28)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "#071b33"
  },
  chipActive: {
    borderColor: "#03d9ff",
    backgroundColor: "rgba(0,217,255,0.12)"
  },
  chipText: {
    color: "#c3d2e4",
    fontWeight: "800",
    textTransform: "capitalize"
  },
  chipTextActive: {
    color: "#03d9ff"
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#149dff",
    alignItems: "center",
    paddingVertical: 13
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "900"
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "rgba(0,217,255,0.05)",
    alignItems: "center",
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: "rgba(0,217,255,0.3)"
  },
  secondaryButtonText: {
    color: "#c3d2e4",
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
  status: {
    color: "#20f2a3",
    backgroundColor: "rgba(32,242,163,0.1)",
    borderWidth: 1,
    borderColor: "rgba(32,242,163,0.28)",
    borderRadius: 10,
    padding: 10,
    fontWeight: "700"
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
  empty: {
    borderWidth: 1,
    borderColor: "rgba(0,166,255,0.24)",
    borderRadius: 16,
    backgroundColor: "#06152b",
    padding: 16
  },
  emptyTitle: {
    color: "#edf8ff",
    fontSize: 18,
    fontWeight: "900"
  },
  emptyText: {
    color: "#8ea7c4",
    marginTop: 4
  }
});
