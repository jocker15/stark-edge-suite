import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { orderManagerTranslations } from "@/lib/translations/order-manager";

export interface OrderRow {
  id: number;
  user_id: string | null;
  amount: number | null;
  status: string;
  delivery_status: string | null;
  order_details: Record<string, unknown> | null;
  payment_details: Record<string, unknown> | null;
  created_at: string;
  updated_at: string | null;
  customer_email: string | null;
  customer_username: string | null;
  payment_status: string | null;
  invoice_id: string | null;
  total_count: number;
}

export function getColumns(
  lang: "en" | "ru",
  onViewDetails: (order: OrderRow) => void
): ColumnDef<OrderRow>[] {
  const t = orderManagerTranslations[lang];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      completed: "default",
      paid: "default",
      failed: "destructive",
      cancelled: "destructive",
      refunded: "secondary",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {t.status[status as keyof typeof t.status] || status}
      </Badge>
    );
  };

  const getDeliveryBadge = (status: string | null) => {
    if (!status) return <span className="text-muted-foreground">—</span>;
    
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      processing: "secondary",
      delivered: "default",
      failed: "destructive",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {t.deliveryStatus[status as keyof typeof t.deliveryStatus] || status}
      </Badge>
    );
  };

  return [
    {
      accessorKey: "id",
      header: t.columns.id,
      cell: ({ row }) => (
        <span className="font-mono text-sm">#{row.getValue("id")}</span>
      ),
    },
    {
      accessorKey: "created_at",
      header: t.columns.date,
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return (
          <div className="flex flex-col">
            <span className="text-sm">
              {date.toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span className="text-xs text-muted-foreground">
              {date.toLocaleTimeString(lang === "ru" ? "ru-RU" : "en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "customer_email",
      header: t.columns.email,
      cell: ({ row }) => {
        const email = row.getValue("customer_email") as string | null;
        const username = row.original.customer_username;
        
        return (
          <div className="flex flex-col">
            <span className="text-sm">
              {email || <span className="text-muted-foreground">—</span>}
            </span>
            {username && (
              <span className="text-xs text-muted-foreground">{username}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: t.columns.amount,
      cell: ({ row }) => {
        const amount = row.getValue("amount") as number | null;
        return (
          <span className="font-semibold">
            ${amount?.toFixed(2) || "0.00"}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: t.columns.orderStatus,
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      accessorKey: "payment_status",
      header: t.columns.paymentStatus,
      cell: ({ row }) => {
        const status = row.getValue("payment_status") as string | null;
        return status ? (
          getStatusBadge(status)
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "delivery_status",
      header: t.columns.deliveryStatus,
      cell: ({ row }) => getDeliveryBadge(row.getValue("delivery_status")),
    },
    {
      id: "actions",
      header: t.columns.actions,
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onViewDetails(row.original)}
        >
          <Eye className="h-4 w-4 mr-1" />
          {t.actions.viewDetails}
        </Button>
      ),
    },
  ];
}
