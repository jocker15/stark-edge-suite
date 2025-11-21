import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { securityCenterTranslations } from "@/lib/translations/security-center";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, RefreshCw, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface LoginEvent {
  id: string;
  user_id: string;
  user_email: string;
  user_username: string;
  ip_address: string;
  user_agent: string;
  status: string;
  failure_reason: string;
  created_at: string;
  total_count: number;
}

export function LoginActivityTable() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const t = securityCenterTranslations[language];
  
  const [events, setEvents] = useState<LoginEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(50);
  
  const [filters, setFilters] = useState({
    status: "",
    dateFrom: "",
    dateTo: "",
    search: ""
  });

  const fetchLoginEvents = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc("get_login_events", {
        p_status: filters.status || null,
        p_date_from: filters.dateFrom || null,
        p_date_to: filters.dateTo || null,
        p_limit: pageSize,
        p_offset: page * pageSize
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setEvents(data);
        setTotalCount(data[0].total_count || 0);
      } else {
        setEvents([]);
        setTotalCount(0);
      }
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
  }, [page, filters]);

  const handleExportCSV = async () => {
    const csvData = events.map(event => ({
      Email: event.user_email || event.user_username,
      "IP Address": event.ip_address,
      Status: event.status,
      "Failure Reason": event.failure_reason || "",
      Time: format(new Date(event.created_at), "yyyy-MM-dd HH:mm:ss"),
      "User Agent": event.user_agent
    }));

    const Papa = (await import("papaparse")).default;
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `login-activity-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: t.common.success,
      description: "Login activity exported successfully"
    });
  };

  const handleResetFilters = () => {
    setFilters({
      status: "",
      dateFrom: "",
      dateTo: "",
      search: ""
    });
    setPage(0);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary"> = {
      success: "default",
      failed: "destructive",
      blocked: "secondary"
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t.loginActivity.title}</CardTitle>
            <CardDescription>{t.loginActivity.description}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchLoginEvents} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t.common.refresh}
            </Button>
            <Button onClick={handleExportCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              {t.loginActivity.export}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder={t.loginActivity.filters.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t.loginActivity.status.all}</SelectItem>
                <SelectItem value="success">{t.loginActivity.status.success}</SelectItem>
                <SelectItem value="failed">{t.loginActivity.status.failed}</SelectItem>
                <SelectItem value="blocked">{t.loginActivity.status.blocked}</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder={t.loginActivity.filters.from}
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />

            <Input
              type="date"
              placeholder={t.loginActivity.filters.to}
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />

            <Button onClick={handleResetFilters} variant="outline">
              <X className="h-4 w-4 mr-2" />
              {t.loginActivity.filters.reset}
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.loginActivity.table.email}</TableHead>
                  <TableHead>{t.loginActivity.table.ipAddress}</TableHead>
                  <TableHead>{t.loginActivity.table.status}</TableHead>
                  <TableHead>{t.loginActivity.table.reason}</TableHead>
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
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    </TableRow>
                  ))
                ) : events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {t.loginActivity.table.noData}
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">
                        {event.user_email || event.user_username || "-"}
                      </TableCell>
                      <TableCell>{event.ip_address || "-"}</TableCell>
                      <TableCell>{getStatusBadge(event.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {event.failure_reason || "-"}
                      </TableCell>
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
