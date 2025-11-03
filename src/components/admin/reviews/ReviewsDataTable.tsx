import { useState, useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  VisibilityState,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  MoreHorizontal, 
  Check, 
  X, 
  MessageSquare, 
  Eye, 
  Trash2, 
  Mail, 
  MailOpen,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getReviewsManagerTranslation } from "@/lib/translations/reviews-manager";
import { format } from "date-fns";

export interface ReviewData {
  id: string;
  product_id: number;
  user_id: string;
  rating: number;
  comment: string | null;
  status: string;
  reply_text: string | null;
  reply_at: string | null;
  moderated_by: string | null;
  is_unread: boolean;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  product_name_en: string | null;
  product_name_ru: string | null;
  user_email: string | null;
  user_username: string | null;
  moderator_email: string | null;
}

interface ReviewsDataTableProps {
  reviews: ReviewData[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onViewDetails: (review: ReviewData) => void;
  onApprove: (review: ReviewData) => void;
  onReject: (review: ReviewData) => void;
  onReply: (review: ReviewData) => void;
  onDelete: (review: ReviewData) => void;
  onToggleUnread: (review: ReviewData) => void;
  onBulkAction: (action: string, reviewIds: string[]) => void;
  filters: {
    search: string;
    status: string;
    minRating: number | null;
    maxRating: number | null;
  };
  onFiltersChange: (filters: {
    search: string;
    status: string;
    minRating: number | null;
    maxRating: number | null;
  }) => void;
}

export function ReviewsDataTable({
  reviews,
  loading,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onViewDetails,
  onApprove,
  onReject,
  onReply,
  onDelete,
  onToggleUnread,
  onBulkAction,
  filters,
  onFiltersChange,
}: ReviewsDataTableProps) {
  const { lang } = useLanguage();
  const t = (key: string) => getReviewsManagerTranslation(lang, key);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const columns: ColumnDef<ReviewData>[] = useMemo(
    () => [
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
        accessorKey: "product_name",
        header: t("columns.product"),
        cell: ({ row }) => {
          const productName = lang === "en" 
            ? row.original.product_name_en || row.original.product_name_ru 
            : row.original.product_name_ru || row.original.product_name_en;
          return (
            <div className="max-w-[200px] truncate" title={productName || undefined}>
              {productName || "—"}
            </div>
          );
        },
      },
      {
        accessorKey: "user",
        header: t("columns.user"),
        cell: ({ row }) => {
          const userName = row.original.user_username || row.original.user_email || "—";
          return (
            <div className="max-w-[150px] truncate" title={userName}>
              {userName}
            </div>
          );
        },
      },
      {
        accessorKey: "rating",
        header: t("columns.rating"),
        cell: ({ row }) => {
          const rating = row.getValue("rating") as number;
          return (
            <div className="flex items-center gap-1">
              <span>{rating}</span>
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
          );
        },
      },
      {
        accessorKey: "comment",
        header: t("columns.comment"),
        cell: ({ row }) => {
          const comment = row.getValue("comment") as string | null;
          return (
            <div className="max-w-[300px] truncate" title={comment || undefined}>
              {comment || t("drawer.noComment")}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: t("columns.status"),
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          const isUnread = row.original.is_unread;
          const hasReply = !!row.original.reply_text;
          
          let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
          if (status === "approved") variant = "default";
          if (status === "rejected") variant = "destructive";
          
          return (
            <div className="flex items-center gap-2">
              <Badge variant={variant}>{t(`status.${status}`)}</Badge>
              {isUnread && <Badge variant="outline" className="text-xs">{t("drawer.unreadBadge")}</Badge>}
              {hasReply && <MessageSquare className="h-4 w-4 text-muted-foreground" />}
            </div>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: t("columns.date"),
        cell: ({ row }) => {
          const date = row.getValue("created_at") as string;
          return format(new Date(date), "MMM dd, yyyy HH:mm");
        },
      },
      {
        id: "actions",
        header: t("columns.actions"),
        cell: ({ row }) => {
          const review = row.original;
          return (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onViewDetails(review)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {review.status !== "approved" && (
                    <DropdownMenuItem onClick={() => onApprove(review)}>
                      <Check className="h-4 w-4 mr-2" />
                      {t("actions.approve")}
                    </DropdownMenuItem>
                  )}
                  {review.status !== "rejected" && (
                    <DropdownMenuItem onClick={() => onReject(review)}>
                      <X className="h-4 w-4 mr-2" />
                      {t("actions.reject")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => onReply(review)}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {t("actions.reply")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onToggleUnread(review)}>
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
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(review)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("actions.delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang, onViewDetails, onApprove, onReject, onReply, onDelete, onToggleUnread]
  );

  const table = useReactTable({
    data: reviews,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedReviewIds = selectedRows.map((row) => row.original.id);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder={t("filters.search")}
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="max-w-sm"
          />
          
          <Select
            value={filters.status}
            onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("filters.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("status.all")}</SelectItem>
              <SelectItem value="pending">{t("status.pending")}</SelectItem>
              <SelectItem value="approved">{t("status.approved")}</SelectItem>
              <SelectItem value="rejected">{t("status.rejected")}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.minRating?.toString() || "all"}
            onValueChange={(value) =>
              onFiltersChange({ 
                ...filters, 
                minRating: value === "all" ? null : parseInt(value) 
              })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("filters.minRating")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.rating")}</SelectItem>
              <SelectItem value="1">1+ ⭐</SelectItem>
              <SelectItem value="2">2+ ⭐</SelectItem>
              <SelectItem value="3">3+ ⭐</SelectItem>
              <SelectItem value="4">4+ ⭐</SelectItem>
              <SelectItem value="5">5 ⭐</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Columns3 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {selectedReviewIds.length > 0 && (
          <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50">
            <span className="text-sm text-muted-foreground">
              {selectedReviewIds.length} {t("bulkActions.selected")}
            </span>
            <div className="flex gap-2 ml-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onBulkAction("approve", selectedReviewIds)}
              >
                <Check className="h-4 w-4 mr-1" />
                {t("bulkActions.approve")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onBulkAction("reject", selectedReviewIds)}
              >
                <X className="h-4 w-4 mr-1" />
                {t("bulkActions.reject")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onBulkAction("markRead", selectedReviewIds)}
              >
                <MailOpen className="h-4 w-4 mr-1" />
                {t("bulkActions.markRead")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onBulkAction("export", selectedReviewIds)}
              >
                <Download className="h-4 w-4 mr-1" />
                {t("bulkActions.export")}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onBulkAction("delete", selectedReviewIds)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {t("bulkActions.delete")}
              </Button>
            </div>
          </div>
        )}
      </div>

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
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t("table.loading")}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t("table.noReviews")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {t("table.showing")} {Math.min((currentPage - 1) * pageSize + 1, totalCount)} {t("table.to")}{" "}
          {Math.min(currentPage * pageSize, totalCount)} {t("table.of")} {totalCount} {t("table.results")}
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(parseInt(value))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / {t("table.page")}</SelectItem>
              <SelectItem value="25">25 / {t("table.page")}</SelectItem>
              <SelectItem value="50">50 / {t("table.page")}</SelectItem>
              <SelectItem value="100">100 / {t("table.page")}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            {t("table.page")} {currentPage} {t("table.of")} {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
