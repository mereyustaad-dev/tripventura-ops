'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CalendarIcon,
  Users,
  Globe,
  Plus,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  XCircle,
  MapPin,
  Mail,
  Phone,
  StickyNote,
  CalendarDays,
  BarChart3,
  Target,
  ShoppingCart,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

// ──────────────────────────────────────────────
// TypeScript Types
// ──────────────────────────────────────────────

interface TourInfo {
  tourName: string;
  destinationCity: string;
  category: string | null;
}

interface Booking {
  id: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  marketplace: string | null;
  adults: number;
  children: number;
  totalPrice: number;
  supplierCost: number | null;
  profit: number | null;
  bookingDate: string;
  tourDate: string | null;
  status: string;
  notes: string | null;
  tour: TourInfo;
  createdAt: string;
  updatedAt: string;
}

interface BookingsApiResponse {
  bookings: Booking[];
  total: number;
  page: number;
  totalPages: number;
}

interface FilterState {
  search: string;
  status: string;
  marketplace: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  destination: string;
}

type SortField =
  | 'customerName'
  | 'totalPrice'
  | 'profit'
  | 'bookingDate'
  | 'tourDate'
  | 'status'
  | 'marketplace'
  | 'adults';

interface NewBookingForm {
  tourId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  marketplace: string;
  adults: number;
  children: number;
  tourDate: string;
  totalPrice: number;
  supplierCost: number;
  notes: string;
}

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'pending', label: 'Pending' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
];

const MARKETPLACE_OPTIONS = [
  { value: '', label: 'All Marketplaces' },
  { value: 'Website', label: 'Website' },
  { value: 'Ctrip', label: 'Ctrip' },
  { value: 'Viator', label: 'Viator' },
  { value: 'Klook', label: 'Klook' },
  { value: 'Expedition', label: 'Expedition' },
  { value: 'Civitatis', label: 'Civitatis' },
  { value: 'Headout', label: 'Headout' },
];

const MARKETPLACE_COLORS: Record<string, string> = {
  Website: 'bg-blue-100 text-blue-700 border-blue-200',
  Ctrip: 'bg-orange-100 text-orange-700 border-orange-200',
  Viator: 'bg-violet-100 text-violet-700 border-violet-200',
  Klook: 'bg-pink-100 text-pink-700 border-pink-200',
  Expedition: 'bg-teal-100 text-teal-700 border-teal-200',
  Civitatis: 'bg-amber-100 text-amber-700 border-amber-200',
  Headout: 'bg-cyan-100 text-cyan-700 border-cyan-200',
};

const MARKETPLACE_CHART_COLORS = [
  '#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#06b6d4',
];

const INITIAL_FILTERS: FilterState = {
  search: '',
  status: '',
  marketplace: '',
  dateFrom: undefined,
  dateTo: undefined,
  destination: '',
};

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const revenueChartConfig = {
  revenue: { label: 'Revenue', color: '#10b981' },
  profit: { label: 'Profit', color: '#3b82f6' },
  supplierCost: { label: 'Supplier Cost', color: '#ef4444' },
} satisfies ChartConfig;

const marketplaceChartConfig = {
  Website: { label: 'Website', color: '#3b82f6' },
  Ctrip: { label: 'Ctrip', color: '#f97316' },
  Viator: { label: 'Viator', color: '#8b5cf6' },
  Klook: { label: 'Klook', color: '#ec4899' },
  Expedition: { label: 'Expedition', color: '#14b8a6' },
  Civitatis: { label: 'Civitatis', color: '#f59e0b' },
  Headout: { label: 'Headout', color: '#06b6d4' },
} satisfies ChartConfig;

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function getStatusBadgeClasses(status: string): string {
  switch (status) {
    case 'confirmed':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
    case 'pending':
      return 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100';
    case 'cancelled':
      return 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100';
    case 'completed':
      return 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'confirmed':
      return <Check className="h-3 w-3 mr-1" />;
    case 'pending':
      return <Clock className="h-3 w-3 mr-1" />;
    case 'cancelled':
      return <XCircle className="h-3 w-3 mr-1" />;
    case 'completed':
      return <Check className="h-3 w-3 mr-1" />;
    default:
      return null;
  }
}

function getMarketplaceBadgeClasses(marketplace: string | null): string {
  if (!marketplace) return 'bg-gray-100 text-gray-600 border-gray-200';
  return MARKETPLACE_COLORS[marketplace] || 'bg-gray-100 text-gray-600 border-gray-200';
}

function truncateId(id: string): string {
  return id.substring(0, 8).toUpperCase();
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    return format(new Date(dateStr), 'MMM dd, yyyy');
  } catch {
    return '-';
  }
}

function formatDateTime(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'MMM dd, yyyy HH:mm');
  } catch {
    return '-';
  }
}

function countActiveFilters(filters: FilterState): number {
  let count = 0;
  if (filters.search) count++;
  if (filters.status) count++;
  if (filters.marketplace) count++;
  if (filters.dateFrom) count++;
  if (filters.dateTo) count++;
  if (filters.destination) count++;
  return count;
}

function exportToCSV(bookings: Booking[]) {
  const headers = [
    'ID', 'Customer Name', 'Email', 'Phone', 'Tour', 'Destination',
    'Marketplace', 'Adults', 'Children', 'Total Price', 'Supplier Cost',
    'Profit', 'Booking Date', 'Tour Date', 'Status', 'Notes',
  ];
  const rows = bookings.map(b => [
    b.id,
    b.customerName,
    b.customerEmail || '',
    b.customerPhone || '',
    b.tour?.tourName || '',
    b.tour?.destinationCity || '',
    b.marketplace || '',
    b.adults,
    b.children,
    b.totalPrice,
    b.supplierCost || 0,
    b.profit || 0,
    b.bookingDate,
    b.tourDate || '',
    b.status,
    b.notes || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      row.map(cell => {
        const str = String(cell);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bookings-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ──────────────────────────────────────────────
// Sub-Components
// ──────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6 p-4">
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-7 w-24" />
          </div>
        ))}
      </div>
      {/* Chart skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Table skeleton */}
      <Card>
        <CardContent className="p-0">
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Package className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">No bookings found</h3>
      <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
        Try adjusting your search or filter criteria to find what you&apos;re looking for.
      </p>
      <Button variant="outline" size="sm" onClick={onClear}>
        <X className="h-4 w-4 mr-1" />
        Clear filters
      </Button>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="rounded-full bg-red-50 p-4 mb-4">
        <AlertCircle className="h-10 w-10 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold mb-1">Something went wrong</h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm">{message}</p>
    </div>
  );
}

// ──────────────────────────────────────────────
// Revenue Summary Cards
// ──────────────────────────────────────────────

function RevenueSummaryCards({ bookings }: { bookings: Booking[] }) {
  const stats = useMemo(() => {
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const totalProfit = bookings.reduce((sum, b) => sum + (b.profit || 0), 0);
    const avgOrderValue = bookings.length > 0 ? totalRevenue / bookings.length : 0;
    const bookingCount = bookings.length;

    // Top marketplace
    const mpCount: Record<string, number> = {};
    bookings.forEach(b => {
      const mp = b.marketplace || 'Unknown';
      mpCount[mp] = (mpCount[mp] || 0) + 1;
    });
    const topMarketplace = Object.entries(mpCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const topMarketplaceCount = Object.entries(mpCount).sort((a, b) => b[1] - a[1])[0]?.[1] || 0;

    // Month over month trend
    const now = new Date();
    const thisMonth = startOfMonth(now);
    const lastMonth = startOfMonth(subMonths(now, 1));
    const thisMonthEnd = endOfMonth(now);
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const thisMonthRevenue = bookings
      .filter(b => {
        try {
          return isWithinInterval(new Date(b.bookingDate), { start: thisMonth, end: thisMonthEnd });
        } catch {
          return false;
        }
      })
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const lastMonthRevenue = bookings
      .filter(b => {
        try {
          return isWithinInterval(new Date(b.bookingDate), { start: lastMonth, end: lastMonthEnd });
        } catch {
          return false;
        }
      })
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const monthTrend = lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : thisMonthRevenue > 0 ? 100 : 0;

    return { totalRevenue, totalProfit, avgOrderValue, bookingCount, topMarketplace, topMarketplaceCount, thisMonthRevenue, lastMonthRevenue, monthTrend };
  }, [bookings]);

  const cards = [
    {
      label: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-50',
      trend: null,
    },
    {
      label: 'Total Profit',
      value: formatCurrency(stats.totalProfit),
      icon: TrendingUp,
      color: 'text-blue-600 bg-blue-50',
      trend: null,
    },
    {
      label: 'Avg. Order Value',
      value: formatCurrency(stats.avgOrderValue),
      icon: ShoppingCart,
      color: 'text-violet-600 bg-violet-50',
      trend: null,
    },
    {
      label: 'Booking Count',
      value: stats.bookingCount.toLocaleString(),
      icon: Users,
      color: 'text-amber-600 bg-amber-50',
      trend: null,
    },
    {
      label: 'Top Marketplace',
      value: stats.topMarketplace,
      subtitle: `${stats.topMarketplaceCount} bookings`,
      icon: Globe,
      color: 'text-pink-600 bg-pink-50',
      trend: null,
    },
    {
      label: 'This Month',
      value: formatCurrency(stats.thisMonthRevenue),
      icon: CalendarDays,
      color: 'text-orange-600 bg-orange-50',
      trend: stats.monthTrend,
    },
    {
      label: 'MoM Trend',
      value: `${stats.monthTrend >= 0 ? '+' : ''}${stats.monthTrend.toFixed(1)}%`,
      icon: stats.monthTrend >= 0 ? ArrowUpRight : ArrowDownRight,
      color: stats.monthTrend >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50',
      trend: null,
      isTrend: true,
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map(card => (
        <Card key={card.label} className="py-0 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('flex items-center justify-center rounded-md p-1.5', card.color)}>
                <card.icon className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs text-muted-foreground font-medium truncate">{card.label}</span>
            </div>
            <p className={cn(
              'text-lg font-bold leading-none',
              card.isTrend && card.value.startsWith('+') ? 'text-emerald-600' : '',
              card.isTrend && card.value.startsWith('-') ? 'text-red-500' : '',
            )}>
              {card.value}
            </p>
            {card.subtitle && (
              <p className="text-[10px] text-muted-foreground mt-1">{card.subtitle}</p>
            )}
            {card.trend !== null && (
              <div className={cn('flex items-center gap-1 mt-1 text-xs', card.trend >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                {card.trend >= 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                <span>{Math.abs(card.trend).toFixed(1)}% vs last month</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// Revenue Charts
// ──────────────────────────────────────────────

function RevenueCharts({ bookings }: { bookings: Booking[] }) {
  const { revenueOverTime, revenueByMarketplace, revenueByDestination, revenueByCategory, profitVsCost } = useMemo(() => {
    // Revenue over time (by day)
    const dailyMap: Record<string, { revenue: number; profit: number }> = {};
    bookings.forEach(b => {
      const dateKey = b.bookingDate ? format(new Date(b.bookingDate), 'MMM dd') : 'Unknown';
      if (!dailyMap[dateKey]) dailyMap[dateKey] = { revenue: 0, profit: 0 };
      dailyMap[dateKey].revenue += b.totalPrice || 0;
      dailyMap[dateKey].profit += b.profit || 0;
    });
    const revenueOverTime = Object.entries(dailyMap)
      .map(([date, data]) => ({ date, revenue: Math.round(data.revenue), profit: Math.round(data.profit) }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Revenue by marketplace
    const mpMap: Record<string, number> = {};
    bookings.forEach(b => {
      const mp = b.marketplace || 'Unknown';
      mpMap[mp] = (mpMap[mp] || 0) + (b.totalPrice || 0);
    });
    const revenueByMarketplace = Object.entries(mpMap)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);

    // Revenue by destination
    const destMap: Record<string, number> = {};
    bookings.forEach(b => {
      const dest = b.tour?.destinationCity || 'Unknown';
      destMap[dest] = (destMap[dest] || 0) + (b.totalPrice || 0);
    });
    const revenueByDestination = Object.entries(destMap)
      .map(([destination, revenue]) => ({ destination, revenue: Math.round(revenue) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Revenue by category
    const catMap: Record<string, number> = {};
    bookings.forEach(b => {
      const cat = b.tour?.category || 'Unknown';
      catMap[cat] = (catMap[cat] || 0) + (b.totalPrice || 0);
    });
    const revenueByCategory = Object.entries(catMap)
      .map(([category, revenue]) => ({ category, revenue: Math.round(revenue) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    // Profit vs Cost by month
    const monthMap: Record<string, { profit: number; supplierCost: number }> = {};
    bookings.forEach(b => {
      const monthKey = b.bookingDate ? format(new Date(b.bookingDate), 'MMM yyyy') : 'Unknown';
      if (!monthMap[monthKey]) monthMap[monthKey] = { profit: 0, supplierCost: 0 };
      monthMap[monthKey].profit += b.profit || 0;
      monthMap[monthKey].supplierCost += b.supplierCost || 0;
    });
    const profitVsCost = Object.entries(monthMap)
      .map(([month, data]) => ({ month, profit: Math.round(data.profit), supplierCost: Math.round(data.supplierCost) }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return { revenueOverTime, revenueByMarketplace, revenueByDestination, revenueByCategory, profitVsCost };
  }, [bookings]);

  if (bookings.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Revenue Over Time */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Revenue Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={revenueChartConfig} className="h-[240px] w-full">
            <AreaChart data={revenueOverTime} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#fillRevenue)" strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Revenue by Marketplace */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            Revenue by Marketplace
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={marketplaceChartConfig} className="h-[240px] w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
              <Pie
                data={revenueByMarketplace}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
              >
                {revenueByMarketplace.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={MARKETPLACE_CHART_COLORS[idx % MARKETPLACE_CHART_COLORS.length]} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="name" />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Revenue by Destination */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Revenue by Destination
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ revenue: { label: 'Revenue', color: '#8b5cf6' } }} className="h-[240px] w-full">
            <BarChart data={revenueByDestination} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="destination" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={80} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Revenue by Category */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            Revenue by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ revenue: { label: 'Revenue', color: '#f59e0b' } }} className="h-[240px] w-full">
            <BarChart data={revenueByCategory} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="category" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Profit vs Cost */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            Profit vs Supplier Cost
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={revenueChartConfig} className="h-[240px] w-full">
            <BarChart data={profitVsCost} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="profit" stackId="stack" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={20} />
              <Bar dataKey="supplierCost" stackId="stack" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────────
// Filter Bar
// ──────────────────────────────────────────────

function FilterBar({
  filters,
  onFilterChange,
  availableDestinations,
  activeFilterCount,
  onClearAll,
}: {
  filters: FilterState;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  availableDestinations: string[];
  activeFilterCount: number;
  onClearAll: () => void;
}) {
  const [datePickerOpen, setDatePickerOpen] = useState<'from' | 'to' | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customer, tour name..."
            className="pl-9 h-9"
            value={filters.search}
            onChange={e => onFilterChange('search', e.target.value)}
          />
          {filters.search && (
            <button
              className="absolute right-2.5 top-1/2 -translate-y-1/2"
              onClick={() => onFilterChange('search', '')}
            >
              <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {/* Status */}
        <Select
          value={filters.status || '__all__'}
          onValueChange={v => onFilterChange('status', v === '__all__' ? '' : v)}
        >
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(s => (
              <SelectItem key={s.value || '__all__'} value={s.value || '__all__'}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Marketplace */}
        <Select
          value={filters.marketplace || '__all__'}
          onValueChange={v => onFilterChange('marketplace', v === '__all__' ? '' : v)}
        >
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Marketplace" />
          </SelectTrigger>
          <SelectContent>
            {MARKETPLACE_OPTIONS.map(m => (
              <SelectItem key={m.value || '__all__'} value={m.value || '__all__'}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Destination */}
        {availableDestinations.length > 0 && (
          <Select
            value={filters.destination || '__all__'}
            onValueChange={v => onFilterChange('destination', v === '__all__' ? '' : v)}
          >
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Destination" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Destinations</SelectItem>
              {availableDestinations.map(d => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Date From */}
        <Popover open={datePickerOpen === 'from'} onOpenChange={open => setDatePickerOpen(open ? 'from' : null)}>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn('h-9 justify-start text-left font-normal', filters.dateFrom && 'text-foreground')}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateFrom ? format(filters.dateFrom, 'MMM dd, yyyy') : 'From'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.dateFrom}
              onSelect={d => {
                onFilterChange('dateFrom', d);
                setDatePickerOpen(null);
              }}
              initialFocus
            />
            {filters.dateFrom && (
              <div className="border-t p-2">
                <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => onFilterChange('dateFrom', undefined)}>
                  Clear date
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Date To */}
        <Popover open={datePickerOpen === 'to'} onOpenChange={open => setDatePickerOpen(open ? 'to' : null)}>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn('h-9 justify-start text-left font-normal', filters.dateTo && 'text-foreground')}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateTo ? format(filters.dateTo, 'MMM dd, yyyy') : 'To'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.dateTo}
              onSelect={d => {
                onFilterChange('dateTo', d);
                setDatePickerOpen(null);
              }}
              initialFocus
            />
            {filters.dateTo && (
              <div className="border-t p-2">
                <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => onFilterChange('dateTo', undefined)}>
                  Clear date
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Filter count & clear */}
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="h-6 px-2 text-[10px]">
            <Filter className="h-3 w-3 mr-1" />
            {activeFilterCount}
          </Badge>
        )}

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={onClearAll}>
            <X className="h-3.5 w-3.5 mr-1" />
            Clear all
          </Button>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Pagination
// ──────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
}) {
  const getVisiblePages = useCallback(() => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('ellipsis');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  }, [page, totalPages]);

  const fromItem = (page - 1) * pageSize + 1;
  const toItem = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          Showing {fromItem} to {toItem} of {total} bookings
        </span>
        <span className="text-border">|</span>
        <Select
          value={String(pageSize)}
          onValueChange={v => onPageSizeChange(Number(v))}
        >
          <SelectTrigger className="h-7 w-[70px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map(s => (
              <SelectItem key={s} value={String(s)} className="text-xs">
                {s} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {getVisiblePages().map((p, idx) =>
          p === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground">
              ...
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? 'default' : 'outline'}
              size="icon"
              className="h-8 w-8 text-xs"
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          )
        )}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// New Booking Dialog
// ──────────────────────────────────────────────

function NewBookingDialog({
  open,
  onClose,
  tours,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  tours: { id: string; tourName: string; destinationCity: string }[];
  onSubmit: (data: NewBookingForm) => Promise<void>;
}) {
  const [form, setForm] = useState<NewBookingForm>({
    tourId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    marketplace: '',
    adults: 1,
    children: 0,
    tourDate: '',
    totalPrice: 0,
    supplierCost: 0,
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const computedProfit = form.totalPrice - form.supplierCost;

  const updateForm = (field: keyof NewBookingForm, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.tourId || !form.customerName) return;
    setSubmitting(true);
    try {
      await onSubmit(form);
      setForm({
        tourId: '',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        marketplace: '',
        adults: 1,
        children: 0,
        tourDate: '',
        totalPrice: 0,
        supplierCost: 0,
        notes: '',
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            New Booking
          </DialogTitle>
          <DialogDescription>Create a new booking record for a tour.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Tour Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tour *</Label>
            <Select value={form.tourId} onValueChange={v => updateForm('tourId', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a tour" />
              </SelectTrigger>
              <SelectContent>
                {tours.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    <span className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {t.tourName} — {t.destinationCity}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-sm font-medium">Customer Name *</Label>
              <Input
                value={form.customerName}
                onChange={e => updateForm('customerName', e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email</Label>
              <Input
                type="email"
                value={form.customerEmail}
                onChange={e => updateForm('customerEmail', e.target.value)}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Phone</Label>
              <Input
                value={form.customerPhone}
                onChange={e => updateForm('customerPhone', e.target.value)}
                placeholder="+1 234 567 890"
              />
            </div>
          </div>

          {/* Marketplace & Guests */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Marketplace</Label>
              <Select value={form.marketplace} onValueChange={v => updateForm('marketplace', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {MARKETPLACE_OPTIONS.filter(m => m.value).map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Adults</Label>
              <Input
                type="number"
                min={1}
                value={form.adults}
                onChange={e => updateForm('adults', parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Children</Label>
              <Input
                type="number"
                min={0}
                value={form.children}
                onChange={e => updateForm('children', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Tour Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tour Date</Label>
            <Input
              type="date"
              value={form.tourDate}
              onChange={e => updateForm('tourDate', e.target.value)}
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Total Price ($)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={form.totalPrice || ''}
                onChange={e => updateForm('totalPrice', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Supplier Cost ($)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={form.supplierCost || ''}
                onChange={e => updateForm('supplierCost', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Auto-calculated profit */}
          <div className="rounded-lg border bg-muted/30 p-3 flex items-center justify-between">
            <span className="text-sm font-medium">Estimated Profit</span>
            <span className={cn('text-lg font-bold', computedProfit >= 0 ? 'text-emerald-600' : 'text-red-500')}>
              {formatCurrency(computedProfit)}
            </span>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Notes</Label>
            <Textarea
              value={form.notes}
              onChange={e => updateForm('notes', e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!form.tourId || !form.customerName || submitting}>
            {submitting ? 'Creating...' : 'Create Booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


// ──────────────────────────────────────────────
// Main BookingsPage Component
// ──────────────────────────────────────────────

export default function BookingsPage() {
  // ── Data State ──
  const [data, setData] = useState<BookingsApiResponse | null>(null);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Filter State ──
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  // ── Pagination State ──
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // ── Sort State ──
  const [sortField, setSortField] = useState<SortField>('bookingDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // ── Dialog States ──
  const [newBookingOpen, setNewBookingOpen] = useState(false);

  // ── Available Tours (for new booking) ──
  const [availableTours, setAvailableTours] = useState<{ id: string; tourName: string; destinationCity: string }[]>([]);

  // ── Debounce ref ──
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ── Available Destinations ──
  const availableDestinations = useMemo(() => {
    const dests = new Set<string>();
    allBookings.forEach(b => {
      if (b.tour?.destinationCity) dests.add(b.tour.destinationCity);
    });
    return Array.from(dests).sort();
  }, [allBookings]);

  // ── Active filter count ──
  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  // ── Fetch bookings ──
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.status) params.set('status', filters.status);
      if (filters.marketplace) params.set('marketplace', filters.marketplace);
      if (filters.destination) params.set('destination', filters.destination);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom.toISOString());
      if (filters.dateTo) params.set('dateTo', filters.dateTo.toISOString());
      params.set('page', String(page));
      params.set('limit', String(pageSize));

      const response = await fetch(`/api/bookings?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch bookings');
      const result = await response.json();
      setData(result);
      // Store all bookings for chart calculations (use high limit)
      const allParams = new URLSearchParams();
      if (filters.search) allParams.set('search', filters.search);
      if (filters.status) allParams.set('status', filters.status);
      if (filters.marketplace) allParams.set('marketplace', filters.marketplace);
      if (filters.destination) allParams.set('destination', filters.destination);
      if (filters.dateFrom) allParams.set('dateFrom', filters.dateFrom.toISOString());
      if (filters.dateTo) allParams.set('dateTo', filters.dateTo.toISOString());
      allParams.set('page', '1');
      allParams.set('limit', '1000');

      const allResponse = await fetch(`/api/bookings?${allParams.toString()}`);
      if (allResponse.ok) {
        const allResult = await allResponse.json();
        setAllBookings(allResult.bookings || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  // ── Fetch available tours ──
  const fetchTours = useCallback(async () => {
    try {
      const response = await fetch('/api/tours?limit=1000');
      if (response.ok) {
        const result = await response.json();
        setAvailableTours((result.tours || []).map((t: { id: string; tourName: string; destinationCity: string }) => ({
          id: t.id,
          tourName: t.tourName,
          destinationCity: t.destinationCity,
        })));
      }
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  // ── Filter change with debounce for search ──
  const handleFilterChange = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (key === 'search') {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setPage(1);
      }, 300);
    } else {
      setPage(1);
    }
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
  }, []);

  // ── Sort handler ──
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }, [sortField]);

  // ── Sorted bookings ──
  const sortedBookings = useMemo(() => {
    if (!data?.bookings) return [];
    return [...data.bookings].sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      switch (sortField) {
        case 'customerName':
          aVal = (a.customerName || '').toLowerCase();
          bVal = (b.customerName || '').toLowerCase();
          break;
        case 'totalPrice':
          aVal = a.totalPrice || 0;
          bVal = b.totalPrice || 0;
          break;
        case 'profit':
          aVal = a.profit || 0;
          bVal = b.profit || 0;
          break;
        case 'bookingDate':
          aVal = new Date(a.bookingDate).getTime();
          bVal = new Date(b.bookingDate).getTime();
          break;
        case 'tourDate':
          aVal = a.tourDate ? new Date(a.tourDate).getTime() : 0;
          bVal = b.tourDate ? new Date(b.tourDate).getTime() : 0;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'marketplace':
          aVal = a.marketplace || '';
          bVal = b.marketplace || '';
          break;
        case 'adults':
          aVal = a.adults;
          bVal = b.adults;
          break;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data?.bookings, sortField, sortOrder]);

  // ── New booking submit ──
  const handleNewBooking = useCallback(async (formData: NewBookingForm) => {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tourId: formData.tourId,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail || null,
        customerPhone: formData.customerPhone || null,
        marketplace: formData.marketplace || null,
        adults: formData.adults,
        children: formData.children,
        totalPrice: formData.totalPrice,
        supplierCost: formData.supplierCost || 0,
        tourDate: formData.tourDate ? new Date(formData.tourDate).toISOString() : null,
        notes: formData.notes || null,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create booking');
    }

    await fetchBookings();
  }, [fetchBookings]);

  // ── Update booking ──
  const handleUpdateBooking = useCallback(async (id: string, updateData: Partial<Booking>) => {
    const response = await fetch('/api/bookings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updateData }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to update booking');
    }

    // Refresh data after update
    await fetchBookings();
  }, [fetchBookings]);

  // ── Export CSV ──
  const handleExport = useCallback(() => {
    if (sortedBookings.length > 0) {
      exportToCSV(sortedBookings);
    }
  }, [sortedBookings]);

  // ── Sort header component ──
  const SortableHeader = useCallback(({ field, children }: { field: SortField; children: React.ReactNode }) => {
    const isActive = sortField === field;
    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn('h-8 px-2 text-xs font-medium -ml-2', isActive && 'text-foreground')}
        onClick={() => handleSort(field)}
      >
        {children}
        <ArrowUpRight
          className={cn(
            'ml-1 h-3 w-3 transition-transform',
            isActive ? 'opacity-100' : 'opacity-0',
            isActive && sortOrder === 'desc' && 'rotate-180',
          )}
        />
      </Button>
    );
  }, [sortField, sortOrder, handleSort]);

  // ──────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          <div>
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Bookings & Revenue
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage bookings, track revenue, and analyze performance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} disabled={sortedBookings.length === 0}>
              <Download className="h-4 w-4 mr-1.5" />
              Export CSV
            </Button>
            <Button size="sm" onClick={() => setNewBookingOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              New Booking
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6 p-4 lg:px-6">
        {/* Loading State */}
        {loading && !data && <LoadingSkeleton />}

        {/* Error State */}
        {!loading && error && <ErrorState message={error} />}

        {/* Empty State */}
        {!loading && !error && data && data.bookings.length === 0 && (
          <EmptyState onClear={clearFilters} />
        )}

        {/* Main Content */}
        {data && data.bookings.length > 0 && (
          <>
            {/* Revenue Summary Cards */}
            <RevenueSummaryCards bookings={allBookings} />

            {/* Tabs: Charts & Table */}
            <Tabs defaultValue="table" className="space-y-4">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="table">
                    <ShoppingCart className="h-4 w-4 mr-1.5" />
                    Bookings
                  </TabsTrigger>
                  <TabsTrigger value="charts">
                    <BarChart3 className="h-4 w-4 mr-1.5" />
                    Analytics
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Filters (always visible) */}
              <FilterBar
                filters={filters}
                onFilterChange={handleFilterChange}
                availableDestinations={availableDestinations}
                activeFilterCount={activeFilterCount}
                onClearAll={clearFilters}
              />

              {/* Table Tab */}
              <TabsContent value="table" className="space-y-0">
                <Card className="overflow-hidden">
                  <div className="max-h-[60vh] overflow-y-auto table-scroll">
                    <Table>
                      <TableHeader className="sticky top-0 z-10 bg-muted/50 backdrop-blur">
                        <TableRow>
                          <TableHead className="w-[80px]">
                            <SortableHeader field="bookingDate">Date</SortableHeader>
                          </TableHead>
                          <TableHead className="min-w-[140px]">
                            <SortableHeader field="customerName">Customer</SortableHeader>
                          </TableHead>
                          <TableHead className="min-w-[160px]">Tour</TableHead>
                          <TableHead className="min-w-[100px]">Destination</TableHead>
                          <TableHead className="min-w-[100px]">
                            <SortableHeader field="marketplace">Marketplace</SortableHeader>
                          </TableHead>
                          <TableHead className="w-[60px] text-right">
                            <SortableHeader field="adults">Adt</SortableHeader>
                          </TableHead>
                          <TableHead className="w-[60px] text-right">Chd</TableHead>
                          <TableHead className="w-[100px] text-right">
                            <SortableHeader field="totalPrice">Total</SortableHeader>
                          </TableHead>
                          <TableHead className="w-[100px] text-right">Cost</TableHead>
                          <TableHead className="w-[100px] text-right">
                            <SortableHeader field="profit">Profit</SortableHeader>
                          </TableHead>
                          <TableHead className="w-[90px]">
                            <SortableHeader field="status">Status</SortableHeader>
                          </TableHead>
                          <TableHead className="w-[60px] text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedBookings.map(booking => (
                          <TableRow
                            key={booking.id}
                            className="hover:bg-muted/50 transition-colors"
                          >
                            <TableCell className="text-xs text-muted-foreground">
                              {formatDate(booking.bookingDate)}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium truncate max-w-[140px]">{booking.customerName}</p>
                                {booking.customerEmail && (
                                  <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">{booking.customerEmail}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm truncate max-w-[160px]" title={booking.tour?.tourName}>
                                {booking.tour?.tourName || '-'}
                              </p>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {booking.tour?.destinationCity || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', getMarketplaceBadgeClasses(booking.marketplace))}>
                                {booking.marketplace || 'Direct'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-sm">{booking.adults}</TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">{booking.children || 0}</TableCell>
                            <TableCell className="text-right text-sm font-medium">
                              {formatCurrency(booking.totalPrice)}
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              {formatCurrency(booking.supplierCost)}
                            </TableCell>
                            <TableCell className="text-right text-sm font-medium">
                              <span className={cn((booking.profit || 0) >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                                {formatCurrency(booking.profit)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', getStatusBadgeClasses(booking.status))}>
                                {getStatusIcon(booking.status)}
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-[10px] text-muted-foreground font-mono">
                                #{booking.id.slice(-6)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="border-t px-4">
                    <Pagination
                      page={page}
                      totalPages={data.totalPages}
                      total={data.total}
                      pageSize={pageSize}
                      onPageChange={setPage}
                      onPageSizeChange={s => { setPageSize(s); setPage(1); }}
                    />
                  </div>
                </Card>
              </TabsContent>

              {/* Charts Tab */}
              <TabsContent value="charts" className="space-y-0">
                <RevenueCharts bookings={allBookings} />
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Loading overlay for subsequent loads */}
        {loading && data && (
          <div className="fixed inset-0 z-40 bg-background/30 backdrop-blur-sm flex items-center justify-center">
            <div className="rounded-lg border bg-card p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm font-medium">Loading...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Booking Dialog */}
      <NewBookingDialog
        open={newBookingOpen}
        onClose={() => setNewBookingOpen(false)}
        tours={availableTours}
        onSubmit={handleNewBooking}
      />

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .table-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .table-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .table-scroll::-webkit-scrollbar-thumb {
          background-color: hsl(var(--border));
          border-radius: 3px;
        }
        .table-scroll::-webkit-scrollbar-thumb:hover {
          background-color: hsl(var(--muted-foreground) / 0.5);
        }
      `}</style>
    </div>
  );
}
