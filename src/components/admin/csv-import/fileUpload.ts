import { supabase } from '@/integrations/supabase/client';

export interface FileUploadResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFileToStorage(
  file: File,
  bucketName: string,
  path: string
): Promise<FileUploadResult> {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      filePath: data.path,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get a public URL for a file in storage
 */
export function getPublicUrl(bucketName: string, path: string): string {
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Delete a file from storage
 */
export async function deleteFile(
  bucketName: string,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([path]);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Generate a unique file path for a product file
 */
export function generateFilePath(
  productSku: string | undefined,
  fileName: string
): string {
  const timestamp = Date.now();
  const safeSku = productSku?.replace(/[^a-zA-Z0-9-_]/g, '_') || 'product';
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${safeSku}_${timestamp}_${safeFileName}`;
}
