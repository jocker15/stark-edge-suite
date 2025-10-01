import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  return (
    <div className="min-h-screen bg-gradient-bg">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-2 text-center">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            Find answers to common questions about our services
          </p>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1">
              <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
              <AccordionContent>
                We accept all major cryptocurrencies including BTC, ETH, USDT, LTC, SOL, BNB, TRX, and TON. Payments are processed securely through our cryptocurrency payment gateway.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>How long does delivery take?</AccordionTrigger>
              <AccordionContent>
                Digital products are delivered instantly after payment confirmation. Game accounts are typically delivered within 5-15 minutes after your payment is confirmed on the blockchain.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>What is your refund policy?</AccordionTrigger>
              <AccordionContent>
                Due to the nature of digital products, refunds are only available in cases where the product is not as described or if there are technical issues preventing access. Please contact our support team within 24 hours of purchase for refund requests.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>Are the game accounts safe?</AccordionTrigger>
              <AccordionContent>
                Yes, all game accounts are obtained through legitimate means and come with full access credentials. We guarantee the security of your purchase, and our accounts are protected against unauthorized recovery attempts.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>Can I verify documents with your templates?</AccordionTrigger>
              <AccordionContent>
                Our document templates are for novelty and educational purposes only. They should not be used for any illegal activities or fraud. We do not endorse or support the use of our products for verification of identity or any official purposes.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger>How do I access my purchased products?</AccordionTrigger>
              <AccordionContent>
                After your payment is confirmed, you can access your purchased products from your account dashboard. You'll also receive an email with download links and access instructions.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger>Do you offer customer support?</AccordionTrigger>
              <AccordionContent>
                Yes, we offer 24/7 customer support through our live chat widget and email. Our team is always ready to help with any questions or issues you may have.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8">
              <AccordionTrigger>Is my personal information secure?</AccordionTrigger>
              <AccordionContent>
                We take security very seriously. All personal information is encrypted and stored securely. We never share your information with third parties, and we use industry-standard security measures to protect your data.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;
