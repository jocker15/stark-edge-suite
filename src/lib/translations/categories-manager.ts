const translations = {
  en: {
    title: "Categories Manager",
    description: "Manage product categories with drag-and-drop reordering",
    createButton: "Create Category",
    deleteButton: "Delete",
    editButton: "Edit",
    saveButton: "Save Changes",
    cancelButton: "Cancel",
    confirmDelete: "Confirm Delete",
    search: "Search categories...",
    
    columns: {
      name: "Category Name",
      slug: "Slug",
      description: "Description",
      products: "Products",
      parent: "Parent",
      sortOrder: "Order",
      actions: "Actions",
    },
    
    form: {
      title: {
        create: "Create New Category",
        edit: "Edit Category",
      },
      fields: {
        nameEn: "Name (English)",
        nameRu: "Name (Russian)",
        slug: "Slug",
        description: "Description",
        parent: "Parent Category",
        sortOrder: "Sort Order",
      },
      placeholders: {
        nameEn: "Enter category name in English",
        nameRu: "Enter category name in Russian",
        slug: "Auto-generated from name",
        description: "Optional description",
        parent: "Select parent category (optional)",
      },
    },
    
    delete: {
      title: "Delete Category",
      message: "Are you sure you want to delete this category?",
      withProducts: "This category has {count} product(s). You must reassign or remove them first.",
      withChildren: "This category has {count} child categor(ies). You must delete or reassign them first.",
      reassignTitle: "Reassign Products",
      reassignMessage: "This category has {count} product(s). Select a category to reassign them to:",
      selectCategory: "Select category",
      reassignAndDelete: "Reassign & Delete",
      cannotDelete: "Cannot Delete",
    },
    
    messages: {
      createSuccess: "Category created successfully",
      updateSuccess: "Category updated successfully",
      deleteSuccess: "Category deleted successfully",
      reorderSuccess: "Categories reordered successfully",
      reassignSuccess: "{count} product(s) reassigned successfully",
      error: "An error occurred",
      loadError: "Failed to load categories",
      duplicateSlug: "A category with this slug already exists",
      duplicateName: "A category with this name already exists",
    },
    
    empty: {
      title: "No categories found",
      description: "Create your first category to organize products",
    },
    
    dragHint: "Drag to reorder categories",
    productCount: "{count} product(s)",
    activeProducts: "{count} active",
    noParent: "None (Top Level)",
  },
  ru: {
    title: "Менеджер категорий",
    description: "Управление категориями товаров с перетаскиванием",
    createButton: "Создать категорию",
    deleteButton: "Удалить",
    editButton: "Редактировать",
    saveButton: "Сохранить изменения",
    cancelButton: "Отмена",
    confirmDelete: "Подтвердить удаление",
    search: "Поиск категорий...",
    
    columns: {
      name: "Название категории",
      slug: "Слаг",
      description: "Описание",
      products: "Товары",
      parent: "Родитель",
      sortOrder: "Порядок",
      actions: "Действия",
    },
    
    form: {
      title: {
        create: "Создать новую категорию",
        edit: "Редактировать категорию",
      },
      fields: {
        nameEn: "Название (английский)",
        nameRu: "Название (русский)",
        slug: "Слаг",
        description: "Описание",
        parent: "Родительская категория",
        sortOrder: "Порядок сортировки",
      },
      placeholders: {
        nameEn: "Введите название на английском",
        nameRu: "Введите название на русском",
        slug: "Автогенерация из названия",
        description: "Необязательное описание",
        parent: "Выберите родительскую категорию (необязательно)",
      },
    },
    
    delete: {
      title: "Удалить категорию",
      message: "Вы уверены, что хотите удалить эту категорию?",
      withProducts: "В этой категории {count} товар(ов). Сначала переназначьте или удалите их.",
      withChildren: "У этой категории есть {count} дочерн(их/яя) категори(й/я). Сначала удалите или переназначьте их.",
      reassignTitle: "Переназначить товары",
      reassignMessage: "В этой категории {count} товар(ов). Выберите категорию для переназначения:",
      selectCategory: "Выберите категорию",
      reassignAndDelete: "Переназначить и удалить",
      cannotDelete: "Невозможно удалить",
    },
    
    messages: {
      createSuccess: "Категория успешно создана",
      updateSuccess: "Категория успешно обновлена",
      deleteSuccess: "Категория успешно удалена",
      reorderSuccess: "Категории успешно переупорядочены",
      reassignSuccess: "{count} товар(ов) успешно переназначено",
      error: "Произошла ошибка",
      loadError: "Не удалось загрузить категории",
      duplicateSlug: "Категория с таким слагом уже существует",
      duplicateName: "Категория с таким названием уже существует",
    },
    
    empty: {
      title: "Категории не найдены",
      description: "Создайте первую категорию для организации товаров",
    },
    
    dragHint: "Перетащите для изменения порядка",
    productCount: "{count} товар(ов)",
    activeProducts: "{count} активных",
    noParent: "Нет (верхний уровень)",
  },
};

export function getCategoriesManagerTranslation(lang: string, key: string): string {
  const keys = key.split(".");
  let value: unknown = translations[lang as keyof typeof translations] || translations.en;
  
  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      value = key;
      break;
    }
  }
  
  return typeof value === "string" ? value : key;
}
