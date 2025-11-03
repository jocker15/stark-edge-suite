import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { orderManagerTranslations } from "@/lib/translations/order-manager";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface OrderFiltersType {
  search: string;
  orderStatus: string;
  paymentStatus: string;
  deliveryStatus: string;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
}

interface OrderFiltersProps {
  filters: OrderFiltersType;
  onFiltersChange: (filters: OrderFiltersType) => void;
  lang: "en" | "ru";
}

export function OrderFilters({ filters, onFiltersChange, lang }: OrderFiltersProps) {
  const t = orderManagerTranslations[lang];
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (key: keyof OrderFiltersType, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleClear = () => {
    onFiltersChange({
      search: "",
      orderStatus: "all",
      paymentStatus: "all",
      deliveryStatus: "all",
      dateFrom: "",
      dateTo: "",
      minAmount: "",
      maxAmount: "",
    });
  };

  const hasActiveFilters = 
    filters.search ||
    filters.orderStatus !== "all" ||
    filters.paymentStatus !== "all" ||
    filters.deliveryStatus !== "all" ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.minAmount ||
    filters.maxAmount;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder={t.filters.search}
              value={filters.search}
              onChange={(e) => handleChange("search", e.target.value)}
              className="max-w-md"
            />
          </div>
          
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              {isOpen ? t.filters.hideFilters : t.filters.showFilters}
              {isOpen ? (
                <ChevronUp className="h-4 w-4 ml-2" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-2" />
              )}
            </Button>
          </CollapsibleTrigger>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
            >
              <X className="h-4 w-4 mr-2" />
              {t.filters.clear}
            </Button>
          )}
        </div>

        <CollapsibleContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t.filters.orderStatus}</Label>
              <Select
                value={filters.orderStatus}
                onValueChange={(value) => handleChange("orderStatus", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.filters.all}</SelectItem>
                  <SelectItem value="pending">{t.status.pending}</SelectItem>
                  <SelectItem value="completed">{t.status.completed}</SelectItem>
                  <SelectItem value="paid">{t.status.paid}</SelectItem>
                  <SelectItem value="failed">{t.status.failed}</SelectItem>
                  <SelectItem value="cancelled">{t.status.cancelled}</SelectItem>
                  <SelectItem value="refunded">{t.status.refunded}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t.filters.paymentStatus}</Label>
              <Select
                value={filters.paymentStatus}
                onValueChange={(value) => handleChange("paymentStatus", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.filters.all}</SelectItem>
                  <SelectItem value="paid">{t.status.paid}</SelectItem>
                  <SelectItem value="pending">{t.status.pending}</SelectItem>
                  <SelectItem value="failed">{t.status.failed}</SelectItem>
                  <SelectItem value="refunded">{t.status.refunded}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t.filters.deliveryStatus}</Label>
              <Select
                value={filters.deliveryStatus}
                onValueChange={(value) => handleChange("deliveryStatus", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.filters.all}</SelectItem>
                  <SelectItem value="pending">{t.deliveryStatus.pending}</SelectItem>
                  <SelectItem value="processing">{t.deliveryStatus.processing}</SelectItem>
                  <SelectItem value="delivered">{t.deliveryStatus.delivered}</SelectItem>
                  <SelectItem value="failed">{t.deliveryStatus.failed}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.filters.dateRange}</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  placeholder={t.filters.from}
                  value={filters.dateFrom}
                  onChange={(e) => handleChange("dateFrom", e.target.value)}
                />
                <Input
                  type="date"
                  placeholder={t.filters.to}
                  value={filters.dateTo}
                  onChange={(e) => handleChange("dateTo", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.filters.amountRange}</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder={t.filters.min}
                  value={filters.minAmount}
                  onChange={(e) => handleChange("minAmount", e.target.value)}
                  min="0"
                  step="0.01"
                />
                <Input
                  type="number"
                  placeholder={t.filters.max}
                  value={filters.maxAmount}
                  onChange={(e) => handleChange("maxAmount", e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
