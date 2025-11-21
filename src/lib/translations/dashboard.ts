export const dashboardTranslations = {
  en: {
    title: "Dashboard",
    description: "Overview of key metrics and analytics",
    
    refresh: {
      manual: "Refresh",
      auto: "Auto-refresh",
      enabled: "Auto-refresh enabled",
      disabled: "Auto-refresh disabled",
      interval: "every 30s",
      retry: "Retry",
    },
    
    stats: {
      salesToday: "Sales Today",
      salesWeek: "Sales This Week",
      salesMonth: "Sales This Month",
      revenueToday: "Revenue Today",
      revenueWeek: "Revenue This Week",
      revenueMonth: "Revenue This Month",
      newUsersToday: "New Users Today",
      newUsersWeek: "New Users This Week",
      newUsersMonth: "New Users This Month",
      activeProducts: "Active Products",
      pendingReviews: "Pending Reviews",
      unreadReviews: "Unread Reviews",
      pendingOrders: "Pending Orders",
      failedOrders: "Failed Orders",
      totalRevenue: "Total Revenue",
      totalOrders: "Total Orders",
      totalUsers: "Total Users",
    },
    
    charts: {
      salesByDay: "Sales by Day",
      salesByDayDescription: "Daily sales and revenue trends",
      topProducts: "Top 5 Best-Selling Products",
      topProductsDescription: "Most popular products by sales count",
      geography: "Orders by Geography",
      geographyDescription: "Geographic distribution of orders",
      salesCount: "Sales",
      revenue: "Revenue",
      productName: "Product",
      country: "Country",
      state: "State",
      orderCount: "Orders",
      noData: "No data available",
      last7Days: "Last 7 Days",
      last30Days: "Last 30 Days",
      last90Days: "Last 90 Days",
    },
    
    recentOrders: {
      title: "Orders Requiring Attention",
      description: "Pending and failed orders",
      orderId: "Order ID",
      user: "User",
      amount: "Amount",
      status: "Status",
      date: "Date",
      actions: "Actions",
      viewDetails: "View Details",
      noOrders: "No orders requiring attention",
    },
    
    status: {
      pending: "Pending",
      failed: "Failed",
      completed: "Completed",
    },
    
    sections: {
      stats: "Statistics",
      sales: "Sales chart",
      topProducts: "Top products",
      geography: "Geography",
      recentOrders: "Recent orders",
    },
    
    errors: {
      loadStats: "Failed to load dashboard statistics",
      loadChart: "Failed to load chart data",
      tryAgain: "Please try again",
      partialData: "Some dashboard data failed to load. Showing fallback values.",
    },
    
    loading: {
      stats: "Loading statistics...",
      chart: "Loading chart...",
    },
  },
  
  ru: {
    title: "Панель управления",
    description: "Обзор ключевых показателей и аналитики",
    
    refresh: {
      manual: "Обновить",
      auto: "Автообновление",
      enabled: "Автообновление включено",
      disabled: "Автообновление выключено",
      interval: "каждые 30с",
      retry: "Повторить",
    },
    
    stats: {
      salesToday: "Продаж сегодня",
      salesWeek: "Продаж за неделю",
      salesMonth: "Продаж за месяц",
      revenueToday: "Выручка сегодня",
      revenueWeek: "Выручка за неделю",
      revenueMonth: "Выручка за месяц",
      newUsersToday: "Новых пользователей сегодня",
      newUsersWeek: "Новых пользователей за неделю",
      newUsersMonth: "Новых пользователей за месяц",
      activeProducts: "Активных товаров",
      pendingReviews: "Ожидающих отзывов",
      unreadReviews: "Непрочитанных отзывов",
      pendingOrders: "Ожидающих заказов",
      failedOrders: "Неудачных заказов",
      totalRevenue: "Общая выручка",
      totalOrders: "Всего заказов",
      totalUsers: "Всего пользователей",
    },
    
    charts: {
      salesByDay: "Продажи по дням",
      salesByDayDescription: "Тренды ежедневных продаж и выручки",
      topProducts: "Топ 5 самых продаваемых товаров",
      topProductsDescription: "Самые популярные товары по количеству продаж",
      geography: "Заказы по географии",
      geographyDescription: "Географическое распределение заказов",
      salesCount: "Продажи",
      revenue: "Выручка",
      productName: "Товар",
      country: "Страна",
      state: "Регион",
      orderCount: "Заказы",
      noData: "Нет данных",
      last7Days: "Последние 7 дней",
      last30Days: "Последние 30 дней",
      last90Days: "Последние 90 дней",
    },
    
    recentOrders: {
      title: "Заказы требующие внимания",
      description: "Ожидающие и неудачные заказы",
      orderId: "ID заказа",
      user: "Пользователь",
      amount: "Сумма",
      status: "Статус",
      date: "Дата",
      actions: "Действия",
      viewDetails: "Просмотр деталей",
      noOrders: "Нет заказов требующих внимания",
    },
    
    status: {
      pending: "Ожидает",
      failed: "Неудача",
      completed: "Завершён",
    },
    
    sections: {
      stats: "Статистика",
      sales: "График продаж",
      topProducts: "Топ товаров",
      geography: "География заказов",
      recentOrders: "Последние заказы",
    },
    
    errors: {
      loadStats: "Не удалось загрузить статистику панели управления",
      loadChart: "Не удалось загрузить данные графика",
      tryAgain: "Пожалуйста, попробуйте снова",
      partialData: "Не удалось загрузить часть данных панели. Показаны запасные значения.",
    },
    
    loading: {
      stats: "Загрузка статистики...",
      chart: "Загрузка графика...",
    },
  },
};

export type DashboardLanguage = 'en' | 'ru';

export const getTranslation = (lang: DashboardLanguage, key: string): string => {
  const keys = key.split('.');
  let value: Record<string, unknown> | string = dashboardTranslations[lang];
  
  for (const k of keys) {
    if (typeof value === 'object' && value !== null) {
      value = (value as Record<string, unknown>)[k] as Record<string, unknown> | string;
    } else {
      return key;
    }
  }
  
  return typeof value === 'string' ? value : key;
};
