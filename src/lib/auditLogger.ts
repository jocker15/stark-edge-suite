import { supabase } from "@/integrations/supabase/client";

export interface AuditLogParams {
  actionType: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
}

export async function logAuditEvent(params: AuditLogParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn("Cannot log audit event: No authenticated user");
      return;
    }

    const { error } = await supabase
      .from("audit_logs")
      .insert({
        user_id: user.id,
        action_type: params.actionType,
        entity_type: params.entityType,
        entity_id: params.entityId,
        details: params.details || {},
        ip_address: null,
        user_agent: navigator.userAgent
      });

    if (error) {
      console.error("Failed to log audit event:", error);
    }
  } catch (error) {
    console.error("Error logging audit event:", error);
  }
}

export const auditLogger = {
  user: {
    created: (userId: string, details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "user_created",
        entityType: "user",
        entityId: userId,
        details
      }),
    updated: (userId: string, details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "user_updated",
        entityType: "user",
        entityId: userId,
        details
      }),
    deleted: (userId: string, details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "user_deleted",
        entityType: "user",
        entityId: userId,
        details
      }),
    blocked: (userId: string, details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "user_blocked",
        entityType: "user",
        entityId: userId,
        details
      }),
    unblocked: (userId: string, details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "user_unblocked",
        entityType: "user",
        entityId: userId,
        details
      }),
    roleChanged: (userId: string, details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "user_role_changed",
        entityType: "user",
        entityId: userId,
        details
      }),
    bulkBlocked: (userIds: string[], details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "bulk_user_blocked",
        entityType: "user",
        entityId: userIds.join(","),
        details: { ...details, count: userIds.length }
      }),
    bulkUnblocked: (userIds: string[], details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "bulk_user_unblocked",
        entityType: "user",
        entityId: userIds.join(","),
        details: { ...details, count: userIds.length }
      }),
    emailSent: (userId: string, details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "user_email_sent",
        entityType: "user",
        entityId: userId,
        details
      })
  },

  product: {
    created: (productId: string, details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "product_created",
        entityType: "product",
        entityId: productId,
        details
      }),
    updated: (productId: string, details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "product_updated",
        entityType: "product",
        entityId: productId,
        details
      }),
    deleted: (productId: string, details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "product_deleted",
        entityType: "product",
        entityId: productId,
        details
      }),
    bulkPublished: (productIds: number[], details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "bulk_product_published",
        entityType: "product",
        entityId: productIds.join(","),
        details: { ...details, count: productIds.length }
      }),
    bulkUnpublished: (productIds: number[], details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "bulk_product_unpublished",
        entityType: "product",
        entityId: productIds.join(","),
        details: { ...details, count: productIds.length }
      }),
    bulkArchived: (productIds: number[], details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "bulk_product_archived",
        entityType: "product",
        entityId: productIds.join(","),
        details: { ...details, count: productIds.length }
      }),
    bulkDeleted: (productIds: number[], details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "bulk_product_deleted",
        entityType: "product",
        entityId: productIds.join(","),
        details: { ...details, count: productIds.length }
      })
  },

  order: {
    created: (orderId: string, details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "order_created",
        entityType: "order",
        entityId: orderId,
        details
      }),
    updated: (orderId: string, details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "order_updated",
        entityType: "order",
        entityId: orderId,
        details
      }),
    cancelled: (orderId: string, details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "order_cancelled",
        entityType: "order",
        entityId: orderId,
        details
      }),
    refunded: (orderId: string, details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "order_refunded",
        entityType: "order",
        entityId: orderId,
        details
      }),
    markFailed: (orderId: string, details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "order_mark_failed",
        entityType: "order",
        entityId: orderId,
        details
      }),
    resendDigitalGoods: (orderId: string, details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "order_resend_digital_goods",
        entityType: "order",
        entityId: orderId,
        details
      }),
    emailSent: (orderId: string, details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "order_email_sent",
        entityType: "order",
        entityId: orderId,
        details
      })
  },

  review: {
    approved: (reviewId: string, details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "review_approved",
        entityType: "review",
        entityId: reviewId,
        details
      }),
    rejected: (reviewId: string, details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "review_rejected",
        entityType: "review",
        entityId: reviewId,
        details
      }),
    deleted: (reviewId: string, details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "review_deleted",
        entityType: "review",
        entityId: reviewId,
        details
      }),
    replied: (reviewId: string, details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "review_replied",
        entityType: "review",
        entityId: reviewId,
        details
      }),
    markedUnread: (reviewId: string, details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "review_marked_unread",
        entityType: "review",
        entityId: reviewId,
        details
      }),
    markedRead: (reviewId: string, details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "review_marked_read",
        entityType: "review",
        entityId: reviewId,
        details
      }),
    bulkApproved: (reviewIds: string[], details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "bulk_review_approved",
        entityType: "review",
        entityId: reviewIds.join(","),
        details: { ...details, count: reviewIds.length }
      }),
    bulkRejected: (reviewIds: string[], details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "bulk_review_rejected",
        entityType: "review",
        entityId: reviewIds.join(","),
        details: { ...details, count: reviewIds.length }
      }),
    bulkDeleted: (reviewIds: string[], details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "bulk_review_deleted",
        entityType: "review",
        entityId: reviewIds.join(","),
        details: { ...details, count: reviewIds.length }
      })
  },

  settings: {
    updated: (settingKey: string, details?: Record<string, unknown>) =>
      logAuditEvent({
        actionType: "settings_updated",
        entityType: "settings",
        entityId: settingKey,
        details
      })
  }
};
