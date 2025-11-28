import { supabase } from "@/integrations/supabase/client";
import type { SiteSettings, PublicSettings } from "@/types/settings";

// Default settings values (fallback)
const defaultSettings: SiteSettings = {
  general: {
    site_name_en: "My Store",
    site_name_ru: "Мой магазин",
    contact_email: "",
    contact_phone: "",
    social_links: {
      facebook: "",
      twitter: "",
      instagram: "",
      telegram: "",
      vk: "",
    },
  },
  branding: {
    logo_url: "",
    favicon_url: "",
    primary_color: "#000000",
    secondary_color: "#ffffff",
  },
  payments: {
    cryptocloud_shop_id: "",
    cryptocloud_api_key: "",
    mode: "test",
    default_currency: "USD",
    enabled: false,
  },
  email: {
    resend_api_key: "",
    sender_email: "",
    sender_name: "",
    template_ids: {
      welcome: "",
      password_reset: "",
      order_confirmation: "",
      order_shipped: "",
    },
  },
  language: {
    active_locales: ["en", "ru"],
    default_language: "en",
  },
};

export async function getAllSettings(): Promise<SiteSettings | null> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    
    if (!data) return defaultSettings;

    return {
      general: data.general as unknown as SiteSettings['general'],
      branding: data.branding as unknown as SiteSettings['branding'],
      payments: data.payments as unknown as SiteSettings['payments'],
      email: data.email as unknown as SiteSettings['email'],
      language: data.language as unknown as SiteSettings['language'],
    };
  } catch (error) {
    console.error('Error fetching settings:', error);
    return defaultSettings;
  }
}

export async function getPublicSettings(): Promise<PublicSettings | null> {
  try {
    const { data, error } = await supabase.rpc('get_public_settings');

    if (error) throw error;
    
    if (!data) {
      return {
        general: defaultSettings.general,
        branding: defaultSettings.branding,
        language: defaultSettings.language,
      };
    }

    return data as unknown as PublicSettings;
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return {
      general: defaultSettings.general,
      branding: defaultSettings.branding,
      language: defaultSettings.language,
    };
  }
}

export async function updateSetting<K extends keyof SiteSettings>(
  key: K,
  value: SiteSettings[K]
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('site_settings')
      .update({ [key]: value, updated_at: new Date().toISOString() })
      .eq('id', (await supabase.from('site_settings').select('id').limit(1).single()).data?.id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating setting:', error);
    return false;
  }
}

export async function uploadBrandingAsset(
  file: File,
  type: 'logo' | 'favicon'
): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${type}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('branding-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('branding-assets')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading branding asset:', error);
    return null;
  }
}

export async function deleteBrandingAsset(url: string): Promise<boolean> {
  try {
    const path = url.split('/branding-assets/').pop();
    if (!path) return false;

    const { error } = await supabase.storage
      .from('branding-assets')
      .remove([path]);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting branding asset:', error);
    return false;
  }
}

export async function testPaymentConnection(
  shopId: string,
  apiKey: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch('https://api.cryptocloud.plus/v1/shop/info', {
      method: 'GET',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return {
        success: false,
        message: 'Invalid credentials or shop not found'
      };
    }

    const data = await response.json();
    
    if (data.shop_id === shopId) {
      return { success: true };
    }

    return {
      success: false,
      message: 'Shop ID mismatch'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection failed'
    };
  }
}

export async function sendTestEmail(
  apiKey: string,
  senderEmail: string,
  senderName: string,
  testEmail: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${senderName} <${senderEmail}>`,
        to: [testEmail],
        subject: 'Test Email from Settings',
        html: '<p>This is a test email to verify your email settings configuration.</p>'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: error.message || 'Failed to send test email'
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send test email'
    };
  }
}
