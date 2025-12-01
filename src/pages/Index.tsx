import { lazy, Suspense } from "react";
import { Header } from "@/components/layout/header";
import { HeroSection } from "@/components/home/hero-section";
import { DefaultSEO } from "@/components/seo/DefaultSEO";
import { OrganizationSchema } from "@/components/seo/OrganizationSchema";

const ServicesGrid = lazy(() => import("@/components/home/services-grid").then(m => ({ default: m.ServicesGrid })));
const Footer = lazy(() => import("@/components/layout/footer").then(m => ({ default: m.Footer })));

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-bg">
      <DefaultSEO />
      <OrganizationSchema />
      <Header />
      <main id="main-content">
        <HeroSection />
        <Suspense fallback={<div className="h-96" />}>
          <ServicesGrid />
        </Suspense>
      </main>
      <Suspense fallback={<div className="h-64" />}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Index;
