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
  const availability = product.availabilityStatus || (isOutOfStock ? "Out of Stock" : "In Stock");

  return (
    <View style={styles.card}>
      <Pressable style={[styles.wishlist, wishlisted && styles.wishlistActiveButton]} onPress={() => onWishlist?.(product.id)}>
        <Text style={[styles.wishlistText, wishlisted && styles.wishlistActiveText]}>
          {wishlisted ? "♥" : "♡"}
        </Text>
      </Pressable>

      <Pressable style={styles.imageFrame} onPress={() => onDetails?.(product)}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
        ) : (
          <View style={styles.imageFallback}>
            <Text style={styles.imageFallbackText}>No image</Text>
          </View>
        )}
      </Pressable>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.metaRow}>
          {brand ? <Text style={styles.metaPill}>{brand}</Text> : null}
          <Text style={[styles.metaPill, isOutOfStock && styles.metaPillDanger]}>{availability}</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatMoney(discountedPrice)}</Text>
          {discountPercent > 0 ? (
            <View style={styles.discount}>
              <Text style={styles.oldPrice}>{formatMoney(product.price)}</Text>
              <Text style={styles.discountText}>{discountPercent}% OFF</Text>
            </View>
          ) : null}
        </View>

        <Pressable style={styles.detailsButton} onPress={() => onDetails?.(product)}>
          <Text style={styles.detailsButtonText}>Details</Text>
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
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#e4e9f1",
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3
  },
  imageFrame: {
    height: 206,
    margin: 12,
    marginBottom: 0,
    borderRadius: 8,
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
    color: "#6b7789",
    fontWeight: "800"
  },
  wishlist: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 2,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dfe7f2",
    shadowColor: "#0f172a",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4
  },
  wishlistActiveButton: {
    borderColor: "#ffb3c0",
    backgroundColor: "#fff3f5"
  },
  wishlistText: {
    color: "#738198",
    fontSize: 22,
    fontWeight: "900"
  },
  wishlistActiveText: {
    color: "#f03e3e"
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
    color: "#07142a"
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  metaPill: {
    color: "#5b6d83",
    backgroundColor: "#f3f7fb",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: "800"
  },
  metaPillDanger: {
    color: "#c92a2a",
    backgroundColor: "#fff0f0"
  },
  priceRow: {
    gap: 4
  },
  price: {
    color: "#07142a",
    fontWeight: "900",
    fontSize: 20
  },
  discount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  oldPrice: {
    color: "#8b98aa",
    textDecorationLine: "line-through",
    fontWeight: "700"
  },
  discountText: {
    borderRadius: 4,
    backgroundColor: "#ffe9e9",
    color: "#c92a2a",
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: "900"
  },
  detailsButton: {
    borderRadius: 8,
    backgroundColor: "#f8fbff",
    paddingVertical: 11,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dce6f0"
  },
  detailsButtonText: {
    color: "#0644ca",
    fontWeight: "900"
  },
  addButton: {
    borderRadius: 8,
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
