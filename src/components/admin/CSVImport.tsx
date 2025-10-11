import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { X, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CSVImportProps {
  onClose: () => void;
}

export function CSVImport({ onClose }: CSVImportProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  async function handleImport() {
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      const rows = text.split("\n").slice(1); // Skip header
      const products = [];

      for (const row of rows) {
        if (!row.trim()) continue;

        // Support two formats:
        // 1. Old format: name_en, name_ru, description_en, description_ru, price, stock, category, document_type, country
        // 2. New format: №, Country, State, type of document, file name, Price, link
        const values = row.split(",").map((s) => s.trim().replace(/^"|"$/g, ''));
        
        // Detect format by checking if second column looks like a country
        if (values.length >= 7 && values[1]) {
          // New format from Excel
          const country = values[1];
          const document_type = values[3];
          const file_name = values[4];
          const price = parseFloat(values[5]) || 25;
          const link = values[6];

          products.push({
            name_en: file_name,
            name_ru: file_name,
            description_en: `${country} ${document_type} - Digital Template`,
            description_ru: `${country} ${document_type} - Цифровой шаблон`,
            price: price,
            stock: 1000,
            category: 'Digital Template',
            document_type: document_type || null,
            country: country || null,
            preview_link: link || null,
          });
        } else if (values.length >= 9) {
          // Old format
          const [name_en, name_ru, description_en, description_ru, price, stock, category, document_type, country] = values;
          products.push({
            name_en,
            name_ru,
            description_en,
            description_ru,
            price: parseFloat(price),
            stock: parseInt(stock),
            category,
            document_type: document_type || null,
            country: country || null,
          });
        }
      }

      if (products.length === 0) {
        throw new Error("Не удалось распознать формат файла");
      }

      const { error } = await supabase.from("products").insert(products);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: `Импортировано товаров: ${products.length}`,
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось импортировать CSV",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Импорт из CSV</CardTitle>
            <CardDescription className="mt-2">
              Поддерживает два формата:<br/>
              1. №, Country, State, type of document, file name, Price, link<br/>
              2. name_en, name_ru, description_en, description_ru, price, stock, category, document_type, country
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button onClick={handleImport} disabled={!file || loading}>
              <Upload className="mr-2 h-4 w-4" />
              {loading ? "Импорт..." : "Импортировать"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
