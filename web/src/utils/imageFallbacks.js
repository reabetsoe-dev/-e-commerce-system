const CATEGORY_FALLBACKS = {
  Computers: "/images/tech-e-comm.jpg",
  "ICT Products": "/images/ict.jpg",
  "Web Hosting Services": "/images/tech-e-comm.jpg"
};

export function getProductImageFallback(category) {
  return CATEGORY_FALLBACKS[category] || "/images/tech-e-comm.jpg";
}

export function getImageSource(src, category) {
  return src || getProductImageFallback(category);
}

export function applyImageFallback(event, category) {
  const image = event.currentTarget;

  if (image.dataset.fallbackApplied === "true") {
    return;
  }

  image.dataset.fallbackApplied = "true";
  image.src = getProductImageFallback(category);
}
