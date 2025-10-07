export function Footer() {
  return <footer className="bg-card/30 backdrop-blur border-t border-border/50 py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded glow-primary"></div>
              <span className="text-xl font-heading text-gradient-primary">
                DIGITAL EDGE
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Next-generation digital solutions with military-grade security and cutting-edge technology.
            </p>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="font-heading text-sm text-foreground">SERVICES</h3>
            <div className="space-y-2">
              <a href="/verifications" className="block text-sm text-muted-foreground hover:text-accent transition-colors">
                Verification Services
              </a>
              <a href="/game-accounts" className="block text-sm text-muted-foreground hover:text-accent transition-colors">
                Game Accounts
              </a>
              <a href="/digital-templates" className="block text-sm text-muted-foreground hover:text-accent transition-colors">
                Digital Templates
              </a>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-heading text-sm text-foreground">SUPPORT</h3>
            <div className="space-y-2">
              <a href="/contact" className="block text-sm text-muted-foreground hover:text-accent transition-colors">
                Contact Us
              </a>
              <a href="/faq" className="block text-sm text-muted-foreground hover:text-accent transition-colors">
                FAQ
              </a>
              <a href="/help" className="block text-sm text-muted-foreground hover:text-accent transition-colors">
                Help Center
              </a>
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="font-heading text-sm text-foreground">LEGAL</h3>
            <div className="space-y-2">
              <a href="/privacy" className="block text-sm text-muted-foreground hover:text-accent transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="block text-sm text-muted-foreground hover:text-accent transition-colors">
                Terms of Service
              </a>
              <a href="/security" className="block text-sm text-muted-foreground hover:text-accent transition-colors">
                Security
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border/30 mt-12 pt-8">
          {/* Accepted Cryptocurrencies */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground text-center mb-4">We accept</p>
            <div className="flex flex-wrap justify-center items-center gap-6">
              <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#F7931A] flex items-center justify-center">
                  <span className="text-white font-bold text-xs">₿</span>
                </div>
                <span className="text-xs font-medium">BTC</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#627EEA] flex items-center justify-center">
                  <span className="text-white font-bold text-xs">Ξ</span>
                </div>
                <span className="text-xs font-medium">ETH</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#26A17B] flex items-center justify-center">
                  <span className="text-white font-bold text-xs">₮</span>
                </div>
                <span className="text-xs font-medium">USDT</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#345D9D] flex items-center justify-center">
                  <span className="text-white font-bold text-xs">Ł</span>
                </div>
                <span className="text-xs font-medium">LTC</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#9945FF] to-[#14F195] flex items-center justify-center">
                  <span className="text-white font-bold text-xs">◎</span>
                </div>
                <span className="text-xs font-medium">SOL</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#F3BA2F] flex items-center justify-center">
                  <span className="text-white font-bold text-xs">B</span>
                </div>
                <span className="text-xs font-medium">BNB</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#FF0013] flex items-center justify-center">
                  <span className="text-white font-bold text-xs">T</span>
                </div>
                <span className="text-xs font-medium">TRX</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#0088CC] flex items-center justify-center">
                  <span className="text-white font-bold text-xs">💎</span>
                </div>
                <span className="text-xs font-medium">TON</span>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            © 2024 Digital Edge. All rights reserved. Powered by next-generation technology.
          </p>
        </div>
      </div>
    </footer>;
}