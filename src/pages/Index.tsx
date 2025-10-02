import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/home/hero-section";
import { ServicesGrid } from "@/components/home/services-grid";
import { DefaultSEO } from "@/components/seo/DefaultSEO";
import { OrganizationSchema } from "@/components/seo/OrganizationSchema";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-bg">
      <DefaultSEO />
      <OrganizationSchema />
      <Header />
      <main>
        <HeroSection />
        <ServicesGrid />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
