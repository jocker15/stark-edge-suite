import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-bg">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2 text-center">Terms of Service</h1>
          <p className="text-muted-foreground text-center mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>
                By accessing and using Digital Edge services, you accept and agree to be 
                bound by these Terms of Service. If you do not agree to these terms, 
                please do not use our services.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>2. Use of Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>You agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Use our services only for lawful purposes</li>
                <li>Not engage in fraudulent or deceptive practices</li>
                <li>Not attempt to circumvent security measures</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>3. Digital Products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>
                All digital products sold on our platform are provided "as is" without 
                warranty. Document templates are for novelty and educational purposes only 
                and should not be used for fraudulent purposes or identity verification.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>4. Game Accounts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>
                Game accounts are sold with full access credentials. By purchasing a game 
                account, you acknowledge that:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Account ownership is transferred to you upon purchase</li>
                <li>You are responsible for maintaining account security</li>
                <li>We are not liable for any actions taken by game publishers</li>
                <li>Refunds are subject to our refund policy</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>5. Payment Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>
                We accept cryptocurrency payments only. All prices are listed in USD 
                equivalent. Cryptocurrency transactions are final and non-reversible. 
                Refunds, when approved, will be issued in the original cryptocurrency.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>6. Refund Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>
                Due to the nature of digital products, refunds are only available in 
                limited circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Product is significantly different from description</li>
                <li>Technical issues prevent product access</li>
                <li>Duplicate purchase</li>
              </ul>
              <p className="mt-4">
                Refund requests must be submitted within 24 hours of purchase.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>7. Prohibited Activities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>You may not:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use our products for illegal activities</li>
                <li>Share, resell, or redistribute purchased products</li>
                <li>Attempt to reverse engineer or modify our products</li>
                <li>Engage in fraudulent chargebacks</li>
                <li>Violate intellectual property rights</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>8. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>
                Digital Edge shall not be liable for any indirect, incidental, special, 
                or consequential damages arising from your use of our services. Our total 
                liability shall not exceed the amount paid for the specific product or 
                service in question.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>
                We reserve the right to modify these terms at any time. Continued use of 
                our services after changes constitutes acceptance of the modified terms.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;
