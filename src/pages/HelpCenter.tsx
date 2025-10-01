import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Book, ShoppingCart, Shield, Wallet, FileText, UserCircle } from "lucide-react";
import { Link } from "react-router-dom";

const HelpCenter = () => {
  const helpCategories = [
    {
      icon: ShoppingCart,
      title: "Getting Started",
      description: "Learn how to browse, purchase, and access digital products",
      topics: [
        "How to create an account",
        "Browsing the catalog",
        "Making your first purchase",
        "Accessing your downloads"
      ]
    },
    {
      icon: Wallet,
      title: "Payment & Billing",
      description: "Information about payments, cryptocurrencies, and invoices",
      topics: [
        "Supported cryptocurrencies",
        "How to pay with crypto",
        "Transaction confirmations",
        "Payment troubleshooting"
      ]
    },
    {
      icon: Shield,
      title: "Security & Privacy",
      description: "Learn how we protect your data and transactions",
      topics: [
        "Account security",
        "Two-factor authentication",
        "Data protection",
        "Privacy practices"
      ]
    },
    {
      icon: FileText,
      title: "Digital Templates",
      description: "Everything about our document templates",
      topics: [
        "Template categories",
        "Customization options",
        "File formats",
        "Usage guidelines"
      ]
    },
    {
      icon: UserCircle,
      title: "Game Accounts",
      description: "Information about purchasing and using game accounts",
      topics: [
        "Account delivery",
        "Account security",
        "Warranty information",
        "Account recovery"
      ]
    },
    {
      icon: Book,
      title: "Policies & Terms",
      description: "Our policies, terms of service, and legal information",
      topics: [
        "Terms of Service",
        "Privacy Policy",
        "Refund policy",
        "Acceptable use"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-bg">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2 text-center">Help Center</h1>
          <p className="text-muted-foreground text-center mb-8">
            Find guides, tutorials, and answers to your questions
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {helpCategories.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <category.icon className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {category.topics.map((topic, topicIndex) => (
                      <li key={topicIndex} className="text-muted-foreground">
                        • {topic}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="text-center">
            <CardHeader>
              <CardTitle>Still need help?</CardTitle>
              <CardDescription>
                Our support team is available 24/7 to assist you
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4 justify-center">
              <Button asChild>
                <Link to="/contact">Contact Support</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/faq">View FAQ</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HelpCenter;
