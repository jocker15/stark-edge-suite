export const productManagerTranslations = {
  en: {
    title: "Product Management",
    addProduct: "Add Product",
    editProduct: "Edit Product",
    deleteProduct: "Delete Product",
    importCSV: "Import CSV",
    exportCSV: "Export CSV",
    bulkActionsTitle: "Bulk Actions",
    
    columns: {
      id: "ID",
      image: "Image",
      name: "Name",
      sku: "SKU",
      price: "Price",
      status: "Status",
      category: "Category",
      sales: "Sales",
      stock: "Stock",
      updated: "Updated",
      actions: "Actions",
    },
    
    filters: {
      all: "All",
      status: "Status",
      category: "Category",
      priceRange: "Price Range",
      search: "Search products...",
    },
    
    status: {
      active: "Active",
      draft: "Draft",
      archived: "Archived",
    },
    
    bulkActions: {
      selected: "selected",
      publish: "Publish",
      unpublish: "Unpublish",
      archive: "Archive",
      assignCategory: "Assign Category",
      export: "Export Selected",
      delete: "Delete Selected",
    },
    
    form: {
      tabs: {
        general: "General Info",
        pricing: "Pricing",
        categorization: "Categorization",
        digital: "Digital Delivery",
        media: "Media",
        geography: "Geography",
        status: "Status & Visibility",
      },
      
      fields: {
        nameEn: "Name (English)",
        nameRu: "Name (Russian)",
        descriptionEn: "Description (English)",
        descriptionRu: "Description (Russian)",
        slug: "Slug",
        sku: "SKU",
        price: "Price",
        oldPrice: "Old Price",
        currency: "Currency",
        category: "Category",
        tags: "Tags",
        isDigital: "Digital Product",
        fileUrl: "File URL",
        externalUrl: "External URL",
        downloadLimit: "Download Limit",
        country: "Country",
        state: "State",
        documentType: "Document Type",
        status: "Status",
        stock: "Stock",
        metaTitle: "Meta Title",
        metaDescription: "Meta Description",
        mainImage: "Main Image",
        gallery: "Gallery Images",
        previewLink: "Preview Link",
      },
      
      placeholders: {
        nameEn: "Enter product name in English",
        nameRu: "Enter product name in Russian",
        descriptionEn: "Describe the product in English",
        descriptionRu: "Describe the product in Russian",
        slug: "product-url-slug",
        sku: "Auto-generated or custom SKU",
        price: "0.00",
        tags: "Add tags...",
        fileUrl: "https://...",
        externalUrl: "https://...",
        downloadLimit: "Unlimited",
        metaTitle: "SEO-optimized title",
        metaDescription: "Brief description for search engines",
      },
      
      actions: {
        save: "Save",
        saving: "Saving...",
        cancel: "Cancel",
        delete: "Delete",
        upload: "Upload",
        generate: "Generate",
        addTag: "Add Tag",
      },
      
      messages: {
        generateSlug: "Generate from name",
        generateSku: "Auto-generate SKU",
        uploadFiles: "Upload or drag files here",
        maxFileSize: "Max file size: 100MB",
        maxImageSize: "Max image size: 5MB",
        removeImage: "Remove image",
        primaryImage: "Set as primary",
      },
    },
    
    confirmations: {
      delete: {
        title: "Delete Product?",
        description: "This action cannot be undone. The product will be permanently deleted from the database.",
        confirm: "Delete",
        cancel: "Cancel",
      },
      bulkDelete: {
        title: "Delete Products?",
        description: "Are you sure you want to delete {count} products? This action cannot be undone.",
        confirm: "Delete All",
        cancel: "Cancel",
      },
      bulkStatusChange: {
        title: "Change Status?",
        description: "Are you sure you want to change the status of {count} products to {status}?",
        confirm: "Confirm",
        cancel: "Cancel",
      },
      deleteFile: {
        title: "Delete File?",
        description: "This will permanently delete the file from storage.",
        confirm: "Delete",
        cancel: "Cancel",
      },
    },
    
    toasts: {
      productCreated: "Product created successfully",
      productUpdated: "Product updated successfully",
      productDeleted: "Product deleted successfully",
      productsDeleted: "{count} products deleted successfully",
      statusUpdated: "Status updated for {count} products",
      categoryAssigned: "Category assigned to {count} products",
      exportSuccess: "Exported {count} products",
      uploadSuccess: "File uploaded successfully",
      uploadError: "Failed to upload file",
      error: "An error occurred",
    },
    
    errors: {
      loadProducts: "Failed to load products",
      saveProduct: "Failed to save product",
      deleteProduct: "Failed to delete product",
      uploadFile: "Failed to upload file",
      invalidData: "Invalid data provided",
    },
    
    empty: {
      noProducts: "No products found",
      noResults: "No products match your search",
    },
  },
  
  ru: {
    title: "Управление товарами",
    addProduct: "Добавить товар",
    editProduct: "Редактировать товар",
    deleteProduct: "Удалить товар",
    importCSV: "Импорт CSV",
    exportCSV: "Экспорт CSV",
    bulkActionsTitle: "Массовые действия",
    
    columns: {
      id: "ID",
      image: "Изображение",
      name: "Название",
      sku: "Артикул",
      price: "Цена",
      status: "Статус",
      category: "Категория",
      sales: "Продажи",
      stock: "Остаток",
      updated: "Обновлено",
      actions: "Действия",
    },
    
    filters: {
      all: "Все",
      status: "Статус",
      category: "Категория",
      priceRange: "Диапазон цен",
      search: "Поиск товаров...",
    },
    
    status: {
      active: "Активен",
      draft: "Черновик",
      archived: "Архивирован",
    },
    
    bulkActions: {
      selected: "выбрано",
      publish: "Опубликовать",
      unpublish: "Снять с публикации",
      archive: "Архивировать",
      assignCategory: "Назначить категорию",
      export: "Экспортировать выбранное",
      delete: "Удалить выбранное",
    },
    
    form: {
      tabs: {
        general: "Основная информация",
        pricing: "Ценообразование",
        categorization: "Категоризация",
        digital: "Цифровая доставка",
        media: "Медиа",
        geography: "География",
        status: "Статус и видимость",
      },
      
      fields: {
        nameEn: "Название (English)",
        nameRu: "Название (Русский)",
        descriptionEn: "Описание (English)",
        descriptionRu: "Описание (Русский)",
        slug: "URL-слаг",
        sku: "Артикул",
        price: "Цена",
        oldPrice: "Старая цена",
        currency: "Валюта",
        category: "Категория",
        tags: "Теги",
        isDigital: "Цифровой продукт",
        fileUrl: "URL файла",
        externalUrl: "Внешний URL",
        downloadLimit: "Лимит загрузок",
        country: "Страна",
        state: "Штат/Регион",
        documentType: "Тип документа",
        status: "Статус",
        stock: "Остаток",
        metaTitle: "Мета-заголовок",
        metaDescription: "Мета-описание",
        mainImage: "Главное изображение",
        gallery: "Галерея",
        previewLink: "Ссылка на превью",
      },
      
      placeholders: {
        nameEn: "Введите название на английском",
        nameRu: "Введите название на русском",
        descriptionEn: "Опишите товар на английском",
        descriptionRu: "Опишите товар на русском",
        slug: "url-slug-tovara",
        sku: "Автоматически или свой артикул",
        price: "0.00",
        tags: "Добавить теги...",
        fileUrl: "https://...",
        externalUrl: "https://...",
        downloadLimit: "Без ограничений",
        metaTitle: "SEO-оптимизированный заголовок",
        metaDescription: "Краткое описание для поисковых систем",
      },
      
      actions: {
        save: "Сохранить",
        saving: "Сохранение...",
        cancel: "Отмена",
        delete: "Удалить",
        upload: "Загрузить",
        generate: "Сгенерировать",
        addTag: "Добавить тег",
      },
      
      messages: {
        generateSlug: "Сгенерировать из названия",
        generateSku: "Сгенерировать артикул",
        uploadFiles: "Загрузите или перетащите файлы сюда",
        maxFileSize: "Макс. размер файла: 100МБ",
        maxImageSize: "Макс. размер изображения: 5МБ",
        removeImage: "Удалить изображение",
        primaryImage: "Сделать главным",
      },
    },
    
    confirmations: {
      delete: {
        title: "Удалить товар?",
        description: "Это действие нельзя отменить. Товар будет удален из базы данных навсегда.",
        confirm: "Удалить",
        cancel: "Отмена",
      },
      bulkDelete: {
        title: "Удалить товары?",
        description: "Вы уверены, что хотите удалить {count} товаров? Это действие нельзя отменить.",
        confirm: "Удалить все",
        cancel: "Отмена",
      },
      bulkStatusChange: {
        title: "Изменить статус?",
        description: "Вы уверены, что хотите изменить статус {count} товаров на {status}?",
        confirm: "Подтвердить",
        cancel: "Отмена",
      },
      deleteFile: {
        title: "Удалить файл?",
        description: "Файл будет удален из хранилища навсегда.",
        confirm: "Удалить",
        cancel: "Отмена",
      },
    },
    
    toasts: {
      productCreated: "Товар успешно создан",
      productUpdated: "Товар успешно обновлен",
      productDeleted: "Товар успешно удален",
      productsDeleted: "Удалено товаров: {count}",
      statusUpdated: "Статус обновлен для {count} товаров",
      categoryAssigned: "Категория назначена для {count} товаров",
      exportSuccess: "Экспортировано товаров: {count}",
      uploadSuccess: "Файл успешно загружен",
      uploadError: "Не удалось загрузить файл",
      error: "Произошла ошибка",
    },
    
    errors: {
      loadProducts: "Не удалось загрузить товары",
      saveProduct: "Не удалось сохранить товар",
      deleteProduct: "Не удалось удалить товар",
      uploadFile: "Не удалось загрузить файл",
      invalidData: "Предоставлены неверные данные",
    },
    
    empty: {
      noProducts: "Товары не найдены",
      noResults: "Нет товаров, соответствующих вашему поиску",
    },
  },
};

export function getProductManagerTranslation(lang: 'en' | 'ru', key: string): string {
  const keys = key.split('.');
  let value: unknown = productManagerTranslations[lang];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }
  
  return typeof value === 'string' ? value : key;
}
