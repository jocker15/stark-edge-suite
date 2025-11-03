export interface GeneralSettings {
  site_name_en: string;
  site_name_ru: string;
  contact_email: string;
  contact_phone: string;
  social_links: {
    facebook: string;
    twitter: string;
    instagram: string;
    telegram: string;
    vk: string;
  };
}

export interface BrandingSettings {
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
}

export interface PaymentSettings {
  cryptocloud_shop_id: string;
  cryptocloud_api_key: string;
  mode: 'test' | 'production';
  default_currency: string;
  enabled: boolean;
}

export interface EmailSettings {
  resend_api_key: string;
  sender_email: string;
  sender_name: string;
  template_ids: {
    welcome: string;
    password_reset: string;
    order_confirmation: string;
    order_shipped: string;
  };
}

export interface LanguageSettings {
  active_locales: string[];
  default_language: string;
}

export interface SiteSettings {
  general: GeneralSettings;
  branding: BrandingSettings;
  payments: PaymentSettings;
  email: EmailSettings;
  language: LanguageSettings;
}

export interface PublicSettings {
  general: GeneralSettings;
  branding: BrandingSettings;
  language: LanguageSettings;
}
