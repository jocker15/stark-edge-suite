import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Star, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Review {
  id: string;
  user_id: string;
  product_id: number;
  rating: number;
  comment: string | null;
  status: string;
  created_at: string;
  profiles: {
    username: string | null;
    email: string | null;
  } | null;
  products: {
    name_ru: string | null;
  } | null;
}

export function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");
  const { toast } = useToast();

  useEffect(() => {
    loadReviews();
  }, [filter]);

  async function loadReviews() {
    setLoading(true);
    let query = supabase
      .from("reviews")
      .select(`
        *,
        profiles(username, email),
        products(name_ru)
      `)
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить отзывы",
        variant: "destructive",
      });
    } else {
      setReviews(data as any || []);
    }
    setLoading(false);
  }

  async function updateReviewStatus(id: string, status: string) {
    const { error } = await supabase
      .from("reviews")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус отзыва",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Успешно",
        description: `Отзыв ${status === "approved" ? "одобрен" : "отклонен"}`,
      });
      loadReviews();
    }
  }

  async function deleteReview(id: string) {
    if (!confirm("Вы уверены, что хотите удалить этот отзыв?")) return;

    const { error } = await supabase.from("reviews").delete().eq("id", id);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить отзыв",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Успешно",
        description: "Отзыв удален",
      });
      loadReviews();
    }
  }

  function getStatusBadge(status: string) {
    const variants: { [key: string]: "default" | "secondary" | "destructive" } = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Модерация отзывов</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={filter} onValueChange={setFilter} className="mb-4">
          <TabsList>
            <TabsTrigger value="pending">Новые</TabsTrigger>
            <TabsTrigger value="approved">Одобренные</TabsTrigger>
            <TabsTrigger value="rejected">Отклоненные</TabsTrigger>
            <TabsTrigger value="all">Все</TabsTrigger>
          </TabsList>
        </Tabs>

        {reviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Отзывов не найдено
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Товар</TableHead>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Рейтинг</TableHead>
                  <TableHead>Комментарий</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>{review.products?.name_ru || "—"}</TableCell>
                    <TableCell>
                      {review.profiles?.username || review.profiles?.email || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {review.rating}
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {review.comment || "—"}
                    </TableCell>
                    <TableCell>{getStatusBadge(review.status)}</TableCell>
                    <TableCell>
                      {new Date(review.created_at).toLocaleDateString("ru-RU")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {review.status !== "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateReviewStatus(review.id, "approved")}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {review.status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateReviewStatus(review.id, "rejected")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteReview(review.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
