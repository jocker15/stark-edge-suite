import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { securityCenterTranslations } from "@/lib/translations/security-center";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, RefreshCw, Eye, X } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";

interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  user_username: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown>;
  ip_address: string;
  user_agent: string;
  created_at: string;
  total_count: number;
}

export function AuditLogsTable() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const t = securityCenterTranslations[language];
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(50);
  
  const [filters, setFilters] = useState({
    entityType: "",
    actionType: "",
    dateFrom: "",
    dateTo: "",
    search: ""
  });

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc("get_audit_logs", {
        p_entity_type: filters.entityType || null,
        p_action_type: filters.actionType || null,
        p_date_from: filters.dateFrom || null,
        p_date_to: filters.dateTo || null,
        p_search: filters.search || null,
        p_limit: pageSize,
        p_offset: page * pageSize
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setLogs(data);
        setTotalCount(data[0].total_count || 0);
      } else {
        setLogs([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast({
        title: t.common.error,
        description: error instanceof Error ? error.message : "Failed to fetch audit logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  const handleExportCSV = () => {
    const csvData = logs.map(log => ({
      User: log.user_email || log.user_username,
      Action: log.action_type,
      Entity: log.entity_type,
      "Entity ID": log.entity_id,
      "IP Address": log.ip_address || "",
      Time: format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss")
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: t.common.success,
      description: "Audit logs exported successfully"
    });
  };

  const handleResetFilters = () => {
    setFilters({
      entityType: "",
      actionType: "",
      dateFrom: "",
      dateTo: "",
      search: ""
    });
    setPage(0);
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t.auditLogs.title}</CardTitle>
              <CardDescription>{t.auditLogs.description}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchAuditLogs} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                {t.common.refresh}
              </Button>
              <Button onClick={handleExportCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                {t.auditLogs.export}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Select value={filters.entityType} onValueChange={(value) => setFilters({ ...filters, entityType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={t.auditLogs.filters.entityType} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t.auditLogs.entityTypes.all}</SelectItem>
                  <SelectItem value="product">{t.auditLogs.entityTypes.product}</SelectItem>
                  <SelectItem value="order">{t.auditLogs.entityTypes.order}</SelectItem>
                  <SelectItem value="user">{t.auditLogs.entityTypes.user}</SelectItem>
                  <SelectItem value="profile">{t.auditLogs.entityTypes.profile}</SelectItem>
                  <SelectItem value="user_roles">{t.auditLogs.entityTypes.user_role}</SelectItem>
                  <SelectItem value="review">{t.auditLogs.entityTypes.review}</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                placeholder={t.auditLogs.filters.dateRange}
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />

              <Input
                type="date"
                placeholder={t.auditLogs.filters.dateRange}
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />

              <Input
                placeholder={t.auditLogs.filters.search}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />

              <Button onClick={handleResetFilters} variant="outline">
                <X className="h-4 w-4 mr-2" />
                {t.auditLogs.filters.reset}
              </Button>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.auditLogs.table.user}</TableHead>
                    <TableHead>{t.auditLogs.table.action}</TableHead>
                    <TableHead>{t.auditLogs.table.entity}</TableHead>
                    <TableHead>{t.auditLogs.table.entityId}</TableHead>
                    <TableHead>{t.auditLogs.table.ipAddress}</TableHead>
                    <TableHead>{t.auditLogs.table.time}</TableHead>
                    <TableHead className="text-right">{t.common.view}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      </TableRow>
                    ))
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {t.auditLogs.table.noData}
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {log.user_email || log.user_username || "-"}
                        </TableCell>
                        <TableCell className="text-sm">{log.action_type}</TableCell>
                        <TableCell className="text-sm">{log.entity_type}</TableCell>
                        <TableCell className="text-sm font-mono">{log.entity_id}</TableCell>
                        <TableCell className="text-sm">{log.ip_address || "-"}</TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(log.created_at), "MMM dd, yyyy HH:mm:ss")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            onClick={() => handleViewDetails(log)}
                            variant="ghost"
                            size="sm"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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
                  Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalCount)} of {totalCount} logs
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

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.auditLogs.detailsDialog.title}</DialogTitle>
            <DialogDescription>
              {selectedLog && format(new Date(selectedLog.created_at), "MMMM dd, yyyy 'at' HH:mm:ss")}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">{t.auditLogs.detailsDialog.user}</div>
                  <div className="text-sm">{selectedLog.user_email || selectedLog.user_username || "-"}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">{t.auditLogs.detailsDialog.action}</div>
                  <div className="text-sm">{selectedLog.action_type}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">{t.auditLogs.detailsDialog.entity}</div>
                  <div className="text-sm">{selectedLog.entity_type}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">{t.auditLogs.detailsDialog.entityId}</div>
                  <div className="text-sm font-mono">{selectedLog.entity_id}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">{t.auditLogs.detailsDialog.ipAddress}</div>
                  <div className="text-sm">{selectedLog.ip_address || "-"}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">{t.auditLogs.detailsDialog.userAgent}</div>
                  <div className="text-sm truncate">{selectedLog.user_agent || "-"}</div>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">{t.auditLogs.detailsDialog.changes}</div>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
