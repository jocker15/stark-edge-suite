import { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  PaginationState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { orderManagerTranslations } from "@/lib/translations/order-manager";

interface OrdersDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalCount: number;
  pagination: PaginationState;
  onPaginationChange: (pagination: PaginationState) => void;
  lang: "en" | "ru";
  loading?: boolean;
}

export function OrdersDataTable<TData, TValue>({
  columns,
  data,
  totalCount,
  pagination,
  onPaginationChange,
  lang,
  loading,
}: OrdersDataTableProps<TData, TValue>) {
  const t = orderManagerTranslations[lang];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    state: {
      pagination,
    },
    onPaginationChange,
  });

  const pageCount = table.getPageCount();
  const currentPage = pagination.pageIndex + 1;

  return (
    <div className="space-y-4">
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
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {t.loading}
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
                  {t.noOrders}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pageCount > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {lang === "ru" 
              ? `Показаны ${(currentPage - 1) * pagination.pageSize + 1}-${Math.min(currentPage * pagination.pageSize, totalCount)} из ${totalCount}`
              : `Showing ${(currentPage - 1) * pagination.pageSize + 1}-${Math.min(currentPage * pagination.pageSize, totalCount)} of ${totalCount}`
            }
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onPaginationChange({
                  ...pagination,
                  pageIndex: pagination.pageIndex - 1,
                })
              }
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm">
              {lang === "ru" 
                ? `Страница ${currentPage} из ${pageCount}`
                : `Page ${currentPage} of ${pageCount}`
              }
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onPaginationChange({
                  ...pagination,
                  pageIndex: pagination.pageIndex + 1,
                })
              }
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
