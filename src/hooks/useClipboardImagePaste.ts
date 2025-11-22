import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface ClipboardPasteOptions {
  maxSizeBytes?: number;
  onPaste: (file: File) => Promise<void>;
  onError?: (error: string) => void;
  acceptedTypes?: string[];
  successMessage?: string;
  errorMessages?: {
    invalidType?: string;
    tooLarge?: string;
  };
}

export interface ClipboardPasteState {
  isActive: boolean;
  setActive: () => void;
  isPasting: boolean;
}

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_ACCEPTED_TYPES = ['image/'];

export function useClipboardImagePaste(options: ClipboardPasteOptions): ClipboardPasteState {
  const {
    maxSizeBytes = DEFAULT_MAX_SIZE,
    onPaste,
    onError,
    acceptedTypes = DEFAULT_ACCEPTED_TYPES,
    successMessage,
    errorMessages = {},
  } = options;

  const { toast } = useToast();
  const [isActive, setIsActive] = useState(false);
  const [isPasting, setIsPasting] = useState(false);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    const isValidType = acceptedTypes.some(type => file.type.startsWith(type));
    if (!isValidType) {
      return errorMessages.invalidType || 'Invalid file type. Only images are supported';
    }

    // Check file size
    if (file.size > maxSizeBytes) {
      return errorMessages.tooLarge || `File size must be less than ${Math.round(maxSizeBytes / 1024 / 1024)}MB`;
    }

    return null;
  }, [maxSizeBytes, acceptedTypes, errorMessages]);

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    if (!isActive || isPasting) return;

    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.kind === 'file') {
        const isImage = acceptedTypes.some(type => item.type.startsWith(type));

        if (isImage) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (!blob) continue;

          // Create File with unique name
          const extension = blob.type.split('/')[1] || 'png';
          const timestamp = Date.now();
          const uuid = crypto.randomUUID();
          const fileName = `pasted-${timestamp}-${uuid}.${extension}`;
          const file = new File([blob], fileName, { type: blob.type });

          // Validate file
          const error = validateFile(file);
          if (error) {
            if (onError) {
              onError(error);
            } else {
              toast({
                title: 'Error',
                description: error,
                variant: 'destructive',
              });
            }
            return;
          }

          // Upload file
          setIsPasting(true);
          try {
            await onPaste(file);
            if (successMessage) {
              toast({
                title: successMessage,
              });
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to upload file';
            if (onError) {
              onError(errorMsg);
            } else {
              toast({
                title: 'Error',
                description: errorMsg,
                variant: 'destructive',
              });
            }
          } finally {
            setIsPasting(false);
          }
          break;
        } else {
          const errorMsg = errorMessages.invalidType || 'Invalid file type. Only images are supported';
          if (onError) {
            onError(errorMsg);
          } else {
            toast({
              title: 'Error',
              description: errorMsg,
              variant: 'destructive',
            });
          }
          break;
        }
      }
    }
  }, [isActive, isPasting, acceptedTypes, validateFile, onPaste, onError, successMessage, toast, errorMessages]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  return {
    isActive,
    setActive: useCallback(() => setIsActive(true), []),
    isPasting,
  };
}

// Utility function to detect platform
export function getPasteHintKey(baseKey: string): string {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  return isMac ? `${baseKey}Mac` : baseKey;
}
