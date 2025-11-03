import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { ImportProgress } from './types';
import { useLanguage } from '@/contexts/LanguageContext';

interface ImportProgressStepProps {
  progress: ImportProgress;
}

export function ImportProgressStep({ progress }: ImportProgressStepProps) {
  const { lang } = useLanguage();

  const percentage = progress.total > 0 ? (progress.processed / progress.total) * 100 : 0;

  const translations = {
    en: {
      title: 'Import Progress',
      parsing: 'Parsing CSV file...',
      validating: 'Validating data...',
      uploading: 'Uploading products...',
      complete: 'Import Complete!',
      total: 'Total',
      processed: 'Processed',
      successful: 'Successful',
      failed: 'Failed',
    },
    ru: {
      title: 'Прогресс импорта',
      parsing: 'Парсинг CSV файла...',
      validating: 'Валидация данных...',
      uploading: 'Загрузка товаров...',
      complete: 'Импорт завершен!',
      total: 'Всего',
      processed: 'Обработано',
      successful: 'Успешно',
      failed: 'Ошибок',
    },
  };

  const t = translations[lang];

  const getStageText = () => {
    switch (progress.stage) {
      case 'parsing':
        return t.parsing;
      case 'validating':
        return t.validating;
      case 'uploading':
        return t.uploading;
      case 'complete':
        return t.complete;
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">{t.title}</h3>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {progress.stage === 'complete' ? (
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            ) : (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            )}
            <span className="text-lg font-medium">{getStageText()}</span>
          </div>

          <div className="space-y-2">
            <Progress value={percentage} className="h-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              {progress.processed} / {progress.total} ({percentage.toFixed(0)}%)
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">{t.total}</p>
              <p className="text-2xl font-bold">{progress.total}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-700 dark:text-blue-300">{t.processed}</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {progress.processed}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900 rounded-lg p-4 text-center">
              <p className="text-sm text-green-700 dark:text-green-300">{t.successful}</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {progress.successful}
              </p>
            </div>
            <div className="bg-red-100 dark:bg-red-900 rounded-lg p-4 text-center">
              <p className="text-sm text-red-700 dark:text-red-300">{t.failed}</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {progress.failed}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
