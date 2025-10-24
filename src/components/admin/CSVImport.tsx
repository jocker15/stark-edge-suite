
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

  // Функция определения формата CSV по заголовкам
  function detectFormat(headers: string[]): 'format1' | 'format2' | 'unknown' {
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
    
    // Формат 1: Country, type of document, file name
    const hasFormat1 = 
      normalizedHeaders.some(h => h === 'country') &&
      (normalizedHeaders.some(h => h === 'type of document') || normalizedHeaders.some(h => h === 'document_type')) &&
      (normalizedHeaders.some(h => h === 'file name') || normalizedHeaders.some(h => h === 'file_name'));
    
    // Формат 2: name_en, description_en, category
    const hasFormat2 = 
      normalizedHeaders.includes('name_en') && 
      normalizedHeaders.includes('description_en') && 
      normalizedHeaders.includes('category');
    
    if (hasFormat1) return 'format1';
    if (hasFormat2) return 'format2';
    return 'unknown';
  }

  async function handleImport() {
    if (!file) return;

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
      
      const parseResult = Papa.parse<any>(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        delimiter: "", // Auto-detect comma or semicolon
        transformHeader: (header: string) => header.trim(),
      });

      if (parseResult.errors && parseResult.errors.length > 0) {
        console.error("CSV parsing errors:", parseResult.errors);
        const criticalErrors = parseResult.errors.filter((e: any) => 
          e.type === 'Quotes' || e.type === 'FieldMismatch'
        );
        if (criticalErrors.length > 0) {
          throw new Error(`Критическая ошибка парсинга CSV: ${criticalErrors[0].message}`);
        }
      }

      const rows = parseResult.data as any[];
      if (rows.length === 0) {
        throw new Error("CSV файл пустой");
      }

      const headers = parseResult.meta.fields || Object.keys(rows[0] || {});
      const detectedFormat = detectFormat(headers);
      
      if (detectedFormat === 'unknown') {
        throw new Error(
          `Не удалось определить формат CSV.\n\n` +
          `Ожидаемые форматы:\n` +
          `1) Country, type of document, file name, Price, link\n` +
          `2) name_en, name_ru, description_en, description_ru, price, stock, category, document_type, country\n\n` +
          `Найденные заголовки: ${headers.join(', ')}`
        );
      }

      console.log(`Определен формат: ${detectedFormat}`, { headers });

      const products = [];
      let skippedRows = 0;

      for (let i = 0; i < rows.length; i++) {
        const row: any = rows[i];
        
        if (!row || Object.keys(row).filter(k => row[k]).length === 0) {
          continue;
        }

        try {
          if (detectedFormat === 'format1') {
            const country = row['Country'] || row['country'] || "";
            const document_type = row['type of document'] || row['document_type'] || "";
            const file_name = row['file name'] || row['file_name'] || "";
            const price = parseFloat(row['Price'] || row['price']) || 25;
            const link = row['link'] || "";

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
          } else if (detectedFormat === 'format2') {
            const rowCategory = row['category'] || category;
            
            if (!row['name_en']) {
              console.warn(`Строка ${i + 2}: отсутствует name_en, пропускаем`);
              skippedRows++;
              continue;
            }

            products.push({
              name_en: row['name_en'] || "",
              name_ru: row['name_ru'] || row['name_en'] || "",
              description_en: row['description_en'] || "",
              description_ru: row['description_ru'] || row['description_en'] || "",
              price: parseFloat(row['price']) || 0,
              stock: parseInt(row['stock']) || 1000,
              category: rowCategory,
              document_type: row['document_type'] || null,
              country: row['country'] || null,
              preview_link: row['preview_link'] || row['link'] || null,
            });
          }
        } catch (error) {
          console.error(`Ошибка обработки строки ${i + 2}:`, error);
          skippedRows++;
        }
      }

      if (products.length === 0) {
        throw new Error("Не удалось импортировать ни одного товара. Проверьте формат файла.");
      }

      // DEBUG: Log the first batch to see what's being sent
      console.log("Data to be inserted (first batch):", products.slice(0, 100));

      const batchSize = 100;
      let totalInserted = 0;
      
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        const { error } = await supabase
          .from("products")
          .insert(batch, { 
            defaultToNull: false,
          });
        
        if (error) {
          console.error("Supabase insert error:", error);
          console.error("Failed batch data:", batch);
          throw error;
        }
        totalInserted += batch.length;
      }

      let message = `Импортировано товаров: ${totalInserted}`;
      if (skippedRows > 0) {
        message += `\n(пропущено строк: ${skippedRows})`;
      }
      message += `\n\nФормат: ${detectedFormat === 'format1' ? 'Country/Document' : 'Полный формат'}`;
      message += `\nКатегория: ${detectedFormat === 'format1' ? `"${category}" (из выбора)` : 'из CSV файла'}`;

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
              <SelectContent className="bg-background z-50">
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