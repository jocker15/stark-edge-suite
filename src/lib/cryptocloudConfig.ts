// CryptoCloud Configuration with Environment Variables

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.VITE_APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://stark-edge-suite.vercel.app';
};

export const redirectUrl = `${getBaseUrl()}/checkout/callback`;

export const CRYPTOCLOUD_SHOP_ID = 
  process.env.VITE_CRYPTOCLOUD_SHOP_ID || 
  process.env.NEXT_PUBLIC_CRYPTOCLOUD_SHOP_ID || 
  '';

export const CRYPTOCLOUD_API_KEY = process.env.CRYPTOCLOUD_API_KEY || '';

// Validate configuration
if (!CRYPTOCLOUD_SHOP_ID || !CRYPTOCLOUD_API_KEY) {
  console.warn('CryptoCloud credentials not configured');
}

export const CRYPTOCLOUD_MODE = process.env.VITE_CRYPTOCLOUD_MODE || process.env.NEXT_PUBLIC_CRYPTOCLOUD_MODE || 'test';

export const config = {
  shopId: CRYPTOCLOUD_SHOP_ID,
  apiKey: CRYPTOCLOUD_API_KEY,
  mode: CRYPTOCLOUD_MODE,
  redirectUrl,
};
