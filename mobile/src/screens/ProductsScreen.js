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
                    color={sortMenuOpen ? "#ffffff" : "#0644ca"}
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
                    color={sortMenuOpen ? "#ffffff" : "#5d7380"}
                  />
                </Pressable>
              </View>

              {sortMenuOpen ? (
                <View style={styles.filterMenu}>
                  <View style={styles.twoCol}>
                    <TextInput
                      style={styles.input}
                      placeholder="Min price"
                      keyboardType="numeric"
                      value={filters.minPrice}
                      onChangeText={(value) => updateFilters({ minPrice: value })}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Max price"
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
                <ActivityIndicator color="#0644ca" />
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
    backgroundColor: "#f4f8fb"
  },
  listContent: {
    padding: 12,
    paddingBottom: 28,
    gap: 10
  },
  panel: {
    borderWidth: 1,
    borderColor: "#dce8f1",
    borderRadius: 20,
    backgroundColor: "#fff",
    padding: 14,
    gap: 10,
    marginBottom: 2,
    shadowColor: "#0b376b",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2
  },
  panelHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  panelTitle: {
    color: "#081327",
    fontSize: 18,
    fontWeight: "900"
  },
  linkText: {
    color: "#0644ca",
    fontWeight: "900"
  },
  categoryCard: {
    width: 224,
    minHeight: 176,
    borderWidth: 1,
    borderColor: "#e2e8f2",
    borderRadius: 18,
    backgroundColor: "#fff",
    padding: 10,
    gap: 6
  },
  categoryCardActive: {
    borderColor: "#0644ca",
    backgroundColor: "#eef4ff"
  },
  categoryImage: {
    width: "100%",
    height: 92,
    borderRadius: 14,
    backgroundColor: "#f3f7fb"
  },
  categoryTitle: {
    color: "#081327",
    fontWeight: "900",
    fontSize: 16
  },
  categoryDescription: {
    color: "#5d7380",
    lineHeight: 18
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d2e0ec",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
    color: "#081327",
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
    borderColor: "#d8e5ff",
    backgroundColor: "#f5f8ff",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  sortButtonActive: {
    borderColor: "#0644ca",
    backgroundColor: "#0644ca"
  },
  sortButtonCopy: {
    minWidth: 48
  },
  sortButtonText: {
    color: "#10264a",
    fontSize: 13,
    fontWeight: "900"
  },
  sortButtonTextActive: {
    color: "#ffffff"
  },
  sortButtonMeta: {
    color: "#5d7380",
    fontSize: 10,
    fontWeight: "900"
  },
  sortButtonMetaActive: {
    color: "rgba(255,255,255,0.82)"
  },
  filterMenu: {
    borderTopWidth: 1,
    borderTopColor: "#e5eef6",
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
    color: "#10264a",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.4,
    textTransform: "uppercase"
  },
  chip: {
    borderWidth: 1,
    borderColor: "#d2e0ec",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "#fff"
  },
  chipActive: {
    borderColor: "#0644ca",
    backgroundColor: "#eef4ff"
  },
  chipText: {
    color: "#173240",
    fontWeight: "800",
    textTransform: "capitalize"
  },
  chipTextActive: {
    color: "#0644ca"
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#0644ca",
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
    backgroundColor: "#f5f8ff",
    alignItems: "center",
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: "#d8e5ff"
  },
  secondaryButtonText: {
    color: "#173240",
    fontWeight: "900"
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
  empty: {
    borderWidth: 1,
    borderColor: "#dce8f1",
    borderRadius: 18,
    backgroundColor: "#fff",
    padding: 16
  },
  emptyTitle: {
    color: "#15384b",
    fontSize: 18,
    fontWeight: "900"
  },
  emptyText: {
    color: "#5f7480",
    marginTop: 4
  }
});
