import "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, Text, View } from "react-native";
import HomeScreen from "./src/screens/HomeScreen";
import AuthScreen from "./src/screens/AuthScreen";
import ProductsScreen from "./src/screens/ProductsScreen";
import CartScreen from "./src/screens/CartScreen";
import CheckoutScreen from "./src/screens/CheckoutScreen";
import OrdersScreen from "./src/screens/OrdersScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import ProductDetailsScreen from "./src/screens/ProductDetailsScreen";
import HostingPlansScreen from "./src/screens/HostingPlansScreen";
import WishlistScreen from "./src/screens/WishlistScreen";
import CheckoutSuccessScreen from "./src/screens/CheckoutSuccessScreen";
import OrderDetailsScreen from "./src/screens/OrderDetailsScreen";
import InfoScreen from "./src/screens/InfoScreen";
import AdminScreen from "./src/screens/AdminScreen";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { CartProvider, useCart } from "./src/context/CartContext";
import { ShopProvider, useShop } from "./src/context/ShopContext";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const COLORS = {
  bg: "#020817",
  panel: "#06152b",
  panelAlt: "#071b33",
  line: "rgba(0,166,255,0.24)",
  blue: "#149dff",
  cyan: "#03d9ff",
  green: "#20f2a3",
  text: "#edf8ff",
  muted: "#8ea7c4"
};
const TAB_ICONS = {
  Home: ["home", "home-outline"],
  Catalog: ["storefront", "storefront-outline"],
  Hosting: ["server", "server-outline"],
  Wishlist: ["heart", "heart-outline"],
  Cart: ["cart", "cart-outline"],
  Orders: ["receipt", "receipt-outline"],
  Profile: ["person-circle", "person-circle-outline"],
  Admin: ["shield-checkmark", "shield-checkmark-outline"]
};

function LoadingScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.bg
      }}
    >
      <ActivityIndicator size="large" color={COLORS.cyan} />
      <Text style={{ marginTop: 12, color: COLORS.text, fontWeight: "900" }}>Loading...</Text>
    </View>
  );
}

function AppTabs() {
  const { user } = useAuth();
  const { cart } = useCart();
  const { wishlistIds } = useShop();
  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: COLORS.bg
        },
        headerTitleStyle: {
          color: COLORS.text,
          fontWeight: "900"
        },
        headerTintColor: COLORS.cyan,
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: COLORS.bg },
        tabBarActiveTintColor: COLORS.cyan,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: {
          backgroundColor: COLORS.panel,
          borderTopColor: COLORS.line,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
          shadowColor: "#000",
          shadowOpacity: 0.34,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: -4 },
          elevation: 12
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "900"
        },
        tabBarBadgeStyle: {
          backgroundColor: COLORS.blue,
          color: "#fff",
          fontWeight: "900"
        },
        tabBarIcon: ({ color, focused }) => {
          const [activeIcon, inactiveIcon] = TAB_ICONS[route.name] || [
            "ellipse",
            "ellipse-outline"
          ];

          return (
            <Ionicons
              name={focused ? activeIcon : inactiveIcon}
              size={focused ? 24 : 22}
              color={color}
            />
          );
        }
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Catalog" component={ProductsScreen} />
      <Tab.Screen name="Hosting" component={HostingPlansScreen} />
      <Tab.Screen
        name="Wishlist"
        options={{
          tabBarBadge: user && wishlistIds.length > 0 ? wishlistIds.length : undefined
        }}
      >
        {() => (
          <ProtectedScreen>
            <WishlistScreen />
          </ProtectedScreen>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Cart"
        options={{
          tabBarBadge: user && cartCount > 0 ? cartCount : undefined
        }}
      >
        {() => (
          <ProtectedScreen>
            <CartScreen />
          </ProtectedScreen>
        )}
      </Tab.Screen>
      <Tab.Screen name="Orders">
        {() => (
          <ProtectedScreen>
            <OrdersScreen />
          </ProtectedScreen>
        )}
      </Tab.Screen>
      <Tab.Screen name="Profile">
        {() => (
          <ProtectedScreen>
            <ProfileScreen />
          </ProtectedScreen>
        )}
      </Tab.Screen>
      {user?.role === "admin" && (
        <Tab.Screen name="Admin">
          {() => (
            <ProtectedScreen requireAdmin>
              <AdminScreen />
            </ProtectedScreen>
          )}
        </Tab.Screen>
      )}
    </Tab.Navigator>
  );
}

function ProtectedScreen({ children, requireAdmin = false }) {
  const { token, user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!token) {
    return <AuthScreen embedded />;
  }

  if (requireAdmin && user?.role !== "admin") {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
          backgroundColor: COLORS.bg
        }}
      >
        <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: "900" }}>
          Admin access required.
        </Text>
      </View>
    );
  }

  return children;
}

function AppStack() {
  return (
    <CartProvider>
      <ShopProvider>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Tabs" component={AppTabs} />
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} />
          <Stack.Screen name="CheckoutSuccess" component={CheckoutSuccessScreen} />
          <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
          <Stack.Screen name="About" component={InfoScreen} initialParams={{ type: "about" }} />
          <Stack.Screen name="Contact" component={InfoScreen} initialParams={{ type: "contact" }} />
          <Stack.Screen name="FAQ" component={InfoScreen} initialParams={{ type: "faq" }} />
        </Stack.Navigator>
      </ShopProvider>
    </CartProvider>
  );
}

function RootNavigator() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return <AppStack />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
