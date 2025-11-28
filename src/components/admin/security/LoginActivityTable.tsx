import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { securityCenterTranslations } from "@/lib/translations/security-center";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface LoginEvent {
  id: string;
  user_id: string | null;
  action_type: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  details: unknown;
}

export function LoginActivityTable() {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const t = securityCenterTranslations[lang];
  
  const [events, setEvents] = useState<LoginEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(50);

  const fetchLoginEvents = async () => {
    try {
      setLoading(true);
      
      // Query audit_logs for login-related events since there's no dedicated login_events table
      const { data, error, count } = await supabase
        .from("audit_logs")
        .select("*", { count: "exact" })
        .in("action_type", ["login", "logout", "login_failed", "session_started"])
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;

      setEvents(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error fetching login events:", error);
      toast({
        title: t.common.error,
        description: error instanceof Error ? error.message : "Failed to fetch login events",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoginEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const getStatusBadge = (actionType: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary"> = {
      login: "default",
      session_started: "default",
      login_failed: "destructive",
      logout: "secondary"
    };
    return <Badge variant={variants[actionType] || "default"}>{actionType}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t.loginActivity.title}</CardTitle>
            <CardDescription>{t.loginActivity.description}</CardDescription>
          </div>
          <Button onClick={fetchLoginEvents} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t.common.refresh}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.loginActivity.table.email}</TableHead>
                  <TableHead>{t.loginActivity.table.ipAddress}</TableHead>
                  <TableHead>{t.loginActivity.table.status}</TableHead>
                  <TableHead>{t.loginActivity.table.time}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    </TableRow>
                  ))
                ) : events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {t.loginActivity.table.noData}
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">
                        {event.user_id?.slice(0, 8) || "-"}
                      </TableCell>
                      <TableCell>{event.ip_address || "-"}</TableCell>
                      <TableCell>{getStatusBadge(event.action_type)}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(event.created_at), "MMM dd, yyyy HH:mm:ss")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {!loading && totalCount > pageSize && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalCount)} of {totalCount} events
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setPage(page + 1)}
                  disabled={(page + 1) * pageSize >= totalCount}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
