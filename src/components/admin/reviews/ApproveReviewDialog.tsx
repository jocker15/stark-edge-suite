import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { getReviewsManagerTranslation } from "@/lib/translations/reviews-manager";
import { ReviewData } from "./ReviewsDataTable";

interface ApproveReviewDialogProps {
  review: ReviewData | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (reviewId: string) => Promise<void>;
}

export function ApproveReviewDialog({
  review,
  open,
  onClose,
  onConfirm,
}: ApproveReviewDialogProps) {
  const { lang } = useLanguage();
  const t = (key: string) => getReviewsManagerTranslation(lang, key);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!review) return;
    
    setIsSubmitting(true);
    try {
      await onConfirm(review.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("approve.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("approve.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>
            {t("approve.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? "..." : t("approve.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
