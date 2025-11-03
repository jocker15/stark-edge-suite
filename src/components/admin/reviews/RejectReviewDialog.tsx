import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { getReviewsManagerTranslation } from "@/lib/translations/reviews-manager";
import { ReviewData } from "./ReviewsDataTable";

interface RejectReviewDialogProps {
  review: ReviewData | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (reviewId: string, reason: string) => Promise<void>;
}

export function RejectReviewDialog({
  review,
  open,
  onClose,
  onConfirm,
}: RejectReviewDialogProps) {
  const { lang } = useLanguage();
  const t = (key: string) => getReviewsManagerTranslation(lang, key);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!review) return;
    
    setIsSubmitting(true);
    try {
      await onConfirm(review.id, reason);
      setReason("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("reject.title")}</DialogTitle>
          <DialogDescription>
            {t("reject.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">{t("reject.reasonLabel")}</Label>
            <Textarea
              id="reason"
              placeholder={t("reject.reasonPlaceholder")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              disabled={isSubmitting}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            {t("reject.cancel")}
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? "..." : t("reject.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
