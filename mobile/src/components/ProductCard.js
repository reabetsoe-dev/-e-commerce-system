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
    borderColor: "#dce8f1",
    borderRadius: 20,
    backgroundColor: "#fff",
    overflow: "hidden",
    shadowColor: "#0b376b",
    shadowOpacity: 0.09,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
  },
  imageFrame: {
    height: 206,
    margin: 12,
    marginBottom: 0,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f7fbff",
    borderWidth: 1,
    borderColor: "#e7eef7"
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
    color: "#637486",
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
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(6,68,202,0.12)"
  },
  wishlistText: {
    color: "#51637d",
    fontSize: 12,
    fontWeight: "900"
  },
  wishlistActive: {
    color: "#c4373a"
  },
  body: {
    padding: 14,
    gap: 8
  },
  category: {
    alignSelf: "flex-start",
    backgroundColor: "#eef4ff",
    color: "#0644ca",
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
    color: "#07142a"
  },
  description: {
    color: "#5d7380",
    lineHeight: 19
  },
  priceRow: {
    gap: 4
  },
  price: {
    color: "#081b42",
    fontWeight: "900",
    fontSize: 18
  },
  discount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  oldPrice: {
    color: "#82919e",
    textDecorationLine: "line-through",
    fontWeight: "700"
  },
  discountText: {
    borderRadius: 4,
    backgroundColor: "#ffe9e9",
    color: "#d73535",
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: "900"
  },
  stock: {
    color: "#5b7080",
    fontWeight: "700"
  },
  actionRow: {
    flexDirection: "row",
    gap: 8
  },
  lightButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#f5f8ff",
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d8e5ff"
  },
  lightButtonText: {
    color: "#0644ca",
    fontWeight: "900"
  },
  addButton: {
    flex: 1.25,
    borderRadius: 12,
    backgroundColor: "#0644ca",
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
