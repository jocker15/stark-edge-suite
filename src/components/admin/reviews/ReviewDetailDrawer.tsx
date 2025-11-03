import { useLanguage } from "@/contexts/LanguageContext";
import { getReviewsManagerTranslation } from "@/lib/translations/reviews-manager";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Star, ExternalLink, Check, X, MessageSquare, Trash2, Mail, MailOpen } from "lucide-react";
import { format } from "date-fns";
import { ReviewData } from "./ReviewsDataTable";

interface ReviewDetailDrawerProps {
  review: ReviewData | null;
  open: boolean;
  onClose: () => void;
  onApprove: (review: ReviewData) => void;
  onReject: (review: ReviewData) => void;
  onReply: (review: ReviewData) => void;
  onDelete: (review: ReviewData) => void;
  onToggleUnread: (review: ReviewData) => void;
}

export function ReviewDetailDrawer({
  review,
  open,
  onClose,
  onApprove,
  onReject,
  onReply,
  onDelete,
  onToggleUnread,
}: ReviewDetailDrawerProps) {
  const { lang } = useLanguage();
  const t = (key: string) => getReviewsManagerTranslation(lang, key);

  if (!review) return null;

  const productName = lang === "en" 
    ? review.product_name_en || review.product_name_ru 
    : review.product_name_ru || review.product_name_en;

  const userName = review.user_username || review.user_email || "—";

  const getStatusBadge = (status: string) => {
    let variant: "default" | "secondary" | "destructive" = "secondary";
    if (status === "approved") variant = "default";
    if (status === "rejected") variant = "destructive";
    
    return <Badge variant={variant}>{t(`status.${status}`)}</Badge>;
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("drawer.title")}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <div>
            <h3 className="font-semibold mb-3">{t("drawer.reviewInfo")}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("drawer.rating")}</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                  <span className="ml-1 font-medium">{review.rating}</span>
                </div>
              </div>

              <div className="flex items-start justify-between">
                <span className="text-muted-foreground">{t("drawer.status")}</span>
                <div className="flex items-center gap-2">
                  {getStatusBadge(review.status)}
                  {review.is_unread && (
                    <Badge variant="outline" className="text-xs">
                      {t("drawer.unreadBadge")}
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <span className="text-muted-foreground block mb-2">{t("drawer.comment")}</span>
                <div className="p-3 bg-muted rounded-md">
                  <p className="whitespace-pre-wrap">
                    {review.comment || t("drawer.noComment")}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("drawer.submittedOn")}</span>
                <span>{format(new Date(review.created_at), "MMM dd, yyyy HH:mm")}</span>
              </div>

              {review.updated_at !== review.created_at && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("drawer.updatedOn")}</span>
                  <span>{format(new Date(review.updated_at), "MMM dd, yyyy HH:mm")}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-3">{t("drawer.productInfo")}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start justify-between">
                <span className="text-muted-foreground">{t("drawer.product")}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{productName}</span>
                  <Button size="sm" variant="ghost" asChild>
                    <a href={`/product/${review.product_id}`} target="_blank">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-3">{t("drawer.userInfo")}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start justify-between">
                <span className="text-muted-foreground">{t("drawer.user")}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{userName}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {(review.moderated_by || review.rejection_reason || review.reply_text) && (
            <>
              <div>
                <h3 className="font-semibold mb-3">{t("drawer.moderationInfo")}</h3>
                <div className="space-y-3 text-sm">
                  {review.moderated_by && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t("drawer.moderatedBy")}</span>
                      <span>{review.moderator_email || review.moderated_by}</span>
                    </div>
                  )}

                  {review.rejection_reason && (
                    <div>
                      <span className="text-muted-foreground block mb-2">
                        {t("drawer.rejectionReason")}
                      </span>
                      <div className="p-3 bg-destructive/10 rounded-md">
                        <p className="text-destructive">{review.rejection_reason}</p>
                      </div>
                    </div>
                  )}

                  {review.reply_text && (
                    <div>
                      <span className="text-muted-foreground block mb-2">
                        {t("drawer.storeReply")}
                      </span>
                      <div className="p-3 bg-primary/10 rounded-md">
                        <p className="whitespace-pre-wrap">{review.reply_text}</p>
                        {review.reply_at && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {t("drawer.repliedOn")}: {format(new Date(review.reply_at), "MMM dd, yyyy HH:mm")}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              {review.status !== "approved" && (
                <Button
                  onClick={() => {
                    onApprove(review);
                    onClose();
                  }}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {t("actions.approve")}
                </Button>
              )}
              {review.status !== "rejected" && (
                <Button
                  onClick={() => {
                    onReject(review);
                    onClose();
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  {t("actions.reject")}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  onReply(review);
                  onClose();
                }}
                variant="outline"
                className="flex-1"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {t("actions.reply")}
              </Button>
              <Button
                onClick={() => {
                  onToggleUnread(review);
                }}
                variant="outline"
                className="flex-1"
              >
                {review.is_unread ? (
                  <>
                    <MailOpen className="h-4 w-4 mr-2" />
                    {t("actions.markRead")}
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    {t("actions.markUnread")}
                  </>
                )}
              </Button>
            </div>
            <Button
              onClick={() => {
                onDelete(review);
                onClose();
              }}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t("actions.delete")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
