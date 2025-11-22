import { ReactNode } from 'react';
import { Clipboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadZoneProps {
  isActive: boolean;
  onActivate: () => void;
  pasteHint?: string;
  children: ReactNode;
  className?: string;
  showPasteHint?: boolean;
}

export function ImageUploadZone({
  isActive,
  onActivate,
  pasteHint,
  children,
  className,
  showPasteHint = true,
}: ImageUploadZoneProps) {
  return (
    <div
      className={cn(
        'rounded-lg border-2 border-dashed p-4 transition-all cursor-pointer',
        isActive
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50',
        className
      )}
      onClick={onActivate}
      onFocus={onActivate}
      tabIndex={0}
      role="button"
      aria-label="Click to activate paste target"
    >
      {children}
      {showPasteHint && pasteHint && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
          <Clipboard className="h-4 w-4" />
          <span>{pasteHint}</span>
        </div>
      )}
    </div>
  );
}
