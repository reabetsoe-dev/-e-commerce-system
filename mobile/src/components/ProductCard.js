import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { resolveAssetUrl } from "../api/client";
import { formatMoney } from "../utils/currency";

export default function ProductCard({
  product,
  busy,
  wishlisted,
  onAddToCart,
  onDetails,
  onWishlist
}) {
  const discountPercent = Number(product.discountPercent || 0);
  const discountedPrice = Number(
    (Number(product.price || 0) * (1 - discountPercent / 100)).toFixed(2)
  );
  const isService = product.type === "service";
  const isOutOfStock = !isService && Number(product.stock || 0) <= 0;
  const imageUrl = resolveAssetUrl(product.imageUrl || product.imagePath);
  const brand = product.brand || product.provider;

  return (
    <View style={styles.card}>
      <View style={styles.imageFrame}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
        ) : (
          <View style={styles.imageFallback}>
            <Text style={styles.imageFallbackText}>No image</Text>
          </View>
        )}
        <Pressable style={styles.wishlist} onPress={() => onWishlist?.(product.id)}>
          <Text style={[styles.wishlistText, wishlisted && styles.wishlistActive]}>
            {wishlisted ? "Saved" : "Save"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text style={styles.category}>
          {brand ? `${product.category} / ${brand}` : product.category}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {product.description || product.subcategory}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatMoney(discountedPrice)}</Text>
          {discountPercent > 0 ? (
            <View style={styles.discount}>
              <Text style={styles.oldPrice}>{formatMoney(product.price)}</Text>
              <Text style={styles.discountText}>{discountPercent}% OFF</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.stock}>{isService ? "Service item" : `Stock: ${product.stock}`}</Text>

        <View style={styles.actionRow}>
          <Pressable style={styles.lightButton} onPress={() => onDetails?.(product)}>
            <Text style={styles.lightButtonText}>Details</Text>
          </Pressable>
          <Pressable
            style={[styles.addButton, (busy || isOutOfStock) && styles.disabled]}
            onPress={() => onAddToCart?.(product.id)}
            disabled={busy || isOutOfStock}
          >
            <Text style={styles.addButtonText}>
              {busy ? "Adding..." : isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "rgba(0,166,255,0.24)",
    borderRadius: 16,
    backgroundColor: "#06152b",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5
  },
  imageFrame: {
    height: 206,
    margin: 12,
    marginBottom: 0,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#071b33",
    borderWidth: 1,
    borderColor: "rgba(0,166,255,0.2)"
  },
  image: {
    width: "100%",
    height: "100%"
  },
  imageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  imageFallbackText: {
    color: "#8ea7c4",
    fontWeight: "800"
  },
  wishlist: {
    position: "absolute",
    top: 8,
    right: 8,
    minWidth: 58,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    backgroundColor: "rgba(2,8,23,0.82)",
    borderWidth: 1,
    borderColor: "rgba(0,217,255,0.28)"
  },
  wishlistText: {
    color: "#c3d2e4",
    fontSize: 12,
    fontWeight: "900"
  },
  wishlistActive: {
    color: "#20f2a3"
  },
  body: {
    padding: 14,
    gap: 8
  },
  category: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,217,255,0.12)",
    color: "#03d9ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "900"
  },
  title: {
    minHeight: 44,
    fontSize: 19,
    fontWeight: "900",
    color: "#edf8ff"
  },
  description: {
    color: "#8ea7c4",
    lineHeight: 19
  },
  priceRow: {
    gap: 4
  },
  price: {
    color: "#20f2a3",
    fontWeight: "900",
    fontSize: 18
  },
  discount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  oldPrice: {
    color: "#6f86a4",
    textDecorationLine: "line-through",
    fontWeight: "700"
  },
  discountText: {
    borderRadius: 4,
    backgroundColor: "rgba(255,107,133,0.14)",
    color: "#ff6b85",
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: "900"
  },
  stock: {
    color: "#8ea7c4",
    fontWeight: "700"
  },
  actionRow: {
    flexDirection: "row",
    gap: 8
  },
  lightButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "rgba(0,217,255,0.05)",
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,217,255,0.34)"
  },
  lightButtonText: {
    color: "#03d9ff",
    fontWeight: "900"
  },
  addButton: {
    flex: 1.25,
    borderRadius: 12,
    backgroundColor: "#149dff",
    paddingVertical: 13,
    alignItems: "center"
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "900"
  },
  disabled: {
    opacity: 0.6
  }
});
