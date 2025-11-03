import { supabase } from "@/integrations/supabase/client";
import type { SiteSettings, PublicSettings } from "@/types/settings";

export async function getAllSettings(): Promise<SiteSettings | null> {
  try {
    const { data, error } = await supabase.rpc('get_site_settings');
    
    if (error) throw error;
    
    return data as SiteSettings;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return null;
  }
}

export async function getPublicSettings(): Promise<PublicSettings | null> {
  try {
    const { data, error } = await supabase.rpc('get_public_settings');
    
    if (error) throw error;
    
    return data as PublicSettings;
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return null;
  }
}

export async function updateSetting<K extends keyof SiteSettings>(
  key: K,
  value: SiteSettings[K]
): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('update_site_setting', {
      _key: key,
      _value: value
    });
    
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
