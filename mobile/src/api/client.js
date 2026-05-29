import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeModules, Platform } from "react-native";

function getPublicEnv(name) {
  return typeof process !== "undefined" ? process.env?.[name] : undefined;
}

function normalizeApiBaseUrl(value) {
  const trimmed = String(value || "").trim().replace(/\/+$/, "");
  if (!trimmed) {
    return "";
  }

  return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
}

function addApiBaseUrl(list, value) {
  const normalized = normalizeApiBaseUrl(value);
  if (normalized && !list.includes(normalized)) {
    list.push(normalized);
  }
}

function getExpoDevServerHost() {
  const scriptURL = NativeModules.SourceCode?.scriptURL;
  const host = scriptURL?.match(/^(?:https?|exp):\/\/([^/:?#]+)/i)?.[1];

  if (!host || host === "localhost" || host === "127.0.0.1") {
    return null;
  }

  return host;
}

function getWebHost() {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return null;
  }

  const { hostname } = window.location;
  return hostname && hostname !== "localhost" && hostname !== "127.0.0.1"
    ? hostname
    : null;
}

const EXPO_DEV_SERVER_HOST = getExpoDevServerHost();
const WEB_HOST = getWebHost();

function getApiBaseUrlCandidates() {
  const candidates = [];

  addApiBaseUrl(candidates, getPublicEnv("EXPO_PUBLIC_API_BASE_URL"));

  if (EXPO_DEV_SERVER_HOST) {
    addApiBaseUrl(candidates, `http://${EXPO_DEV_SERVER_HOST}:4000/api`);
  }

  if (WEB_HOST) {
    addApiBaseUrl(candidates, `http://${WEB_HOST}:4000/api`);
  }

  if (Platform.OS === "android") {
    addApiBaseUrl(candidates, "http://10.0.2.2:4000/api");
  }

  addApiBaseUrl(candidates, "http://localhost:4000/api");
  addApiBaseUrl(candidates, "http://127.0.0.1:4000/api");

  return candidates;
}

export const API_BASE_URL_CANDIDATES = getApiBaseUrlCandidates();
export const API_BASE_URL = API_BASE_URL_CANDIDATES[0] || "http://localhost:4000/api";

let activeApiBaseUrl = API_BASE_URL;

function getAssetBaseUrl() {
  const configuredAssetBaseUrl = getPublicEnv("EXPO_PUBLIC_ASSET_BASE_URL");
  return (configuredAssetBaseUrl || activeApiBaseUrl.replace(/\/api\/?$/i, "")).replace(
    /\/+$/,
    ""
  );
}

export const ASSET_BASE_URL = getAssetBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

api.interceptors.request.use(async (config) => {
  const configBaseUrl = normalizeApiBaseUrl(config.baseURL);
  if (!configBaseUrl || configBaseUrl === API_BASE_URL) {
    config.baseURL = activeApiBaseUrl;
  }

  const token = await AsyncStorage.getItem("shop_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function resolveAssetUrl(value) {
  if (!value || typeof value !== "string") {
    return value;
  }

  if (/^(https?:|data:|blob:|file:)/i.test(value)) {
    return value;
  }

  const assetBaseUrl = getAssetBaseUrl();
  return `${assetBaseUrl}${value.startsWith("/") ? value : `/${value}`}`;
}

function normalizeProduct(product) {
  if (!product || typeof product !== "object") {
    return product;
  }

  const imageUrl = resolveAssetUrl(product.imageUrl || product.imagePath);

  return {
    ...product,
    imageUrl,
    gallery: Array.isArray(product.gallery)
      ? product.gallery.map(resolveAssetUrl).filter(Boolean)
      : imageUrl
      ? [imageUrl]
      : []
  };
}

function normalizeCart(cart) {
  if (!cart || typeof cart !== "object") {
    return cart;
  }

  return {
    ...cart,
    items: Array.isArray(cart.items)
      ? cart.items.map((item) => ({
          ...item,
          imageUrl: resolveAssetUrl(item.imageUrl || item.imagePath)
        }))
      : []
  };
}

function normalizePayload(data) {
  if (!data || typeof data !== "object") {
    return data;
  }

  const next = { ...data };

  if (Array.isArray(next.products)) {
    next.products = next.products.map(normalizeProduct);
  }

  if (Array.isArray(next.plans)) {
    next.plans = next.plans.map(normalizeProduct);
  }

  if (Array.isArray(next.related)) {
    next.related = next.related.map(normalizeProduct);
  }

  if (Array.isArray(next.wishlist)) {
    next.wishlist = next.wishlist.map(normalizeProduct);
  }

  if (Array.isArray(next.recentlyViewed)) {
    next.recentlyViewed = next.recentlyViewed.map(normalizeProduct);
  }

  if (next.product) {
    next.product = normalizeProduct(next.product);
  }

  if (next.cart) {
    next.cart = normalizeCart(next.cart);
  }

  return next;
}

function isNetworkError(error) {
  return (
    !error?.response &&
    (error?.message === "Network Error" ||
      error?.code === "ECONNABORTED" ||
      error?.code === "ERR_NETWORK")
  );
}

function getAttemptedBaseUrls(config) {
  const values = Array.isArray(config?.__apiAttemptedBaseUrls)
    ? config.__apiAttemptedBaseUrls
    : [];
  const attempted = new Set(values);

  if (config?.baseURL) {
    attempted.add(normalizeApiBaseUrl(config.baseURL));
  }

  return attempted;
}

api.interceptors.response.use(
  (response) => {
    const responseBaseUrl = normalizeApiBaseUrl(response.config?.baseURL);
    if (responseBaseUrl) {
      activeApiBaseUrl = responseBaseUrl;
      api.defaults.baseURL = responseBaseUrl;
    }

    return {
      ...response,
      data: normalizePayload(response.data)
    };
  },
  async (error) => {
    const config = error?.config;
    if (!config || !isNetworkError(error) || config.__apiRetryComplete) {
      return Promise.reject(error);
    }

    const attempted = getAttemptedBaseUrls(config);
    const nextBaseUrl = API_BASE_URL_CANDIDATES.find((candidate) => !attempted.has(candidate));

    if (!nextBaseUrl) {
      config.__apiRetryComplete = true;
      return Promise.reject(error);
    }

    const nextConfig = {
      ...config,
      baseURL: nextBaseUrl,
      __apiAttemptedBaseUrls: [...attempted, nextBaseUrl]
    };

    return api.request(nextConfig);
  }
);

export function getApiError(error, fallback = "Request failed.") {
  if (isNetworkError(error)) {
    return "Could not connect to the backend. Start the backend, then reload Expo and try again.";
  }

  return error?.response?.data?.message || error?.message || fallback;
}

export default api;
