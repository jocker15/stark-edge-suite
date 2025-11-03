import { useState, useEffect } from "react";
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

interface ReplyToReviewDialogProps {
  review: ReviewData | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (reviewId: string, replyText: string) => Promise<void>;
}

export function ReplyToReviewDialog({
  review,
  open,
  onClose,
  onConfirm,
}: ReplyToReviewDialogProps) {
  const { lang } = useLanguage();
  const t = (key: string) => getReviewsManagerTranslation(lang, key);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (review?.reply_text && open) {
      setReplyText(review.reply_text);
    } else if (open) {
      setReplyText("");
    }
  }, [review, open]);

  const handleConfirm = async () => {
    if (!review || !replyText.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onConfirm(review.id, replyText);
      setReplyText("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReplyText("");
    onClose();
  };

  const isEditing = !!review?.reply_text;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("reply.editTitle") : t("reply.title")}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t("reply.editDescription") : t("reply.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reply">{t("reply.replyLabel")}</Label>
            <Textarea
              id="reply"
              placeholder={t("reply.replyPlaceholder")}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={6}
              disabled={isSubmitting}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            {t("reply.cancel")}
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isSubmitting || !replyText.trim()}
          >
            {isSubmitting ? "..." : t("reply.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
