import { useState, useMemo, useCallback } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  useReactTable,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, ChevronDown, ChevronUp, ChevronsUpDown, Settings2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { getUserManagerTranslation } from "@/lib/translations/user-manager";

export interface UserStats {
  user_id: string;
  profile_id: number;
  email: string | null;
  username: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  is_blocked: boolean | null;
  created_at: string;
  order_count: number;
  total_spent: number;
  last_login: string | null;
}

interface UsersDataTableProps {
  users: UserStats[];
  loading: boolean;
  onViewProfile: (user: UserStats) => void;
  onBulkAction: (action: string, userIds: string[]) => void;
}

export function UsersDataTable({ 
  users, 
  loading, 
  onViewProfile, 
  onBulkAction 
}: UsersDataTableProps) {
  const { lang } = useLanguage();
  const t = useCallback((key: string) => getUserManagerTranslation(lang, key), [lang]);
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusBadgeVariant = (isBlocked: boolean | null) => {
    return isBlocked ? "destructive" : "default";
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "default";
      case "moderator":
        return "secondary";
      default:
        return "outline";
    }
  };

  const columns: ColumnDef<UserStats>[] = useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "profile_id",
      header: t("columns.id"),
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.profile_id}</span>
      ),
    },
    {
      accessorKey: "email",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("columns.email")}
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="ml-2 h-4 w-4" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate">{row.original.email || "—"}</div>
      ),
    },
    {
      accessorKey: "username",
      header: t("columns.name"),
      cell: ({ row }) => (
        <div className="max-w-[150px] truncate">{row.original.username || "—"}</div>
      ),
    },
    {
      accessorKey: "role",
      header: t("columns.role"),
      cell: ({ row }) => {
        const roles = row.original.role ? row.original.role.split(",") : [];
        return (
          <div className="flex gap-1 flex-wrap">
            {roles.length === 0 && (
              <Badge variant="outline">{t("roles.user")}</Badge>
            )}
            {roles.map((role) => (
              <Badge key={role} variant={getRoleBadgeVariant(role.trim())}>
                {t(`roles.${role.trim()}`)}
              </Badge>
            ))}
          </div>
        );
      },
      filterFn: (row, id, value) => {
        if (value === "all") return true;
        const roles = row.original.role ? row.original.role.split(",") : [];
        return roles.some(r => r.trim() === value);
      },
    },
    {
      accessorKey: "is_blocked",
      header: t("columns.status"),
      cell: ({ row }) => (
        <Badge variant={getStatusBadgeVariant(row.original.is_blocked)}>
          {row.original.is_blocked ? t("status.blocked") : t("status.active")}
        </Badge>
      ),
      filterFn: (row, id, value) => {
        if (value === "all") return true;
        return value === "blocked" ? row.original.is_blocked : !row.original.is_blocked;
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("columns.registered")}
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="ml-2 h-4 w-4" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.original.created_at;
        return date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : "—";
      },
    },
    {
      accessorKey: "order_count",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("columns.orderCount")}
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="ml-2 h-4 w-4" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => (
        <span className="font-medium">{row.original.order_count}</span>
      ),
    },
    {
      accessorKey: "total_spent",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("columns.totalSpent")}
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="ml-2 h-4 w-4" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => (
        <span className="font-medium">{formatCurrency(row.original.total_spent)}</span>
      ),
    },
    {
      accessorKey: "last_login",
      header: t("columns.lastLogin"),
      cell: ({ row }) => {
        const lastLogin = row.original.last_login;
        return lastLogin ? formatDistanceToNow(new Date(lastLogin), { addSuffix: true }) : t("profile.info.noLastLogin");
      },
    },
    {
      id: "actions",
      header: t("columns.actions"),
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewProfile(row.original)}
        >
          <Eye className="h-4 w-4 mr-1" />
          {t("actions.viewProfile")}
        </Button>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ], [t, onViewProfile]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "blocked" ? user.is_blocked : !user.is_blocked);
      const matchesRole = roleFilter === "all" || 
        (user.role && user.role.split(",").some(r => r.trim() === roleFilter));
      
      let matchesDate = true;
      if (dateFrom || dateTo) {
        const userDate = new Date(user.created_at);
        if (dateFrom) {
          matchesDate = matchesDate && userDate >= new Date(dateFrom);
        }
        if (dateTo) {
          matchesDate = matchesDate && userDate <= new Date(dateTo);
        }
      }
      
      return matchesStatus && matchesRole && matchesDate;
    });
  }, [users, statusFilter, roleFilter, dateFrom, dateTo]);

  const table = useReactTable({
    data: filteredUsers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedUserIds = selectedRows.map((row) => row.original.user_id);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder={t("filters.search")}
            value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("email")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("filters.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.all")}</SelectItem>
              <SelectItem value="active">{t("status.active")}</SelectItem>
              <SelectItem value="blocked">{t("status.blocked")}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("filters.role")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.all")}</SelectItem>
              <SelectItem value="admin">{t("roles.admin")}</SelectItem>
              <SelectItem value="moderator">{t("roles.moderator")}</SelectItem>
              <SelectItem value="user">{t("roles.user")}</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                <Settings2 className="mr-2 h-4 w-4" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">{t("filters.dateRange")}:</span>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-[180px]"
            placeholder={t("filters.from")}
          />
          <span className="text-sm text-muted-foreground">{t("filters.to")}</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-[180px]"
            placeholder={t("filters.to")}
          />
          {(dateFrom || dateTo) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
            >
              {t("filters.clear")}
            </Button>
          )}
        </div>
      </div>

      {selectedUserIds.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedUserIds.length} {t("bulkActions.selected")}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkAction("block", selectedUserIds)}
            >
              {t("bulkActions.block")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkAction("unblock", selectedUserIds)}
            >
              {t("bulkActions.unblock")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkAction("export", selectedUserIds)}
            >
              {t("bulkActions.export")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkAction("email", selectedUserIds)}
            >
              {t("bulkActions.sendEmail")}
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {t("empty.noUsers")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <div className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
