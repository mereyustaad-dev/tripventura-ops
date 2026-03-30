'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
  Plane,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Percent,
  Globe,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Users,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardKPIs {
  totalTours: number
  activeTours: number
  totalBookings: number
  totalRevenue: number
  totalProfit: number
  avgOrderValue: number
  avgSupplierPrice: number
  manualBookings: number
  toursWithWebsitePrice: number
  profitMargin: number
}

interface DestinationStat {
  destinationCity: string
  _count: number
}

interface CategoryStat {
  category: string
  _count: number
}

interface MarketplaceStat {
  marketplace: string
  _count: number
  _sum: { totalPrice: number | null; profit: number | null }
}

interface TopTour {
  tourId: string
  tourName: string | null
  destinationCity: string | null
  category: string | null
  _count: number
  _sum: { totalPrice: number | null; profit: number | null }
}

interface RecentBooking {
  id: string
  customerName: string
  totalPrice: number
  status: string
  marketplace: string
  bookingDate: string
  tour: { tourName: string; destinationCity: string; category: string } | null
}

interface PricingSummaryItem {
  tourName: string
  destinationCity: string | null
  supplierPriceAdult: number | null
  websitePrice: number | null
  viatorPrice: number | null
  ctripPrice: number | null
  klookPrice: number | null
  expeditionPrice: number | null
  civitatisPrice: number | null
  headoutPrice: number | null
}

interface AvailabilityStat {
  availabilityDay: string
  _count: number
}

interface ListingCoverage {
  website: number
  ctrip: number
  viator: number
  klook: number
  expedition: number
  headout: number
  civitatis: number
}

interface DashboardData {
  kpis: DashboardKPIs
  destinations: DestinationStat[]
  categories: CategoryStat[]
  totalListings: number
  marketplaceDistribution: MarketplaceStat[]
  topTours: TopTour[]
  recentBookings: RecentBooking[]
  pricingSummary: PricingSummaryItem[]
  availabilityStats: AvailabilityStat[]
  listingCoverage: ListingCoverage
  totalListings: number
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CHART_COLORS = [
  'oklch(0.55 0.24 25)',  // chart-1 red
  'oklch(0.75 0.18 85)',  // chart-2 gold
  'oklch(0.55 0.15 165)', // chart-3 teal
  'oklch(0.65 0.12 280)', // chart-4 purple
  'oklch(0.6 0.2 45)',    // chart-5 orange
  'oklch(0.7 0.1 330)',   // pink
  'oklch(0.65 0.18 55)',  // amber
]

const MARKETPLACE_COLORS: Record<string, string> = {
  website: CHART_COLORS[0],
  ctrip: CHART_COLORS[1],
  viator: CHART_COLORS[2],
  klook: CHART_COLORS[3],
  expedition: CHART_COLORS[4],
  headout: CHART_COLORS[5],
  civitatis: CHART_COLORS[6],
}

const MARKETPLACE_LABELS: Record<string, string> = {
  website: 'Website',
  ctrip: 'Ctrip',
  viator: 'Viator',
  klook: 'Klook',
  expedition: 'Expedition',
  headout: 'Headout',
  civitatis: 'Civitatis',
}

const BOOKING_STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  completed: 'bg-blue-100 text-blue-700 border-blue-200',
}

const MARKETPLACE_BADGE_COLORS: Record<string, string> = {
  website: 'bg-chart-1/10 text-chart-1 border-chart-1/20',
  ctrip: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  viator: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  klook: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  expedition: 'bg-chart-5/10 text-chart-5 border-chart-5/20',
  headout: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  civitatis: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
}

// ─── Chart Configs ───────────────────────────────────────────────────────────

const marketplaceConfig: ChartConfig = {
  website: { label: 'Website', color: CHART_COLORS[0] },
  ctrip: { label: 'Ctrip', color: CHART_COLORS[1] },
  viator: { label: 'Viator', color: CHART_COLORS[2] },
  klook: { label: 'Klook', color: CHART_COLORS[3] },
  expedition: { label: 'Expedition', color: CHART_COLORS[4] },
  headout: { label: 'Headout', color: CHART_COLORS[5] },
  civitatis: { label: 'Civitatis', color: CHART_COLORS[6] },
}

const destinationConfig: ChartConfig = {
  tours: { label: 'Tours', color: 'oklch(0.55 0.24 25)' },
}

const categoryConfig: ChartConfig = {
  tours: { label: 'Tours', color: 'oklch(0.55 0.15 165)' },
}

// ─── Helper Functions ────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getCoverageColor(percentage: number): string {
  if (percentage > 70) return 'text-emerald-600'
  if (percentage >= 30) return 'text-amber-600'
  return 'text-red-500'
}

function getCoverageBarColor(percentage: number): string {
  if (percentage > 70) return 'bg-emerald-500'
  if (percentage >= 30) return 'bg-amber-500'
  return 'bg-red-500'
}

// ─── KPI Card Definitions ────────────────────────────────────────────────────

interface KPICardDef {
  key: keyof DashboardKPIs
  label: string
  icon: React.ElementType
  format: 'number' | 'currency' | 'percent'
  trend: number
  colorClass: string
  iconBgClass: string
}

function getKPICards(kpis: DashboardKPIs): KPICardDef[] {
  return [
    {
      key: 'totalTours',
      label: 'Total Tours',
      icon: Plane,
      format: 'number',
      trend: 0,
      colorClass: 'text-foreground',
      iconBgClass: 'bg-chart-1/10 text-chart-1',
    },
    {
      key: 'totalBookings',
      label: 'Sheet Bookings',
      icon: CalendarCheck,
      format: 'number',
      trend: 0,
      colorClass: 'text-foreground',
      iconBgClass: 'bg-chart-3/10 text-chart-3',
    },
    {
      key: 'totalRevenue',
      label: 'Sheet Revenue',
      icon: DollarSign,
      format: 'currency',
      trend: 0,
      colorClass: 'text-foreground',
      iconBgClass: 'bg-chart-2/10 text-chart-2',
    },
    {
      key: 'avgOrderValue',
      label: 'Avg Website Price',
      icon: BarChart3,
      format: 'currency',
      trend: 0,
      colorClass: 'text-foreground',
      iconBgClass: 'bg-chart-4/10 text-chart-4',
    },
    {
      key: 'avgSupplierPrice',
      label: 'Avg Supplier Cost',
      icon: TrendingDown,
      format: 'currency',
      trend: 0,
      colorClass: 'text-foreground',
      iconBgClass: 'bg-orange-500/10 text-orange-600',
    },
    {
      key: 'toursWithWebsitePrice',
      label: 'Tours with Price',
      icon: Percent,
      format: 'number',
      trend: 0,
      colorClass: 'text-foreground',
      iconBgClass: 'bg-chart-5/10 text-chart-5',
    },
  ]
}

function formatKPIValue(value: number, format: 'number' | 'currency' | 'percent'): string {
  switch (format) {
    case 'currency':
      return formatCurrency(value)
    case 'percent':
      return `${value.toFixed(1)}%`
    case 'number':
    default:
      return formatNumber(value)
  }
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

/** KPI Skeleton Cards */
function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="py-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-7 w-24 mb-1" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/** KPI Cards Row */
function KPICards({ kpis }: { kpis: DashboardKPIs }) {
  const cards = getKPICards(kpis)

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {cards.map((card, index) => {
        const Icon = card.icon
        const value = kpis[card.key]
        const safeValue = value != null && !isNaN(value) ? value : 0
        const isPositive = card.trend >= 0

        return (
          <Card
            key={card.key}
            className="card-hover animate-fade-in py-4"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`rounded-lg p-2 ${card.iconBgClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div
                  className={`flex items-center gap-0.5 text-xs font-medium ${
                    isPositive ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {isPositive ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(card.trend)}%
                </div>
              </div>
              <div className={`text-2xl font-bold tracking-tight animate-count-up ${card.colorClass}`}>
                {formatKPIValue(safeValue, card.format)}
              </div>
              <p className="text-muted-foreground text-xs mt-0.5">{card.label}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

/** Chart Skeleton */
function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-56" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}

/** Destination Distribution Bar Chart */
function DestinationRevenueChart({ data, total }: { data: (DestinationStat & { revenue?: number })[]; total: number }) {
  const chartData = data
    .slice(0, 8)
    .map((d) => ({
      name: d.destinationCity || 'Unknown',
      tours: d._count,
      fill: `oklch(${55 + (d._count / (data[0]?._count || 1)) * 30} 0.2 25)`,
    }))

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Tours by Destination</CardTitle>
        </div>
        <CardDescription>{data.length} destinations, {total} total tours</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{ tours: { label: 'Tours' } }} className="h-[280px] w-full">
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="tours" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

/** Marketplace Distribution Pie Chart */
function MarketplaceDistributionChart({ data }: { data: MarketplaceStat[] }) {
  if (!data.length) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Marketplace Distribution</CardTitle>
          <CardDescription>Bookings by marketplace</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
            No marketplace data available
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((item) => ({
    name: MARKETPLACE_LABELS[item.marketplace?.toLowerCase()] || item.marketplace || '',
    value: item._count,
    revenue: item._sum.totalPrice || 0,
    fill: MARKETPLACE_COLORS[item.marketplace?.toLowerCase()] || CHART_COLORS[0],
  }))

  const totalBookings = chartData.reduce((sum, d) => sum + d.value, 0)

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Marketplace Distribution</CardTitle>
        </div>
        <CardDescription>Bookings breakdown by platform</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={marketplaceConfig} className="h-[300px] w-full">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
              strokeWidth={0}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, item, index, payload) => (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-muted-foreground">{name}</span>
                      <span className="font-medium text-foreground">
                        {Number(value).toLocaleString()} bookings
                      </span>
                      {payload?.payload?.revenue > 0 && (
                        <span className="text-muted-foreground text-xs">
                          {formatCurrency(payload.payload.revenue)} revenue
                        </span>
                      )}
                    </div>
                  )}
                />
              }
            />
            <Legend
              content={({ payload }) => {
                if (!payload?.length) return null
                return (
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-2">
                    {payload.map((entry, index) => {
                      const dataItem = chartData[index]
                      const pct = dataItem ? ((dataItem.value / totalBookings) * 100).toFixed(1) : 0
                      return (
                        <div key={entry.value} className="flex items-center gap-1.5 text-xs">
                          <div
                            className="h-2 w-2 shrink-0 rounded-[2px]"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-muted-foreground">{entry.value}</span>
                          <span className="font-medium">{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                )
              }}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

/** Top Performing Tours Table */
function TopToursTable({ data }: { data: TopTour[] }) {
  if (!data.length) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Top Performing Tours</CardTitle>
          </div>
          <CardDescription>Ranked by number of bookings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
            No tour data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Top Performing Tours</CardTitle>
        </div>
        <CardDescription>Ranked by number of bookings</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[380px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">#</TableHead>
                <TableHead>Tour Name</TableHead>
                <TableHead className="hidden md:table-cell">Destination</TableHead>
                <TableHead className="text-right">Bookings</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Revenue</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((tour, index) => (
                <TableRow key={tour.tourId}>
                  <TableCell className="pl-6">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-medium">
                      {index + 1}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm truncate max-w-[180px]">
                        {tour.tourName || 'Unnamed Tour'}
                      </div>
                      <div className="text-muted-foreground text-xs md:hidden">
                        {tour.destinationCity || 'N/A'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                      <MapPin className="h-3 w-3" />
                      {tour.destinationCity || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className="font-mono">
                      {formatNumber(tour._count)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right hidden sm:table-cell font-mono text-sm">
                    {formatCurrency(tour._sum.totalPrice || 0)}
                  </TableCell>
                  <TableCell className="text-right hidden lg:table-cell font-mono text-sm text-emerald-600">
                    {formatCurrency(tour._sum.profit || 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

/** Destination Distribution Bar Chart */
function DestinationChart({ data }: { data: DestinationStat[] }) {
  if (!data.length) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Destination Distribution</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
            No destination data available
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.slice(0, 10).map((item) => ({
    name: item.destinationCity || 'Unknown',
    tours: item._count,
  }))

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Destination Distribution</CardTitle>
        </div>
        <CardDescription>Tours per destination city</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={destinationConfig} className="h-[250px] w-full">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 10, left: 80, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              width={75}
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="tours" radius={[0, 4, 4, 0]} barSize={18}>
              {chartData.map((_, index) => (
                <Cell
                  key={`dest-cell-${index}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

/** Category Breakdown Horizontal Bar Chart */
function CategoryChart({ data }: { data: CategoryStat[] }) {
  if (!data.length) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Category Breakdown</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
            No category data available
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.slice(0, 8).map((item) => ({
    name: item.category || 'Unknown',
    tours: item._count,
  }))

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Category Breakdown</CardTitle>
        </div>
        <CardDescription>Tours grouped by category</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={categoryConfig} className="h-[250px] w-full">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 10, left: 90, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              width={85}
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="tours" radius={[0, 4, 4, 0]} barSize={18} fill="oklch(0.55 0.15 165)" fillOpacity={0.85} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

/** Recent Bookings Table */
function RecentBookingsTable({ data }: { data: RecentBooking[] }) {
  if (!data.length) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Recent Bookings</CardTitle>
          </div>
          <CardDescription>Latest booking activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
            No recent bookings
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Recent Bookings</CardTitle>
        </div>
        <CardDescription>Latest booking activity</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[380px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Customer</TableHead>
                <TableHead>Tour</TableHead>
                <TableHead className="hidden md:table-cell">Marketplace</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Status</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="pl-6">
                    <div className="font-medium text-sm">{booking.customerName}</div>
                    <div className="text-muted-foreground text-xs md:hidden">
                      {MARKETPLACE_LABELS[booking.marketplace?.toLowerCase()] || booking.marketplace}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm truncate max-w-[160px]">
                      {booking.tour?.tourName || 'Unknown Tour'}
                    </div>
                    <div className="text-muted-foreground text-xs hidden md:block">
                      {booking.tour?.destinationCity || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        MARKETPLACE_BADGE_COLORS[booking.marketplace?.toLowerCase()] || 'border-border'
                      }`}
                    >
                      {MARKETPLACE_LABELS[booking.marketplace?.toLowerCase()] || booking.marketplace}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-medium">
                    {formatCurrency(booking.totalPrice)}
                  </TableCell>
                  <TableCell className="text-center hidden sm:table-cell">
                    <Badge
                      variant="outline"
                      className={`text-xs capitalize ${
                        BOOKING_STATUS_COLORS[booking.status?.toLowerCase()] || 'border-border'
                      }`}
                    >
                      {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right hidden lg:table-cell text-muted-foreground text-xs">
                    {formatFullDate(booking.bookingDate)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

/** Marketplace Coverage Section */
function MarketplaceCoverage({
  coverage,
  totalListings,
}: {
  coverage: ListingCoverage
  totalListings: number
}) {
  const platforms = [
    { key: 'website' as const, label: 'Website', icon: Globe },
    { key: 'ctrip' as const, label: 'Ctrip', icon: Globe },
    { key: 'viator' as const, label: 'Viator', icon: Globe },
    { key: 'klook' as const, label: 'Klook', icon: Globe },
    { key: 'expedition' as const, label: 'Expedition', icon: Globe },
    { key: 'headout' as const, label: 'Headout', icon: Globe },
    { key: 'civitatis' as const, label: 'Civitatis', icon: Globe },
  ]

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Marketplace Coverage</CardTitle>
        </div>
        <CardDescription>
          Tour listings distribution across {formatNumber(totalListings)} total tours
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {platforms.map((platform) => {
            const count = coverage[platform.key]
            const percentage = totalListings > 0 ? (count / totalListings) * 100 : 0
            const Icon = platform.icon

            return (
              <div
                key={platform.key}
                className="rounded-lg border p-4 bg-card transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{platform.label}</span>
                  </div>
                  <span className={`text-sm font-bold ${getCoverageColor(percentage)}`}>
                    {percentage.toFixed(0)}%
                  </span>
                </div>
                <Progress value={percentage} className={`h-2 mb-2 ${getCoverageBarColor(percentage)}`} />
                <p className="text-xs text-muted-foreground">
                  {formatNumber(count)} of {formatNumber(totalListings)} tours listed
                </p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

/** Availability Overview Section */
function AvailabilityOverview({ data }: { data: AvailabilityStat[] }) {
  if (!data.length) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Availability Overview</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[150px] text-muted-foreground text-sm">
            No availability data
          </div>
        </CardContent>
      </Card>
    )
  }

  const sortedData = [...data].sort((a, b) => b._count - a._count)
  const totalTours = data.reduce((sum, d) => sum + d._count, 0)

  const availabilityColors: Record<string, string> = {
    'Every day': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Specific days': 'bg-blue-100 text-blue-700 border-blue-200',
    'Ask availability': 'bg-amber-100 text-amber-700 border-amber-200',
  }

  const availabilityIcons: Record<string, string> = {
    'Every day': '🟢',
    'Specific days': '🔵',
    'Ask availability': '🟡',
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Availability Overview</CardTitle>
        </div>
        <CardDescription>Tours grouped by availability type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {sortedData.map((item) => {
            const type = item.availabilityDay || 'Unknown'
            const count = item._count
            const percentage = totalTours > 0 ? (count / totalTours) * 100 : 0
            const colorClass = availabilityColors[type] || 'bg-gray-100 text-gray-700 border-gray-200'
            const icon = availabilityIcons[type] || '⚪'

            return (
              <div key={type} className="rounded-lg border p-4 bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{icon}</span>
                  <span className="text-sm font-medium capitalize">{type}</span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-bold">{formatNumber(count)}</div>
                    <p className="text-xs text-muted-foreground mt-0.5">tours</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {percentage.toFixed(1)}%
                  </Badge>
                </div>
                <Progress value={percentage} className="h-1.5 mt-3" />
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${colorClass}`}
                  >
                    {type}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

/** Full Loading Skeleton */
function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-56 mb-1" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
      <KPISkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <ChartSkeleton />
      <ChartSkeleton />
    </div>
  )
}

/** Error State */
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="max-w-md w-full">
        <CardContent className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="font-semibold mb-1">Failed to load dashboard</h3>
          <p className="text-muted-foreground text-sm mb-4">{message}</p>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main Dashboard Page ─────────────────────────────────────────────────────

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true)
      else setLoading(true)
      setError(null)

      const response = await fetch('/api/dashboard')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      setData(result)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true)
    }, 60000)

    return () => clearInterval(interval)
  }, [fetchData])

  if (loading && !data) {
    return <DashboardSkeleton />
  }

  if (error && !data) {
    return <ErrorState message={error} onRetry={() => fetchData()} />
  }

  if (!data) {
    return null
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight gradient-text">
            Tripventura Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time tour operations overview
            {lastUpdated && (
              <span className="ml-2">
                &middot; Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Section 1: KPI Cards */}
      <KPICards kpis={data.kpis} />

      {/* Section 2: Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DestinationRevenueChart data={data.destinations} total={data.totalListings} />
        <MarketplaceDistributionChart data={data.marketplaceDistribution} />
      </div>

      {/* Section 3: Data Grid Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopToursTable data={data.topTours} />
        <RecentBookingsTable data={data.recentBookings} />
      </div>

      {/* Section 3b: Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DestinationChart data={data.destinations} />
        <CategoryChart data={data.categories} />
      </div>

      {/* Section 4: Marketplace Coverage */}
      <MarketplaceCoverage coverage={data.listingCoverage} totalListings={data.totalListings} />

      {/* Section 5: Availability Overview */}
      <AvailabilityOverview data={data.availabilityStats} />
    </div>
  )
}
