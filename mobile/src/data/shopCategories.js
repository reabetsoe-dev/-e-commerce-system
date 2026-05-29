export const PRODUCT_CATEGORIES = [
  {
    title: "Computers",
    category: "Computers",
    defaultType: "physical",
    subcategories: ["Laptops", "Desktops", "Components", "Monitors", "Computer Bundles"],
    imageUrl: "/images/laptop.jpg",
    imageAlt: "Laptop computer on a desk",
    description: "Laptops, desktops, components, monitors, and complete computer bundles."
  },
  {
    title: "ICT Products",
    category: "ICT Products",
    defaultType: "physical",
    subcategories: [
      "Accessories",
      "Storage Devices",
      "Printers & Scanners",
      "Networking Equipment",
      "Power & Protection",
      "Audio & Video",
      "Smart Devices",
      "Office Equipment",
      "Security Products"
    ],
    imageUrl: "/images/ict.jpg",
    imageAlt: "Assorted ICT products and computer accessories",
    description: "Accessories, storage, printers, networking, power, AV, smart, and office gear."
  },
  {
    title: "Web Hosting Services",
    category: "Web Hosting Services",
    defaultType: "service",
    subcategories: [
      "Hosting Packages",
      "Domain Services",
      "Website Services",
      "Email Hosting",
      "Server Services",
      "Security Services",
      "Cloud Services",
      "Developer Services",
      "Ecommerce Services"
    ],
    imageUrl: "/images/web-hosting-services.png",
    imageAlt: "Web hosting services data center with cloud hosting features",
    description: "Hosting, domains, websites, email, servers, security, cloud, developer, and store services."
  }
];

export const SHOP_CATEGORIES = PRODUCT_CATEGORIES;

export function getCategoryConfig(category) {
  return PRODUCT_CATEGORIES.find((entry) => entry.category === category);
}

export function getSubcategoriesForCategory(category) {
  return getCategoryConfig(category)?.subcategories || [];
}

export function getDefaultSubcategory(category) {
  return getSubcategoriesForCategory(category)[0] || "";
}

export function getDefaultProductType(category) {
  return getCategoryConfig(category)?.defaultType || "physical";
}

export function getAllSubcategories() {
  return PRODUCT_CATEGORIES.flatMap((category) => category.subcategories);
}
