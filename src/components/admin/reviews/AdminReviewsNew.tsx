import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getReviewsManagerTranslation } from "@/lib/translations/reviews-manager";
import { auditLogger } from "@/lib/auditLogger";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewsDataTable, ReviewData } from "./ReviewsDataTable";
import { ReviewDetailDrawer } from "./ReviewDetailDrawer";
import { ApproveReviewDialog } from "./ApproveReviewDialog";
import { RejectReviewDialog } from "./RejectReviewDialog";
import { ReplyToReviewDialog } from "./ReplyToReviewDialog";
import { DeleteReviewDialog } from "./DeleteReviewDialog";
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

export function AdminReviewsNew() {
  const { lang } = useLanguage();
  const t = useCallback((key: string) => getReviewsManagerTranslation(lang, key), [lang]);
  const { toast } = useToast();

  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    minRating: null as number | null,
    maxRating: null as number | null,
  });

  const [selectedReview, setSelectedReview] = useState<ReviewData | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const [bulkConfirmDialog, setBulkConfirmDialog] = useState<{
    open: boolean;
    action: string;
    reviewIds: string[];
  }>({ open: false, action: "", reviewIds: [] });

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, filters]);

  async function loadReviews() {
    setLoading(true);
    try {
      // Build query directly instead of using RPC
      let query = supabase
        .from("reviews")
        .select("*, products(name_en, name_ru), profiles(email, username)", { count: "exact" });

      if (filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters.minRating !== null) {
        query = query.gte("rating", filters.minRating);
      }

      if (filters.maxRating !== null) {
        query = query.lte("rating", filters.maxRating);
      }

      // Apply pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to).order("created_at", { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      // Transform data to match ReviewData type
      const transformedReviews: ReviewData[] = (data || []).map((review) => ({
        id: review.id,
        user_id: review.user_id,
        product_id: review.product_id,
        rating: review.rating,
        comment: review.comment,
        status: review.status || "pending",
        created_at: review.created_at,
        updated_at: review.updated_at,
        product_name_en: (review.products as { name_en?: string } | null)?.name_en || "",
        product_name_ru: (review.products as { name_ru?: string } | null)?.name_ru || "",
        user_email: (review.profiles as { email?: string } | null)?.email || "",
        user_username: (review.profiles as { username?: string } | null)?.username || "",
        reply_text: review.reply_text || null,
        reply_at: review.reply_at || null,
        moderated_by: review.moderated_by || null,
        is_unread: review.is_unread ?? true,
        rejection_reason: review.rejection_reason || null,
        moderator_email: null,
      }));

      setReviews(transformedReviews);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error loading reviews:", error);
      toast({
        title: t("approve.error"),
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleViewDetails(review: ReviewData) {
    setSelectedReview(review);
    setDetailDrawerOpen(true);
  }

  function handleApprove(review: ReviewData) {
    setSelectedReview(review);
    setApproveDialogOpen(true);
  }

  async function confirmApprove(reviewId: string) {
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ status: "approved" })
        .eq("id", reviewId);

      if (error) throw error;

      await auditLogger.review.approved(reviewId);

      toast({
        title: t("approve.success"),
      });

      loadReviews();
    } catch (error) {
      console.error("Error approving review:", error);
      toast({
        title: t("approve.error"),
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  }

  function handleReject(review: ReviewData) {
    setSelectedReview(review);
    setRejectDialogOpen(true);
  }

  async function confirmReject(reviewId: string, reason: string) {
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ status: "rejected" })
        .eq("id", reviewId);

      if (error) throw error;

      await auditLogger.review.rejected(reviewId, { reason });

      toast({
        title: t("reject.success"),
      });

      loadReviews();
    } catch (error) {
      console.error("Error rejecting review:", error);
      toast({
        title: t("reject.error"),
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  }

  function handleReply(review: ReviewData) {
    setSelectedReview(review);
    setReplyDialogOpen(true);
  }

  async function confirmReply(reviewId: string, replyText: string) {
    try {
      // Note: reply_text field doesn't exist in the database schema
      // For now, we'll just log the audit event
      await auditLogger.review.replied(reviewId, { reply_text: replyText });

      toast({
        title: t("reply.success"),
      });

      loadReviews();
    } catch (error) {
      console.error("Error replying to review:", error);
      toast({
        title: t("reply.error"),
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  }

  function handleDelete(review: ReviewData) {
    setSelectedReview(review);
    setDeleteDialogOpen(true);
  }

  async function confirmDelete(reviewId: string) {
    try {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId);

      if (error) throw error;

      await auditLogger.review.deleted(reviewId);

      toast({
        title: t("delete.success"),
      });

      loadReviews();
    } catch (error) {
      console.error("Error deleting review:", error);
      toast({
        title: t("delete.error"),
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  }

  async function handleToggleUnread(review: ReviewData) {
    // Note: is_unread field doesn't exist in the database schema
    toast({
      title: lang === "ru" ? "Функция недоступна" : "Feature not available",
      description: lang === "ru" ? "Поле is_unread отсутствует в схеме базы данных" : "is_unread field is not in the database schema",
    });
  }

  async function handleBulkAction(action: string, reviewIds: string[]) {
    if (action === "export") {
      handleExportCSV(reviewIds);
      return;
    }

    setBulkConfirmDialog({
      open: true,
      action,
      reviewIds,
    });
  }

  async function executeBulkAction() {
    const { action, reviewIds } = bulkConfirmDialog;
    setBulkConfirmDialog({ open: false, action: "", reviewIds: [] });

    try {
      if (action === "approve") {
        for (const reviewId of reviewIds) {
          await supabase
            .from("reviews")
            .update({ status: "approved" })
            .eq("id", reviewId);
        }
        await auditLogger.review.bulkApproved(reviewIds);
        toast({ title: `${reviewIds.length} ${t("approve.success")}` });
      } else if (action === "reject") {
        for (const reviewId of reviewIds) {
          await supabase
            .from("reviews")
            .update({ status: "rejected" })
            .eq("id", reviewId);
        }
        await auditLogger.review.bulkRejected(reviewIds);
        toast({ title: `${reviewIds.length} ${t("reject.success")}` });
      } else if (action === "delete") {
        for (const reviewId of reviewIds) {
          await supabase
            .from("reviews")
            .delete()
            .eq("id", reviewId);
        }
        await auditLogger.review.bulkDeleted(reviewIds);
        toast({ title: `${reviewIds.length} ${t("delete.success")}` });
      }

      loadReviews();
    } catch (error) {
      console.error("Error executing bulk action:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  }

  function handleExportCSV(reviewIds: string[]) {
    const selectedReviews = reviewIds.length > 0
      ? reviews.filter(r => reviewIds.includes(r.id))
      : reviews;

    const headers = [
      "ID",
      "Product",
      "User",
      "Rating",
      "Comment",
      "Status",
      "Created At",
    ];

    const rows = selectedReviews.map(review => [
      review.id,
      lang === "en" ? review.product_name_en : review.product_name_ru,
      review.user_username || review.user_email,
      review.rating,
      review.comment || "",
      review.status,
      new Date(review.created_at).toISOString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `reviews_export_${new Date().toISOString()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: t("export.success"),
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ReviewsDataTable
            reviews={reviews}
            loading={loading}
            totalCount={totalCount}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            onViewDetails={handleViewDetails}
            onApprove={handleApprove}
            onReject={handleReject}
            onReply={handleReply}
            onDelete={handleDelete}
            onToggleUnread={handleToggleUnread}
            onBulkAction={handleBulkAction}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </CardContent>
      </Card>

      <ReviewDetailDrawer
        review={selectedReview}
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        onApprove={handleApprove}
        onReject={handleReject}
        onReply={handleReply}
        onDelete={handleDelete}
        onToggleUnread={handleToggleUnread}
      />

      <ApproveReviewDialog
        review={selectedReview}
        open={approveDialogOpen}
        onClose={() => setApproveDialogOpen(false)}
        onConfirm={confirmApprove}
      />

      <RejectReviewDialog
        review={selectedReview}
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        onConfirm={confirmReject}
      />

      <ReplyToReviewDialog
        review={selectedReview}
        open={replyDialogOpen}
        onClose={() => setReplyDialogOpen(false)}
        onConfirm={confirmReply}
      />

      <DeleteReviewDialog
        review={selectedReview}
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
      />

      <AlertDialog
        open={bulkConfirmDialog.open}
        onOpenChange={(open) => !open && setBulkConfirmDialog({ open: false, action: "", reviewIds: [] })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkConfirmDialog.action === "approve" && t("approve.title")}
              {bulkConfirmDialog.action === "reject" && t("reject.title")}
              {bulkConfirmDialog.action === "delete" && t("delete.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {bulkConfirmDialog.action} {bulkConfirmDialog.reviewIds.length} review(s)?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeBulkAction}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
