# Admin Dashboard Analytics Feature

## Overview
A comprehensive analytics dashboard for admin users displaying key performance indicators (KPIs), visualizations, and real-time data about the e-commerce platform.

## Route
- **URL**: `/admin/dashboard`
- **Access**: Admin users only (role-based authentication)

## Features

### 1. Key Performance Indicators (KPIs)
Display real-time metrics in card format:
- **Sales**: Today, This Week, This Month
- **Revenue**: Today, This Week, This Month (in USD)
- **New Users**: Today, This Week, This Month
- **Active Products**: Total count of published products
- **Pending Reviews**: Reviews awaiting approval
- **Pending Orders**: Orders requiring attention
- **Failed Orders**: Orders that need resolution

### 2. Data Visualizations

#### Sales Time-Series Chart
- **Type**: Line chart with dual Y-axes
- **Data**: Daily sales count and revenue
- **Periods**: Selectable (7, 30, or 90 days)
- **Features**:
  - Interactive tooltips
  - Responsive design
  - Color-coded lines (sales count vs revenue)

#### Top Products Bar Chart
- **Type**: Horizontal bar chart
- **Data**: Top 5 best-selling products by sales count
- **Features**:
  - Color-coded bars
  - Product name truncation for long names
  - Sales count and revenue display

#### Geographic Distribution
- **Type**: Data table with visual indicators
- **Data**: Orders aggregated by country and state
- **Features**:
  - Percentage badges with color intensity
  - Total order count and revenue summary
  - Scrollable table for many regions

### 3. Recent Orders Requiring Attention
- **Type**: Data table
- **Data**: Pending and failed orders (up to 10 most recent)
- **Features**:
  - Order ID, user info, amount, status, date
  - Quick view action to order details
  - Status badges (color-coded)

### 4. Data Refresh Controls
- **Manual Refresh**: Button to reload all data
- **Auto-Refresh**: Toggle switch for automatic updates every 30 seconds
- **Loading States**: Skeleton screens during data fetch

## Database Components

### SQL Functions (RPCs)

#### `get_dashboard_stats()`
Returns comprehensive statistics:
```sql
{
  sales_today: number,
  sales_week: number,
  sales_month: number,
  revenue_today: number,
  revenue_week: number,
  revenue_month: number,
  new_users_today: number,
  new_users_week: number,
  new_users_month: number,
  active_products: number,
  pending_reviews: number,
  pending_orders: number,
  failed_orders: number,
  total_revenue: number,
  total_orders: number,
  total_users: number
}
```

#### `get_sales_by_day(days_count)`
Returns daily sales data for time-series chart:
```sql
{
  date: date,
  sales_count: bigint,
  revenue: numeric
}
```

#### `get_top_products(limit_count, days_count)`
Returns top-selling products:
```sql
{
  product_id: integer,
  product_name: text,
  sales_count: bigint,
  revenue: numeric
}
```

#### `get_orders_by_geography(days_count)`
Returns geographic distribution of orders:
```sql
{
  country: text,
  state: text,
  order_count: bigint,
  revenue: numeric
}
```

#### `get_orders_requiring_attention(limit_count)`
Returns orders with pending/failed status:
```sql
{
  id: integer,
  user_id: text,
  amount: numeric,
  status: text,
  created_at: timestamp,
  user_email: text,
  user_name: text
}
```

### Data Filtering
- All revenue calculations filter by `status = 'completed'` orders
- Time-based queries use server timezone (UTC)
- Geographic data extracted from product metadata

## Component Structure

### Main Page
- `src/pages/AdminDashboard.tsx`

### Dashboard Components
- `src/components/admin/dashboard/DashboardStats.tsx` - KPI cards
- `src/components/admin/dashboard/SalesChart.tsx` - Time-series chart
- `src/components/admin/dashboard/TopProductsChart.tsx` - Bar chart
- `src/components/admin/dashboard/GeographyChart.tsx` - Geographic table
- `src/components/admin/dashboard/RecentOrders.tsx` - Orders table

### Translations
- `src/lib/translations/dashboard.ts` - EN/RU translations

### Database Migration
- `supabase/migrations/20250105000000_add_dashboard_analytics.sql`

## Internationalization (i18n)

Fully localized for English and Russian:
- Metric labels and descriptions
- Chart axis labels and tooltips
- Status badges and error messages
- Date/time formatting
- Currency formatting (USD)

## Responsive Design

### Mobile (< 768px)
- KPI cards stack vertically
- Charts remain readable with adjusted dimensions
- Tables scroll horizontally
- Navigation tabs remain accessible

### Tablet (768px - 1024px)
- KPI cards in 2-column grid
- Charts side-by-side
- Optimized spacing

### Desktop (> 1024px)
- KPI cards in 4-column grid
- Charts in 2-column layout
- Full-width tables with all columns visible

## Performance Considerations

### Data Loading
- Parallel API requests using `Promise.all()`
- Efficient SQL queries with indexes
- Limited result sets (e.g., top 5 products, 10 recent orders)

### Rendering Optimization
- Skeleton loading states prevent layout shift
- React hooks for efficient re-renders
- Memoized callbacks to prevent unnecessary updates

### Auto-Refresh
- Configurable interval (default: 30 seconds)
- Background updates without blocking UI
- Toggle control for user preference

## Error Handling

- Toast notifications for API errors
- Empty state messages for no data
- Graceful fallbacks for missing data
- Error boundaries prevent full page crashes

## Navigation

### To Dashboard
- From Admin page: Click "Панель/Dashboard" tab
- Direct URL: `/admin/dashboard`

### From Dashboard
- To other admin sections: Click respective tabs (Products, Reviews, Orders, Users)
- To order details: Click "View Details" on recent orders

## Future Enhancements

Potential improvements:
- Export dashboard data to PDF/CSV
- Customizable date range filters
- More chart types (pie charts, area charts)
- Real-time WebSocket updates
- Dashboard widgets customization
- Comparison with previous periods
- Revenue forecasting
- Product performance trends

## Testing Checklist

- [ ] Admin authentication works
- [ ] All KPI cards display correct data
- [ ] Sales chart updates with period selection
- [ ] Top products chart shows correct data
- [ ] Geography table displays all regions
- [ ] Recent orders table shows pending/failed orders
- [ ] Manual refresh updates all components
- [ ] Auto-refresh works at 30s intervals
- [ ] Responsive design on mobile/tablet/desktop
- [ ] English and Russian translations work
- [ ] Error states display properly
- [ ] Loading skeletons appear during data fetch
- [ ] Navigation to/from dashboard works
