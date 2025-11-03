import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUserManagerTranslation } from "@/lib/translations/user-manager";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Ban, UnlockKeyhole, Trash2, Mail, KeyRound, Loader2, ExternalLink, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { UserStats } from "./UsersDataTable";
import { EditUserDialog } from "./EditUserDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { SendEmailDialog } from "./SendEmailDialog";
import { BlockUserDialog } from "./BlockUserDialog";

interface UserProfileDrawerProps {
  user: UserStats | null;
  open: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
}

interface UserOrder {
  order_id: number;
  amount: number;
  status: string;
  created_at: string;
  order_details: Record<string, unknown>;
  payment_details: Record<string, unknown>;
}

interface WishlistItem {
  wishlist_id: string;
  product_id: number;
  product_name_en: string;
  product_name_ru: string;
  price: number;
  image_urls: string[];
  created_at: string;
}

interface UserReview {
  review_id: string;
  product_id: number;
  product_name_en: string;
  product_name_ru: string;
  rating: number;
  comment: string;
  status: string;
  created_at: string;
}

interface ChatSession {
  id: string;
  tawk_chat_id: string;
  status: string;
  visitor_name: string | null;
  visitor_email: string | null;
  created_at: string;
  updated_at: string;
}

export function UserProfileDrawer({ user, open, onClose, onUserUpdated }: UserProfileDrawerProps) {
  const { lang } = useLanguage();
  const t = useCallback((key: string) => getUserManagerTranslation(lang, key), [lang]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);

  useEffect(() => {
    if (user && open) {
      loadUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, open]);

  async function loadUserData() {
    if (!user) return;
    setLoading(true);

    try {
      const [ordersRes, wishlistRes, reviewsRes, chatRes] = await Promise.all([
        supabase.rpc("get_user_orders_summary", { target_user_id: user.user_id }),
        supabase.rpc("get_user_wishlist", { target_user_id: user.user_id }),
        supabase.rpc("get_user_reviews", { target_user_id: user.user_id }),
        supabase
          .from("chat_sessions")
          .select("*")
          .or(`visitor_email.eq.${user.email},visitor_name.eq.${user.username}`)
          .order("created_at", { ascending: false }),
      ]);

      if (ordersRes.data) setOrders(ordersRes.data);
      if (wishlistRes.data) setWishlist(wishlistRes.data);
      if (reviewsRes.data) setReviews(reviewsRes.data);
      if (chatRes.data) setChatSessions(chatRes.data);
    } catch (error) {
      console.error("Error loading user data:", error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleViewOrder = (orderId: number) => {
    navigate(`/admin/orders/${orderId}`);
    onClose();
  };

  if (!user) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("profile.title")}</SheetTitle>
            <SheetDescription>
              {user.email}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditDialogOpen(true)}
              >
                <Edit className="h-4 w-4 mr-1" />
                {t("actions.edit")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBlockDialogOpen(true)}
              >
                {user.is_blocked ? (
                  <>
                    <UnlockKeyhole className="h-4 w-4 mr-1" />
                    {t("actions.unblock")}
                  </>
                ) : (
                  <>
                    <Ban className="h-4 w-4 mr-1" />
                    {t("actions.block")}
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEmailDialogOpen(true)}
              >
                <Mail className="h-4 w-4 mr-1" />
                {t("actions.sendEmail")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {}}
              >
                <KeyRound className="h-4 w-4 mr-1" />
                {t("actions.resetPassword")}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {t("actions.delete")}
              </Button>
            </div>

            <Separator />

            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="info">{t("profile.tabs.info")}</TabsTrigger>
                <TabsTrigger value="orders">{t("profile.tabs.orders")}</TabsTrigger>
                <TabsTrigger value="wishlist">{t("profile.tabs.wishlist")}</TabsTrigger>
                <TabsTrigger value="reviews">{t("profile.tabs.reviews")}</TabsTrigger>
                <TabsTrigger value="tickets">{t("profile.tabs.tickets")}</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">{t("profile.info.userId")}</p>
                        <p className="font-mono text-xs">{user.user_id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t("profile.info.email")}</p>
                        <p className="text-sm">{user.email || "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t("profile.info.username")}</p>
                        <p className="text-sm">{user.username || "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t("profile.info.phone")}</p>
                        <p className="text-sm">{user.phone || "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t("profile.info.role")}</p>
                        <div className="flex gap-1 flex-wrap mt-1">
                          {user.role ? user.role.split(",").map((role) => (
                            <Badge key={role}>{t(`roles.${role.trim()}`)}</Badge>
                          )) : <Badge variant="outline">{t("roles.user")}</Badge>}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t("profile.info.status")}</p>
                        <Badge variant={user.is_blocked ? "destructive" : "default"}>
                          {user.is_blocked ? t("status.blocked") : t("status.active")}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t("profile.info.registered")}</p>
                        <p className="text-sm">{formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t("profile.info.lastLogin")}</p>
                        <p className="text-sm">
                          {user.last_login
                            ? formatDistanceToNow(new Date(user.last_login), { addSuffix: true })
                            : t("profile.info.noLastLogin")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t("profile.info.orderCount")}</p>
                        <p className="text-lg font-semibold">{user.order_count}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t("profile.info.totalSpent")}</p>
                        <p className="text-lg font-semibold">{formatCurrency(user.total_spent)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders" className="space-y-4">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t("profile.orders.noOrders")}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <Card key={order.order_id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <p className="font-medium">
                                {t("profile.orders.orderId")}{order.order_id}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                              </p>
                            </div>
                            <div className="text-right space-y-1">
                              <p className="font-semibold">{formatCurrency(order.amount)}</p>
                              <Badge>{order.status}</Badge>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="link"
                            className="mt-2 p-0 h-auto"
                            onClick={() => handleViewOrder(order.order_id)}
                          >
                            {t("profile.orders.viewOrder")}
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="wishlist" className="space-y-4">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : wishlist.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t("profile.wishlist.noItems")}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {wishlist.map((item) => (
                      <Card key={item.wishlist_id}>
                        <CardContent className="pt-6">
                          <div className="flex gap-4">
                            {item.image_urls && item.image_urls.length > 0 && (
                              <img
                                src={item.image_urls[0]}
                                alt={lang === "en" ? item.product_name_en : item.product_name_ru}
                                className="w-16 h-16 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-medium">
                                {lang === "en" ? item.product_name_en : item.product_name_ru}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {t("profile.wishlist.added")}: {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                              </p>
                              <p className="font-semibold mt-1">{formatCurrency(item.price)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="space-y-4">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t("profile.reviews.noReviews")}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((review) => (
                      <Card key={review.review_id}>
                        <CardContent className="pt-6 space-y-2">
                          <div className="flex justify-between items-start">
                            <p className="font-medium">
                              {lang === "en" ? review.product_name_en : review.product_name_ru}
                            </p>
                            <Badge>{review.status}</Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                }`}
                              />
                            ))}
                            <span className="text-sm text-muted-foreground ml-2">
                              {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-muted-foreground">{review.comment}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tickets" className="space-y-4">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : chatSessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t("profile.tickets.noTickets")}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chatSessions.map((session) => (
                      <Card key={session.id}>
                        <CardContent className="pt-6 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                {t("profile.tickets.chatId")}: {session.tawk_chat_id}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {session.visitor_name || session.visitor_email}
                              </p>
                            </div>
                            <Badge>{session.status}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>
                              {t("profile.tickets.created")}: {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                            </p>
                            <p>
                              {t("profile.tickets.updated")}: {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      <EditUserDialog
        user={user}
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSuccess={() => {
          setEditDialogOpen(false);
          onUserUpdated();
        }}
      />

      <DeleteUserDialog
        user={user}
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onSuccess={() => {
          setDeleteDialogOpen(false);
          onClose();
          onUserUpdated();
        }}
      />

      <SendEmailDialog
        users={[user]}
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
      />

      <BlockUserDialog
        user={user}
        open={blockDialogOpen}
        onClose={() => setBlockDialogOpen(false)}
        onSuccess={() => {
          setBlockDialogOpen(false);
          onUserUpdated();
        }}
      />
    </>
  );
}
