export const securityCenterTranslations = {
  en: {
    title: "Security Center",
    description: "Monitor login activity, audit logs, and manage user roles",
    
    // Tabs
    tabs: {
      loginActivity: "Login Activity",
      auditLogs: "Audit Logs",
      roleManagement: "Role Management"
    },
    
    // Login Activity
    loginActivity: {
      title: "Login Activity",
      description: "Monitor user login attempts and authentication events",
      filters: {
        user: "User",
        status: "Status",
        dateRange: "Date Range",
        from: "From",
        to: "To",
        search: "Search by email...",
        apply: "Apply Filters",
        reset: "Reset"
      },
      status: {
        all: "All Status",
        success: "Success",
        failed: "Failed",
        blocked: "Blocked"
      },
      table: {
        user: "User",
        email: "Email",
        ipAddress: "IP Address",
        status: "Status",
        reason: "Failure Reason",
        time: "Time",
        userAgent: "User Agent",
        noData: "No login events found"
      },
      export: "Export CSV"
    },
    
    // Audit Logs
    auditLogs: {
      title: "Audit Logs",
      description: "View detailed audit trail of all admin actions",
      filters: {
        user: "User",
        entityType: "Entity Type",
        actionType: "Action Type",
        dateRange: "Date Range",
        search: "Search logs...",
        apply: "Apply Filters",
        reset: "Reset"
      },
      entityTypes: {
        all: "All Types",
        product: "Product",
        order: "Order",
        user: "User",
        profile: "Profile",
        user_role: "User Role",
        review: "Review"
      },
      table: {
        user: "User",
        action: "Action",
        entity: "Entity",
        entityId: "Entity ID",
        details: "Details",
        ipAddress: "IP Address",
        time: "Time",
        noData: "No audit logs found",
        viewDetails: "View Details"
      },
      export: "Export CSV",
      detailsDialog: {
        title: "Audit Log Details",
        user: "User",
        action: "Action",
        entity: "Entity Type",
        entityId: "Entity ID",
        ipAddress: "IP Address",
        userAgent: "User Agent",
        timestamp: "Timestamp",
        changes: "Changes",
        close: "Close"
      }
    },
    
    // Role Management
    roleManagement: {
      title: "Role Management",
      description: "Assign and manage user roles with hierarchical permissions",
      hierarchy: {
        title: "Role Hierarchy",
        superAdmin: "Super Admin",
        superAdminDesc: "Full system access, can manage all roles and settings",
        admin: "Admin",
        adminDesc: "Can manage products, orders, and users",
        moderator: "Moderator",
        moderatorDesc: "Can moderate reviews and content",
        user: "User",
        userDesc: "Standard user with no admin access"
      },
      search: {
        placeholder: "Search users by email or name...",
        noResults: "No users found"
      },
      table: {
        user: "User",
        email: "Email",
        currentRoles: "Current Roles",
        actions: "Actions",
        manageRoles: "Manage Roles",
        noRoles: "No roles assigned"
      },
      manageDialog: {
        title: "Manage User Roles",
        user: "User",
        currentRoles: "Current Roles",
        availableRoles: "Available Roles",
        selectRoles: "Select roles to assign",
        warning: "Warning: Role changes take effect immediately",
        save: "Save Changes",
        cancel: "Cancel"
      },
      confirmDialog: {
        title: "Confirm Role Changes",
        message: "Are you sure you want to change roles for",
        changes: "Changes",
        adding: "Adding",
        removing: "Removing",
        confirm: "Confirm",
        cancel: "Cancel"
      },
      messages: {
        success: "Roles updated successfully",
        error: "Failed to update roles",
        noChanges: "No changes were made"
      }
    },
    
    // Common
    common: {
      loading: "Loading...",
      refresh: "Refresh",
      export: "Export",
      search: "Search",
      filter: "Filter",
      clear: "Clear",
      apply: "Apply",
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      view: "View",
      close: "Close",
      noData: "No data available",
      error: "An error occurred",
      success: "Operation successful"
    }
  },
  
  ru: {
    title: "Центр безопасности",
    description: "Мониторинг входов, журнал аудита и управление ролями пользователей",
    
    // Tabs
    tabs: {
      loginActivity: "История входов",
      auditLogs: "Журнал аудита",
      roleManagement: "Управление ролями"
    },
    
    // Login Activity
    loginActivity: {
      title: "История входов",
      description: "Мониторинг попыток входа пользователей и событий аутентификации",
      filters: {
        user: "Пользователь",
        status: "Статус",
        dateRange: "Диапазон дат",
        from: "С",
        to: "По",
        search: "Поиск по email...",
        apply: "Применить фильтры",
        reset: "Сбросить"
      },
      status: {
        all: "Все статусы",
        success: "Успешно",
        failed: "Ошибка",
        blocked: "Заблокировано"
      },
      table: {
        user: "Пользователь",
        email: "Email",
        ipAddress: "IP-адрес",
        status: "Статус",
        reason: "Причина ошибки",
        time: "Время",
        userAgent: "User Agent",
        noData: "События входа не найдены"
      },
      export: "Экспорт CSV"
    },
    
    // Audit Logs
    auditLogs: {
      title: "Журнал аудита",
      description: "Просмотр подробного журнала всех действий администраторов",
      filters: {
        user: "Пользователь",
        entityType: "Тип сущности",
        actionType: "Тип действия",
        dateRange: "Диапазон дат",
        search: "Поиск в журнале...",
        apply: "Применить фильтры",
        reset: "Сбросить"
      },
      entityTypes: {
        all: "Все типы",
        product: "Товар",
        order: "Заказ",
        user: "Пользователь",
        profile: "Профиль",
        user_role: "Роль пользователя",
        review: "Отзыв"
      },
      table: {
        user: "Пользователь",
        action: "Действие",
        entity: "Сущность",
        entityId: "ID сущности",
        details: "Детали",
        ipAddress: "IP-адрес",
        time: "Время",
        noData: "Записи в журнале не найдены",
        viewDetails: "Просмотр деталей"
      },
      export: "Экспорт CSV",
      detailsDialog: {
        title: "Детали записи аудита",
        user: "Пользователь",
        action: "Действие",
        entity: "Тип сущности",
        entityId: "ID сущности",
        ipAddress: "IP-адрес",
        userAgent: "User Agent",
        timestamp: "Временная метка",
        changes: "Изменения",
        close: "Закрыть"
      }
    },
    
    // Role Management
    roleManagement: {
      title: "Управление ролями",
      description: "Назначение и управление ролями пользователей с иерархическими правами",
      hierarchy: {
        title: "Иерархия ролей",
        superAdmin: "Супер-администратор",
        superAdminDesc: "Полный доступ к системе, может управлять всеми ролями и настройками",
        admin: "Администратор",
        adminDesc: "Может управлять товарами, заказами и пользователями",
        moderator: "Модератор",
        moderatorDesc: "Может модерировать отзывы и контент",
        user: "Пользователь",
        userDesc: "Обычный пользователь без прав администратора"
      },
      search: {
        placeholder: "Поиск пользователей по email или имени...",
        noResults: "Пользователи не найдены"
      },
      table: {
        user: "Пользователь",
        email: "Email",
        currentRoles: "Текущие роли",
        actions: "Действия",
        manageRoles: "Управление ролями",
        noRoles: "Роли не назначены"
      },
      manageDialog: {
        title: "Управление ролями пользователя",
        user: "Пользователь",
        currentRoles: "Текущие роли",
        availableRoles: "Доступные роли",
        selectRoles: "Выберите роли для назначения",
        warning: "Внимание: Изменения ролей вступают в силу немедленно",
        save: "Сохранить изменения",
        cancel: "Отмена"
      },
      confirmDialog: {
        title: "Подтверждение изменения ролей",
        message: "Вы уверены, что хотите изменить роли для",
        changes: "Изменения",
        adding: "Добавление",
        removing: "Удаление",
        confirm: "Подтвердить",
        cancel: "Отмена"
      },
      messages: {
        success: "Роли успешно обновлены",
        error: "Не удалось обновить роли",
        noChanges: "Изменения не были внесены"
      }
    },
    
    // Common
    common: {
      loading: "Загрузка...",
      refresh: "Обновить",
      export: "Экспорт",
      search: "Поиск",
      filter: "Фильтр",
      clear: "Очистить",
      apply: "Применить",
      cancel: "Отмена",
      save: "Сохранить",
      delete: "Удалить",
      edit: "Изменить",
      view: "Просмотр",
      close: "Закрыть",
      noData: "Нет данных",
      error: "Произошла ошибка",
      success: "Операция выполнена успешно"
    }
  }
};

export type Language = "en" | "ru";

export const getTranslation = (lang: Language, key: string) => {
  const keys = key.split(".");
  let value: unknown = securityCenterTranslations[lang];
  
  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }
  
  return typeof value === "string" ? value : key;
};
