import { useRoute } from "@react-navigation/native";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import PageHeader from "../components/PageHeader";

const FAQS = [
  {
    q: "Do you support both physical products and hosting subscriptions?",
    a: "Yes. Datamak supports integrated checkout for hardware, software, and hosting plans."
  },
  {
    q: "How does payment work in this project?",
    a: "Payment is simulated for demonstration but the flow mirrors real-world checkout UX."
  },
  {
    q: "Can I track my order status?",
    a: "Yes. Order timeline includes Pending, Paid, Processing, Shipped, and Delivered states."
  },
  {
    q: "Do you offer support after purchase?",
    a: "Yes. We provide support channels for hardware setup, software licensing, and hosting."
  }
];

const CONTENT = {
  about: {
    title: "About Datamak Technologies",
    subtitle:
      "Datamak Technologies delivers modern ICT commerce experiences for businesses and professionals.",
    cards: [
      ["Mission", "Enable smart digital growth through trusted technology products and services."],
      ["Vision", "Become the preferred ICT commerce and hosting partner in the region."],
      ["Core Values", "Innovation, reliability, security, and customer success."]
    ]
  },
  contact: {
    title: "Contact & Support",
    subtitle: "Need assistance with orders, hosting plans, or enterprise procurement?",
    cards: [
      ["Email", "support@datamak.local"],
      ["Phone", "+266 0000 0000"],
      ["Hours", "Mon - Fri, 08:00 - 18:00"]
    ]
  },
  faq: {
    title: "Frequently Asked Questions",
    subtitle: "Quick answers about ordering, delivery, and hosting services.",
    cards: FAQS.map((faq) => [faq.q, faq.a])
  }
};

export default function InfoScreen() {
  const route = useRoute();
  const [submitted, setSubmitted] = useState(false);
  const type = route.params?.type || route.name?.toLowerCase() || "about";
  const content = CONTENT[type] || CONTENT.about;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <PageHeader title={content.title} subtitle={content.subtitle} fallback="Home" />
      <View style={styles.grid}>
        {content.cards.map(([title, body]) => (
          <View style={styles.card} key={title}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardText}>{body}</Text>
          </View>
        ))}
        {type === "contact" ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Send Message</Text>
            {submitted ? (
              <Text style={styles.status}>Your message has been submitted successfully.</Text>
            ) : (
              <View style={styles.form}>
                <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#8ea7c4" />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#8ea7c4"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TextInput style={styles.input} placeholder="Subject" placeholderTextColor="#8ea7c4" />
                <TextInput
                  style={[styles.input, styles.messageInput]}
                  placeholder="Message"
                  placeholderTextColor="#8ea7c4"
                  multiline
                  textAlignVertical="top"
                />
                <Pressable style={styles.primaryButton} onPress={() => setSubmitted(true)}>
                  <Text style={styles.primaryButtonText}>Submit</Text>
                </Pressable>
              </View>
            )}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#f5f8fb"
  },
  content: {
    padding: 12,
    paddingBottom: 28,
    gap: 10
  },
  grid: {
    gap: 10
  },
  card: {
    borderWidth: 1,
    borderColor: "#d7e4e0",
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 14,
    gap: 6
  },
  cardTitle: {
    color: "#12384b",
    fontSize: 18,
    fontWeight: "900"
  },
  cardText: {
    color: "#5d7380",
    lineHeight: 20
  },
  form: {
    gap: 9
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#ccddda",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#163a4c",
    backgroundColor: "#fff",
    fontWeight: "800"
  },
  messageInput: {
    minHeight: 112
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "#0644ca",
    alignItems: "center",
    justifyContent: "center"
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "900"
  },
  status: {
    color: "#20f2a3",
    backgroundColor: "rgba(32,242,163,0.1)",
    borderWidth: 1,
    borderColor: "rgba(32,242,163,0.28)",
    borderRadius: 10,
    padding: 10,
    fontWeight: "700"
  }
});
