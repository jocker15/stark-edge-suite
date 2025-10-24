import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { X, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Papa from 'papaparse';

interface CSVImportProps {
  onClose: () => void;
}

export function CSVImport({ onClose }: CSVImportProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>("Digital Template");
  const { toast } = useToast();

  async function handleImport() {
    if (!file) return;

    // Validate file extension
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Неверный формат",
        description: "Пожалуйста, загрузите CSV файл. Если у вас Excel файл, сохраните его как CSV UTF-8.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const text = await file.text();
      
      // Parse CSV using PapaParse with auto-detection of delimiter
      const parseResult = Papa.parse<any>(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        delimiter: "", // Auto-detect comma or semicolon
        transformHeader: (header: string) => header.trim(),
      });

      if (parseResult.errors && parseResult.errors.length > 0) {
        console.error("CSV parsing errors:", parseResult.errors);
        const criticalErrors = parseResult.errors.filter((e: any) => e.type === 'Quotes' || e.type === 'FieldMismatch');
        if (criticalErrors.length > 0) {
          throw new Error(`Критическая ошибка парсинга CSV: ${criticalErrors[0].message}`);
        }
      }

      const rows = parseResult.data as any[];
      const products = [];
      let skippedRows = 0;

      for (let i = 0; i < rows.length; i++) {
        const row: any = rows[i];
        
        // Skip empty rows
        if (!row || Object.keys(row).filter(k => row[k]).length === 0) {
          continue;
        }

        // Handle format: № п/п;Country;State;type of document;file name;Price;link
        const country = row['Country'] || row['country'] || "";
        const document_type = row['type of document'] || row['document_type'] || "";
        const file_name = row['file name'] || row['file_name'] || "";
        const price = parseFloat(row['Price'] || row['price']) || 25;
        const link = row['link'] || "";

        // Validate required fields
        if (!file_name || !country || !document_type) {
          console.warn(`Строка ${i + 2}: пропущена (отсутствуют обязательные поля)`, row);
          skippedRows++;
          continue;
        }

        products.push({
          name_en: file_name,
          name_ru: file_name,
          description_en: `${country} ${document_type}`,
          description_ru: `${country} ${document_type}`,
          price: price,
          stock: 1000,
          category: category,
          document_type: document_type || null,
          country: country || null,
          preview_link: link || null,
        });
      }

      if (products.length === 0) {
        throw new Error("Не удалось импортировать ни одного товара. Проверьте формат файла.");
      }

      // Insert products in batches to avoid timeout
      const batchSize = 100;
      let totalInserted = 0;
      
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        const { error } = await supabase.from("products").insert(batch);
        if (error) throw error;
        totalInserted += batch.length;
      }

      let message = `Импортировано товаров: ${totalInserted}`;
      if (skippedRows > 0) {
        message += ` (пропущено строк: ${skippedRows})`;
      }

      toast({
        title: "Успешно",
        description: message,
      });
      onClose();
    } catch (error: any) {
      console.error("Import error:", error);
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
              Загрузите CSV файл в формате UTF-8.<br/>
              <strong>Важно:</strong> Если у вас Excel файл (.xlsx), сначала сохраните его как CSV:<br/>
              File → Save As → CSV UTF-8 (Comma delimited)<br/><br/>
              Поддерживаемые форматы данных:<br/>
              1. №, Country, State, type of document, file name, Price, link<br/>
              2. name_en, name_ru, description_en, description_ru, price, stock, category, document_type, country
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Категория</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Digital Template">Цифровые шаблоны</SelectItem>
                <SelectItem value="Game Account">Игровые аккаунты</SelectItem>
                <SelectItem value="Verification">Верификация</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">CSV файл</Label>
            <Input
              id="file"
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
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
