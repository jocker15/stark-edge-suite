import { useCallback } from 'react';
import { Upload, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadCSVTemplate } from './templates';
import { useLanguage } from '@/contexts/LanguageContext';

interface FileUploadStepProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
}

export function FileUploadStep({ onFileSelect, selectedFile }: FileUploadStepProps) {
  const { lang } = useLanguage();
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.toLowerCase().endsWith('.csv')) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const translations = {
    en: {
      title: 'Upload CSV File',
      dragDrop: 'Drag and drop your CSV file here',
      or: 'or',
      browse: 'Browse Files',
      selected: 'Selected file:',
      downloadTemplate: 'Download Template',
      templateInfo: 'Download a template file with all the required columns and example data.',
      requirements: 'Requirements:',
      req1: 'File must be in CSV format (UTF-8 encoding)',
      req2: 'Required fields: Name (EN), Price',
      req3: 'Price must be a positive number',
      req4: 'URLs must be valid (http:// or https://)',
      req5: 'SKU must be unique if provided',
    },
    ru: {
      title: 'Загрузка CSV файла',
      dragDrop: 'Перетащите CSV файл сюда',
      or: 'или',
      browse: 'Выбрать файл',
      selected: 'Выбранный файл:',
      downloadTemplate: 'Скачать шаблон',
      templateInfo: 'Скачайте файл-шаблон со всеми необходимыми колонками и примерами данных.',
      requirements: 'Требования:',
      req1: 'Файл должен быть в формате CSV (кодировка UTF-8)',
      req2: 'Обязательные поля: Название (EN), Цена',
      req3: 'Цена должна быть положительным числом',
      req4: 'URL должны быть валидными (http:// или https://)',
      req5: 'Артикул (SKU) должен быть уникальным, если указан',
    },
  };

  const t = translations[lang];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">{t.title}</h3>
        
        <div
          className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => document.getElementById('csv-file-input')?.click()}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg mb-2">{t.dragDrop}</p>
          <p className="text-sm text-gray-500 mb-4">{t.or}</p>
          <Button type="button" variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            {t.browse}
          </Button>
          <input
            id="csv-file-input"
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        {selectedFile && (
          <div className="mt-4 p-4 bg-secondary rounded-lg">
            <p className="text-sm font-medium">
              {t.selected} <span className="text-primary">{selectedFile.name}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <Download className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              {t.downloadTemplate}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              {t.templateInfo}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => downloadCSVTemplate('en')}
                className="bg-white dark:bg-gray-800"
              >
                <Download className="mr-2 h-3 w-3" />
                English
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => downloadCSVTemplate('ru')}
                className="bg-white dark:bg-gray-800"
              >
                <Download className="mr-2 h-3 w-3" />
                Русский
              </Button>
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p className="font-medium mb-2">{t.requirements}</p>
          <ul className="list-disc list-inside space-y-1">
            <li>{t.req1}</li>
            <li>{t.req2}</li>
            <li>{t.req3}</li>
            <li>{t.req4}</li>
            <li>{t.req5}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
