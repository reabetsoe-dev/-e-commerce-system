import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import PageHeader from "../components/PageHeader";
import ProductCard from "../components/ProductCard";
import api, { getApiError, resolveAssetUrl } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useShop } from "../context/ShopContext";
import { formatMoney } from "../utils/currency";

export default function ProductDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { wishlistIds, toggleWishlist, markViewed } = useShop();
  const productId = route.params?.productId;
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [selectedImage, setSelectedImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const discountedPrice = useMemo(() => {
    if (!product) {
      return 0;
    }
    return Number((product.price * (1 - Number(product.discountPercent || 0) / 100)).toFixed(2));
  }, [product]);

  const isOutOfStock = product && product.type !== "service" && Number(product.stock || 0) <= 0;

  const fetchProduct = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/products/${productId}`);
      setProduct(data.product);
      setRelated(data.related || []);
      setSelectedImage(data.product?.gallery?.[0] || data.product?.imageUrl || "");
      if (user) {
        markViewed(productId);
      }
    } catch (fetchError) {
      setError(getApiError(fetchError, "Failed to load product."));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProduct();
    }, [productId])
  );

  const onAddToCart = async (id = product?.id) => {
    if (!id) {
      return;
    }
    setStatus("");
    setBusyId(id);
    try {
      await addToCart(id, 1);
      setStatus("Product added to cart.");
    } catch (addError) {
      setStatus(getApiError(addError, "Could not add item."));
    } finally {
      setBusyId("");
    }
  };

  const onBuyNow = async () => {
    await onAddToCart(product?.id);
    if (!isOutOfStock) {
      navigation.navigate("Cart");
    }
  };

  const onWishlist = async (id = product?.id) => {
    try {
      await toggleWishlist(id);
      setStatus("Wishlist updated.");
    } catch (wishlistError) {
      setStatus(getApiError(wishlistError, "Could not update wishlist."));
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0644ca" />
      </View>
    );
  }

  if (error || !product) {
    return (
      <ScrollView style={styles.page} contentContainerStyle={styles.content}>
        <PageHeader title="Product Details" subtitle="Review product information and availability." />
        <Text style={styles.error}>{error || "Product not found."}</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <PageHeader
        title={product.name}
        subtitle={`${product.category}${product.subcategory ? ` / ${product.subcategory}` : ""}`}
        fallback="Products"
      />

      {status ? <Text style={styles.status}>{status}</Text> : null}

      <View style={styles.card}>
        <Image
          source={{ uri: resolveAssetUrl(selectedImage || product.imageUrl) }}
          style={styles.mainImage}
          resizeMode="contain"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
          {(product.gallery?.length ? product.gallery : [product.imageUrl]).map((image) => (
            <Pressable
              key={image}
              style={[styles.thumbFrame, selectedImage === image && styles.thumbFrameActive]}
              onPress={() => setSelectedImage(image)}
            >
              <Image source={{ uri: resolveAssetUrl(image) }} style={styles.thumbImage} resizeMode="contain" />
            </Pressable>
          ))}
        </ScrollView>
        <Text style={styles.description}>{product.description}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatMoney(discountedPrice)}</Text>
          {product.discountPercent > 0 ? (
            <Text style={styles.discount}>{product.discountPercent}% OFF</Text>
          ) : null}
        </View>
        <Text style={styles.meta}>
          {(product.provider || product.brand) ? `${product.provider || product.brand} - ` : ""}
          {product.type === "service" ? "Service item" : `Stock: ${product.stock}`} - Rating {product.rating || "4.5"}
        </Text>
        <View style={styles.actionRow}>
          <Pressable
            style={[styles.primaryButton, isOutOfStock && styles.disabled]}
            disabled={isOutOfStock || busyId === product.id}
            onPress={() => onAddToCart(product.id)}
          >
            <Text style={styles.primaryButtonText}>
              {isOutOfStock ? "Out of Stock" : busyId === product.id ? "Adding..." : "Add to Cart"}
            </Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={onBuyNow} disabled={isOutOfStock}>
            <Text style={styles.secondaryButtonText}>Buy Now</Text>
          </Pressable>
        </View>
        <Pressable style={styles.wishlistButton} onPress={() => onWishlist(product.id)}>
          <Text style={styles.wishlistButtonText}>
            {wishlistIds.includes(product.id) ? "Remove Wishlist" : "Add Wishlist"}
          </Text>
        </Pressable>
      </View>

      {product.specifications?.length ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Specifications</Text>
          {product.specifications.map((spec) => (
            <Text style={styles.specLine} key={`${spec.label}-${spec.value}`}>
              {spec.label}: {spec.value}
            </Text>
          ))}
        </View>
      ) : null}

      {related.length ? (
        <View style={styles.related}>
          <Text style={styles.sectionTitle}>Related Products</Text>
          {related.map((item) => (
            <ProductCard
              key={item.id}
              product={item}
              busy={busyId === item.id}
              wishlisted={wishlistIds.includes(item.id)}
              onAddToCart={onAddToCart}
              onWishlist={onWishlist}
              onDetails={(entry) => navigation.push("ProductDetails", { productId: entry.id })}
            />
          ))}
        </View>
      ) : null}
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f4f8fb"
  },
  card: {
    borderWidth: 1,
    borderColor: "#dce8f1",
    borderRadius: 20,
    backgroundColor: "#fff",
    padding: 12,
    gap: 10
  },
  mainImage: {
    width: "100%",
    height: 260,
    borderRadius: 16,
    backgroundColor: "#f7fbff",
    borderWidth: 1,
    borderColor: "#e7eef7"
  },
  thumbRow: {
    gap: 8
  },
  thumbFrame: {
    width: 72,
    height: 58,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d7e4e0",
    overflow: "hidden"
  },
  thumbFrameActive: {
    borderColor: "#0644ca"
  },
  thumbImage: {
    width: "100%",
    height: "100%"
  },
  description: {
    color: "#5d7380",
    lineHeight: 20
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  price: {
    color: "#07142a",
    fontSize: 23,
    fontWeight: "900"
  },
  discount: {
    color: "#d73535",
    backgroundColor: "#ffe9e9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontWeight: "900"
  },
  meta: {
    color: "#5b7080",
    fontWeight: "700"
  },
  actionRow: {
    flexDirection: "row",
    gap: 8
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#0644ca",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "900"
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#f5f8ff",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d8e5ff"
  },
  secondaryButtonText: {
    color: "#173240",
    fontWeight: "900"
  },
  wishlistButton: {
    borderWidth: 1,
    borderColor: "#b8cef5",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  wishlistButtonText: {
    color: "#0644ca",
    fontWeight: "900"
  },
  sectionTitle: {
    color: "#12384b",
    fontSize: 18,
    fontWeight: "900"
  },
  specLine: {
    color: "#3a5a69"
  },
  related: {
    gap: 10
  },
  disabled: {
    opacity: 0.6
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
