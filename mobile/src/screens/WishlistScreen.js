import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import PageHeader from "../components/PageHeader";
import ProductCard from "../components/ProductCard";
import { useCart } from "../context/CartContext";
import { useShop } from "../context/ShopContext";
import { getApiError } from "../api/client";

export default function WishlistScreen() {
  const navigation = useNavigation();
  const { addToCart } = useCart();
  const { wishlistProducts, wishlistIds, refreshWishlist, removeWishlist } = useShop();
  const [busyId, setBusyId] = useState("");
  const [status, setStatus] = useState("");

  const sortedWishlist = useMemo(
    () => [...wishlistProducts].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    [wishlistProducts]
  );

  useFocusEffect(
    useCallback(() => {
      refreshWishlist().catch(() => {});
    }, [])
  );

  const onAddToCart = async (productId) => {
    setBusyId(productId);
    setStatus("");
    try {
      await addToCart(productId, 1);
      setStatus("Item added to cart.");
    } catch (actionError) {
      setStatus(getApiError(actionError, "Could not add item."));
    } finally {
      setBusyId("");
    }
  };

  const onRemove = async (productId) => {
    setStatus("");
    try {
      await removeWishlist(productId);
      setStatus("Removed from wishlist.");
    } catch (actionError) {
      setStatus(getApiError(actionError, "Could not update wishlist."));
    }
  };

  return (
    <View style={styles.page}>
      <FlatList
        data={sortedWishlist}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <PageHeader
              title="Wishlist"
              subtitle="Save favorite products and move them to cart anytime."
            />
            {status ? <Text style={styles.status}>{status}</Text> : null}
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No saved products yet</Text>
            <Text style={styles.emptyText}>Tap the heart icon on products to add them here.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            busy={busyId === item.id}
            wishlisted={wishlistIds.includes(item.id)}
            onAddToCart={onAddToCart}
            onWishlist={onRemove}
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
  content: {
    padding: 14,
    paddingBottom: 28,
    gap: 10
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
