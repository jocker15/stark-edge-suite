import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function Account() {
  return (
    <div className="min-h-screen bg-gradient-dark">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-heading text-gradient-primary mb-4">
            MY ACCOUNT
          </h1>
          <p className="text-muted-foreground">
            Account management features coming soon...
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}