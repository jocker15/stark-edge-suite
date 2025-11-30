import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { TelegramButton } from "@/components/ui/telegram-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import Index from "./pages/Index";

const SignUp = lazy(() => import("./pages/SignUp"));
const SignIn = lazy(() => import("./pages/SignIn"));
const Account = lazy(() => import("./pages/Account"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminSecurityCenter = lazy(() => import("./pages/AdminSecurityCenter"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const GameAccounts = lazy(() => import("./pages/game-accounts"));
const DigitalTemplates = lazy(() => import("./pages/DigitalTemplates"));
const Verifications = lazy(() => import("./pages/Verifications"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentFailed = lazy(() => import("./pages/PaymentFailed"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const FAQ = lazy(() => import("./pages/FAQ"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Security = lazy(() => import("./pages/Security"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" storageKey="app-theme" enableSystem>
      <AuthProvider>
        <CartProvider>
          <LanguageProvider>
            <SettingsProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <TelegramButton />
                <BrowserRouter>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/signup" element={<SignUp />} />
                      <Route path="/signin" element={<SignIn />} />
                      <Route path="/account" element={<Account />} />
                      <Route path="/admin" element={<Admin />} />
                      <Route path="/admin/dashboard" element={<AdminDashboard />} />
                      <Route path="/admin/security" element={<AdminSecurityCenter />} />
                      <Route path="/admin/settings" element={<AdminSettings />} />
                      <Route path="/game-accounts" element={<GameAccounts />} />
                      <Route path="/digital-templates" element={<DigitalTemplates />} />
                      <Route path="/products/:id" element={<ProductDetail />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/wishlist" element={<Wishlist />} />
                      <Route path="/verifications" element={<Verifications />} />
                      <Route path="/payment-success" element={<PaymentSuccess />} />
                      <Route path="/payment-failed" element={<PaymentFailed />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/search" element={<SearchResults />} />
                      <Route path="/contact" element={<ContactUs />} />
                      <Route path="/faq" element={<FAQ />} />
                      <Route path="/help" element={<HelpCenter />} />
                      <Route path="/privacy" element={<PrivacyPolicy />} />
                      <Route path="/terms" element={<TermsOfService />} />
                      <Route path="/security" element={<Security />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </TooltipProvider>
            </SettingsProvider>
          </LanguageProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
