'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  MapPin,
  Tag,
  Info,
  Filter,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Cell,
  Legend,
  ScatterChart,
  Scatter,
  ResponsiveContainer,
  PieChart,
  Pie,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip'

// ─── Types ───────────────────────────────────────────────────────────────────

interface TourData {
  id: string
  tourName: string
  destinationCity: string
  category: string | null
  supplierPriceAdult: string | null
  supplierPriceChild: string | null
  websitePrice: string | null
  ctripPrice: string | null
  viatorPrice: string | null
  klookPrice: string | null
  expeditionPrice: string | null
  civitatisPrice: string | null
  headoutPrice: string | null
  tourLinkCtrip: string | null
  tourLinkViator: string | null
  tourLinkHeadout: string | null
  tourLinkKlook: string | null
  tourLinkExpedition: string | null
  tourLinkCivitatis: string | null
  bookings: number
  revenue: string | null
  availabilityDay: string | null
  inclusion: string | null
  websiteLink: string | null
}

interface DashboardData {
  listingCoverage?: {
    website: number
    ctrip: number
    viator: number
    klook: number
    expedition: number
    headout: number
    civitatis: number
  }
  totalListings?: number
}

interface ParsedTour {
  tour: TourData
  supplierPrice: number
  websitePrice: number
  ctripPrice: number
  viatorPrice: number
  klookPrice: number
  expeditionPrice: number
  civitatisPrice: number
  headoutPrice: number
  minPrice: number
  maxPrice: number
  cheapestMarketplace: string
  mostExpensiveMarketplace: string
  prices: { key: string; label: string; price: number; isWebsite: boolean }[]
  profitMargins: {
    key: string
    label: string
    margin: number
    diffFromSupplier: number
  }[]
}

interface DiscrepancyAlert {
  tour: TourData
  type: 'undercut' | 'loss'
  severity: 'critical' | 'warning' | 'info'
  marketplace: string
  ourPrice: number
  marketPrice: number
  diff: number
  diffPercent: number
  message: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MARKETPLACE_KEYS = [
  'website',
  'ctrip',
  'viator',
  'klook',
  'expedition',
  'civitatis',
  'headout',
] as const

const MARKETPLACE_LABELS: Record<string, string> = {
  website: 'Website',
  ctrip: 'Ctrip',
  viator: 'Viator',
  klook: 'Klook',
  expedition: 'Expedition',
  civitatis: 'Civitatis',
  headout: 'Headout',
  supplier: 'Supplier',
}

const MARKETPLACE_COLORS: Record<string, string> = {
  website: 'oklch(0.55 0.24 25)',
  ctrip: 'oklch(0.75 0.18 85)',
  viator: 'oklch(0.55 0.15 165)',
  klook: 'oklch(0.65 0.12 280)',
  expedition: 'oklch(0.6 0.2 45)',
  civitatis: 'oklch(0.65 0.18 55)',
  headout: 'oklch(0.7 0.1 330)',
}

const CHART_COLORS = [
  'oklch(0.55 0.24 25)',
  'oklch(0.75 0.18 85)',
  'oklch(0.55 0.15 165)',
  'oklch(0.65 0.12 280)',
  'oklch(0.6 0.2 45)',
  'oklch(0.7 0.1 330)',
  'oklch(0.65 0.18 55)',
]

// ─── Helper Functions ────────────────────────────────────────────────────────

function parsePriceToNumber(priceStr: string | null | undefined): number {
  if (!priceStr || typeof priceStr !== 'string') return 0
  const trimmed = priceStr.trim().toUpperCase()
  if (
    !trimmed ||
    trimmed === 'NOT SELL' ||
    trimmed === 'N/A' ||
    trimmed === '-' ||
    trimmed === 'LOADING...' ||
    trimmed === '#VALUE!' ||
    trimmed === 'N/A' ||
    trimmed === 'NONE' ||
    trimmed === 'TBD' ||
    trimmed === 'FREE'
  ) {
    return 0
  }
  // Extract numeric portion: handle "400 €URO", "$85.00 USD", "€ 50", "10.50", etc.
  const match = trimmed.match(/[\d]+(?:[.,]\d{1,2})?/)
  if (!match) return 0
  return parseFloat(match[0].replace(',', '.'))
}

function formatCurrency(amount: number): string {
  if (amount === 0) return '€0'
  return `€${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

function getPriceField(key: string): keyof TourData {
  const map: Record<string, keyof TourData> = {
    website: 'websitePrice',
    ctrip: 'ctripPrice',
    viator: 'viatorPrice',
    klook: 'klookPrice',
    expedition: 'expeditionPrice',
    civitatis: 'civitatisPrice',
    headout: 'headoutPrice',
    supplier: 'supplierPriceAdult',
  }
  return map[key] || 'websitePrice'
}

function getLinkField(key: string): keyof TourData {
  const map: Record<string, keyof TourData> = {
    ctrip: 'tourLinkCtrip',
    viator: 'tourLinkViator',
    headout: 'tourLinkHeadout',
    klook: 'tourLinkKlook',
    expedition: 'tourLinkExpedition',
    civitatis: 'tourLinkCivitatis',
  }
  return map[key] || 'websiteLink'
}

function parseTour(tour: TourData): ParsedTour {
  const supplierPrice = parsePriceToNumber(tour.supplierPriceAdult)
  const websitePrice = parsePriceToNumber(tour.websitePrice)
  const ctripPrice = parsePriceToNumber(tour.ctripPrice)
  const viatorPrice = parsePriceToNumber(tour.viatorPrice)
  const klookPrice = parsePriceToNumber(tour.klookPrice)
  const expeditionPrice = parsePriceToNumber(tour.expeditionPrice)
  const civitatisPrice = parsePriceToNumber(tour.civitatisPrice)
  const headoutPrice = parsePriceToNumber(tour.headoutPrice)

  const prices = [
    { key: 'website', label: 'Website', price: websitePrice, isWebsite: true },
    { key: 'ctrip', label: 'Ctrip', price: ctripPrice, isWebsite: false },
    { key: 'viator', label: 'Viator', price: viatorPrice, isWebsite: false },
    { key: 'klook', label: 'Klook', price: klookPrice, isWebsite: false },
    { key: 'expedition', label: 'Expedition', price: expeditionPrice, isWebsite: false },
    { key: 'civitatis', label: 'Civitatis', price: civitatisPrice, isWebsite: false },
    { key: 'headout', label: 'Headout', price: headoutPrice, isWebsite: false },
  ]

  const validPrices = prices.filter((p) => p.price > 0)
  const minPrice = validPrices.length > 0 ? Math.min(...validPrices.map((p) => p.price)) : 0
  const maxPrice = validPrices.length > 0 ? Math.max(...validPrices.map((p) => p.price)) : 0

  const cheapest =
    validPrices.find((p) => p.price === minPrice) || { key: '-', label: '-', price: 0, isWebsite: false }
  const mostExpensive =
    validPrices.find((p) => p.price === maxPrice) || { key: '-', label: '-', price: 0, isWebsite: false }

  const profitMargins = prices
    .filter((p) => p.price > 0 && supplierPrice > 0)
    .map((p) => ({
      key: p.key,
      label: p.label,
      margin: ((p.price - supplierPrice) / supplierPrice) * 100,
      diffFromSupplier: p.price - supplierPrice,
    }))

  return {
    tour,
    supplierPrice,
    websitePrice,
    ctripPrice,
    viatorPrice,
    klookPrice,
    expeditionPrice,
    civitatisPrice,
    headoutPrice,
    minPrice,
    maxPrice,
    cheapestMarketplace: cheapest.label,
    mostExpensiveMarketplace: mostExpensive.label,
    prices,
    profitMargins,
  }
}

function detectDiscrepancies(parsedTours: ParsedTour[]): DiscrepancyAlert[] {
  const alerts: DiscrepancyAlert[] = []

  for (const pt of parsedTours) {
    if (pt.websitePrice <= 0) continue

    // Check marketplace undercut (>20% cheaper than website)
    for (const p of pt.prices) {
      if (p.key === 'website' || p.price <= 0) continue
      const diffPercent = ((pt.websitePrice - p.price) / pt.websitePrice) * 100
      if (diffPercent > 20) {
        alerts.push({
          tour: pt.tour,
          type: 'undercut',
          severity: diffPercent > 50 ? 'critical' : diffPercent > 35 ? 'warning' : 'info',
          marketplace: p.label,
          ourPrice: pt.websitePrice,
          marketPrice: p.price,
          diff: pt.websitePrice - p.price,
          diffPercent,
          message: `${p.label} is ${diffPercent.toFixed(0)}% cheaper than website (${formatCurrency(p.price)} vs ${formatCurrency(pt.websitePrice)})`,
        })
      }
    }

    // Check loss (supplier price > selling price)
    if (pt.supplierPrice > 0) {
      for (const p of pt.prices) {
        if (p.price <= 0) continue
        if (pt.supplierPrice > p.price) {
          const loss = pt.supplierPrice - p.price
          const lossPercent = (loss / pt.supplierPrice) * 100
          alerts.push({
            tour: pt.tour,
            type: 'loss',
            severity: lossPercent > 20 ? 'critical' : lossPercent > 10 ? 'warning' : 'info',
            marketplace: p.label,
            ourPrice: p.price,
            marketPrice: pt.supplierPrice,
            diff: loss,
            diffPercent: -lossPercent,
            message: `Selling at a loss on ${p.label}: ${formatCurrency(p.price)} vs ${formatCurrency(pt.supplierPrice)} supplier cost (${lossPercent.toFixed(0)}% loss)`,
          })
        }
      }
    }
  }

  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 }
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity]
    }
    return Math.abs(b.diffPercent) - Math.abs(a.diffPercent)
  })
}

// ─── Custom Tooltip for Charts ───────────────────────────────────────────────

function ChartTooltipWrapper({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color?: string; payload?: Record<string, unknown> }>
  label?: string
  formatter?: (value: number, name: string) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{formatter ? formatter(entry.value, entry.name) : formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-64 mb-1" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-7 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Tabs skeleton */}
      <Skeleton className="h-9 w-96" />
      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── Error State ─────────────────────────────────────────────────────────────

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="max-w-md w-full">
        <CardContent className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="font-semibold mb-1">Failed to load analytics</h3>
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

// ─── Sub-Components ──────────────────────────────────────────────────────────

/** Stat Card */
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgClass,
  trend,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ElementType
  iconBgClass: string
  trend?: number
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className={`rounded-lg p-2 ${iconBgClass}`}>
            <Icon className="h-4 w-4" />
          </div>
          {trend !== undefined && (
            <div
              className={`flex items-center gap-0.5 text-xs font-medium ${
                trend >= 0 ? 'text-emerald-600' : 'text-red-500'
              }`}
            >
              {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(trend).toFixed(1)}%
            </div>
          )}
        </div>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}

/** Price Range Histogram */
function PriceRangeHistogram({ tours }: { tours: ParsedTour[] }) {
  const ranges = [
    { label: '€0-10', min: 0, max: 10 },
    { label: '€10-20', min: 10, max: 20 },
    { label: '€20-50', min: 20, max: 50 },
    { label: '€50-100', min: 50, max: 100 },
    { label: '€100-200', min: 100, max: 200 },
    { label: '€200-500', min: 200, max: 500 },
    { label: '€500+', min: 500, max: Infinity },
  ]

  const data = ranges.map((range) => {
    const count = tours.filter((t) => {
      const p = t.websitePrice > 0 ? t.websitePrice : t.supplierPrice
      return p >= range.min && p < range.max
    }).length
    return { ...range, count }
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Price Range Distribution</CardTitle>
        </div>
        <CardDescription>Number of tours in each price bracket (website price or supplier price)</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
            <RechartsTooltip content={<ChartTooltipWrapper />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

/** Average Price by Marketplace */
function MarketplaceAvgPriceChart({ tours }: { tours: ParsedTour[] }) {
  const data = MARKETPLACE_KEYS.map((key) => {
    const label = MARKETPLACE_LABELS[key]
    const field = getPriceField(key)
    const validPrices = tours
      .map((t) => parsePriceToNumber(t.tour[field] as string))
      .filter((p) => p > 0)
    const avg = validPrices.length > 0 ? validPrices.reduce((a, b) => a + b, 0) / validPrices.length : 0
    const min = validPrices.length > 0 ? Math.min(...validPrices) : 0
    const max = validPrices.length > 0 ? Math.max(...validPrices) : 0
    const count = validPrices.length
    // variance
    const variance =
      validPrices.length > 1
        ? validPrices.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / (validPrices.length - 1)
        : 0
    const stdDev = Math.sqrt(variance)
    return { key, label, avg: Math.round(avg), min, max, count, stdDev: Math.round(stdDev) }
  }).filter((d) => d.count > 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Average Price by Marketplace</CardTitle>
        </div>
        <CardDescription>Mean listing price across platforms</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} tickFormatter={(v) => `€${v}`} />
            <RechartsTooltip content={<ChartTooltipWrapper />} />
            <Legend />
            <Bar dataKey="avg" name="Average" radius={[4, 4, 0, 0]} barSize={36}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={MARKETPLACE_COLORS[entry.key] || CHART_COLORS[index % CHART_COLORS.length]}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
            <Line
              type="monotone"
              dataKey="stdDev"
              name="Std Deviation"
              stroke="oklch(0.55 0.24 25)"
              strokeWidth={2}
              dot={{ fill: 'oklch(0.55 0.24 25)', r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

/** Price Variance Analysis */
function PriceVarianceChart({ tours }: { tours: ParsedTour[] }) {
  const data = MARKETPLACE_KEYS.map((key) => {
    const field = getPriceField(key)
    const validPrices = tours
      .map((t) => parsePriceToNumber(t.tour[field] as string))
      .filter((p) => p > 0)
    const avg = validPrices.length > 0 ? validPrices.reduce((a, b) => a + b, 0) / validPrices.length : 0
    const variance =
      validPrices.length > 1
        ? validPrices.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / (validPrices.length - 1)
        : 0
    const stdDev = Math.sqrt(variance)
    const cv = avg > 0 ? (stdDev / avg) * 100 : 0
    return {
      label: MARKETPLACE_LABELS[key],
      key,
      stdDev: Math.round(stdDev * 10) / 10,
      cv: Math.round(cv * 10) / 10,
      range: Math.round(Math.max(...validPrices, 0) - Math.min(...validPrices, 0)),
      count: validPrices.length,
    }
  }).filter((d) => d.count > 0).sort((a, b) => b.cv - a.cv)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Price Variance Analysis</CardTitle>
        </div>
        <CardDescription>Coefficient of variation (CV) shows relative price dispersion</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={75} tick={{ fontSize: 12 }} />
            <RechartsTooltip
              content={({ active, payload, label }) => (
                <ChartTooltipWrapper
                  active={active}
                  payload={payload}
                  label={label}
                  formatter={(value) => `${value}%`}
                />
              )}
            />
            <Bar dataKey="cv" name="CV (%)" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((entry, index) => (
                <Cell
                  key={`cv-${index}`}
                  fill={entry.cv > 80 ? 'oklch(0.55 0.24 25)' : entry.cv > 50 ? 'oklch(0.75 0.18 85)' : 'oklch(0.55 0.15 165)'}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

/** Website vs Marketplace Scatter Chart */
function WebsiteVsMarketplaceScatter({ tours }: { tours: ParsedTour[] }) {
  const scatterData: Array<{ x: number; y: number; name: string; z: number }> = []

  for (const key of MARKETPLACE_KEYS) {
    if (key === 'website') continue
    const field = getPriceField(key)
    for (const t of tours) {
      const wp = t.websitePrice
      const mp = parsePriceToNumber(t.tour[field] as string)
      if (wp > 0 && mp > 0) {
        scatterData.push({
          x: wp,
          y: mp,
          name: `${t.tour.tourName.slice(0, 25)}... (${MARKETPLACE_LABELS[key]})`,
          z: 50,
        })
      }
    }
  }

  // Sample if too many points for readability
  const sampledData = scatterData.length > 300 ? scatterData.filter((_, i) => i % 3 === 0) : scatterData

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Website vs Marketplace Prices</CardTitle>
        </div>
        <CardDescription>Each dot represents a tour listing. Diagonal line = price parity</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" dataKey="x" name="Website" tickFormatter={(v) => `€${v}`} tick={{ fontSize: 11 }} label={{ value: 'Website Price', position: 'bottom', offset: -2, fontSize: 11 }} />
            <YAxis type="number" dataKey="y" name="Marketplace" tickFormatter={(v) => `€${v}`} tick={{ fontSize: 11 }} label={{ value: 'Marketplace Price', angle: -90, position: 'insideLeft', fontSize: 11 }} />
            <RechartsTooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-md">
                    <p className="text-xs font-medium mb-1 max-w-[200px] truncate">{d.name}</p>
                    <p className="text-sm text-muted-foreground">Website: <span className="text-foreground font-medium">{formatCurrency(d.x)}</span></p>
                    <p className="text-sm text-muted-foreground">Marketplace: <span className="text-foreground font-medium">{formatCurrency(d.y)}</span></p>
                    <p className={`text-xs mt-1 ${d.y < d.x ? 'text-red-500' : 'text-emerald-600'}`}>
                      {d.x > 0 ? `${(((d.y - d.x) / d.x) * 100).toFixed(1)}% vs website` : ''}
                    </p>
                  </div>
                )
              }}
            />
            <Scatter name="Tours" data={sampledData} fill="oklch(0.55 0.15 165)" fillOpacity={0.6} />
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

/** Marketplace Price Comparison Matrix Table */
function PriceComparisonTable({
  tours,
  destinationFilter,
  categoryFilter,
  sortField,
  sortDir,
  onDestinationFilterChange,
  onCategoryFilterChange,
  onSort,
}: {
  tours: ParsedTour[]
  destinationFilter: string
  categoryFilter: string
  sortField: string
  sortDir: 'asc' | 'desc'
  onDestinationFilterChange: (v: string) => void
  onCategoryFilterChange: (v: string) => void
  onSort: (field: string) => void
}) {
  const filtered = useMemo(() => {
    let result = tours
    if (destinationFilter) {
      result = result.filter((t) => t.tour.destinationCity === destinationFilter)
    }
    if (categoryFilter) {
      result = result.filter((t) => t.tour.category === categoryFilter)
    }

    result = [...result].sort((a, b) => {
      let valA: number
      let valB: number
      switch (sortField) {
        case 'tourName':
          return sortDir === 'asc'
            ? a.tour.tourName.localeCompare(b.tour.tourName)
            : b.tour.tourName.localeCompare(a.tour.tourName)
        case 'destination':
          return sortDir === 'asc'
            ? a.tour.destinationCity.localeCompare(b.tour.destinationCity)
            : b.tour.destinationCity.localeCompare(a.tour.destinationCity)
        case 'supplier':
          valA = a.supplierPrice; valB = b.supplierPrice; break
        case 'margin':
          valA = a.profitMargins.find((m) => m.key === 'website')?.margin ?? -999; valB = b.profitMargins.find((m) => m.key === 'website')?.margin ?? -999; break
        default:
          valA = a[getPriceField(sortField) as keyof ParsedTour] as number || 0
          valB = b[getPriceField(sortField) as keyof ParsedTour] as number || 0
      }
      return sortDir === 'asc' ? valA - valB : valB - valA
    })

    return result
  }, [tours, destinationFilter, categoryFilter, sortField, sortDir])

  const destinations = useMemo(
    () => [...new Set(tours.map((t) => t.tour.destinationCity))].filter(Boolean).sort(),
    [tours]
  )
  const categories = useMemo(
    () => [...new Set(tours.map((t) => t.tour.category).filter(Boolean) as string[])].sort(),
    [tours]
  )

  function renderSortIcon(field: string) {
    if (sortField !== field) return <ChevronDown className="h-3 w-3 opacity-40" />
    return sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
  }

  function getCellColor(price: number, minPrice: number, maxPrice: number, isWebsite: boolean) {
    if (price <= 0) return ''
    if (isWebsite) return 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 font-semibold'
    if (price === minPrice) return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
    if (price === maxPrice && minPrice !== maxPrice) return 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
    return ''
  }

  const marketplaceColumns = [
    { key: 'ctrip', label: 'Ctrip' },
    { key: 'viator', label: 'Viator' },
    { key: 'klook', label: 'Klook' },
    { key: 'expedition', label: 'Expedition' },
    { key: 'civitatis', label: 'Civitatis' },
    { key: 'headout', label: 'Headout' },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Price Comparison Matrix</CardTitle>
            </div>
            <CardDescription className="mt-1">
              {filtered.length} tours •{' '}
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded bg-emerald-500" /> Cheapest
              </span>
              {' · '}
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded bg-amber-500" /> Website
              </span>
              {' · '}
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded bg-red-500" /> Most Expensive
              </span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={destinationFilter} onValueChange={onDestinationFilterChange}>
              <SelectTrigger size="sm" className="w-[160px]">
                <MapPin className="h-3.5 w-3.5 mr-1" />
                <SelectValue placeholder="Destination" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Destinations</SelectItem>
                {destinations.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
              <SelectTrigger size="sm" className="w-[160px]">
                <Tag className="h-3.5 w-3.5 mr-1" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[65vh] overflow-y-auto table-scroll">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6 w-[220px] cursor-pointer select-none" onClick={() => onSort('tourName')}>
                  <span className="flex items-center gap-1">Tour Name {renderSortIcon('tourName')}</span>
                </TableHead>
                <TableHead className="w-[120px] cursor-pointer select-none hidden lg:table-cell" onClick={() => onSort('destination')}>
                  <span className="flex items-center gap-1">Destination {renderSortIcon('destination')}</span>
                </TableHead>
                <TableHead className="text-right cursor-pointer select-none w-[90px]" onClick={() => onSort('supplier')}>
                  <span className="flex items-center justify-end gap-1">Supplier {renderSortIcon('supplier')}</span>
                </TableHead>
                <TableHead className="text-right cursor-pointer select-none w-[90px]" onClick={() => onSort('website')}>
                  <span className="flex items-center justify-end gap-1">
                    <span className="inline-block h-2 w-2 rounded bg-amber-500" /> Website {renderSortIcon('website')}
                  </span>
                </TableHead>
                {marketplaceColumns.map((col) => (
                  <TableHead key={col.key} className="text-right cursor-pointer select-none w-[90px] hidden xl:table-cell" onClick={() => onSort(col.key)}>
                    <span className="flex items-center justify-end gap-1">{col.label} {renderSortIcon(col.key)}</span>
                  </TableHead>
                ))}
                <TableHead className="text-right cursor-pointer select-none w-[100px]" onClick={() => onSort('margin')}>
                  <span className="flex items-center justify-end gap-1">Margin {renderSortIcon('margin')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={marketplaceColumns.length + 5} className="text-center py-12 text-muted-foreground">
                    No tours match the selected filters
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((pt) => {
                  const websiteMargin = pt.profitMargins.find((m) => m.key === 'website')
                  return (
                    <TableRow key={pt.tour.id}>
                      <TableCell className="pl-6">
                        <div className="font-medium text-sm truncate max-w-[200px]" title={pt.tour.tourName}>
                          {pt.tour.tourName}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                          <MapPin className="h-3 w-3" />
                          {pt.tour.destinationCity}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {pt.supplierPrice > 0 ? formatCurrency(pt.supplierPrice) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className={`text-right font-mono text-sm ${getCellColor(pt.websitePrice, pt.minPrice, pt.maxPrice, true)}`}>
                        {pt.websitePrice > 0 ? formatCurrency(pt.websitePrice) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      {marketplaceColumns.map((col) => {
                        const price = pt[col.key as keyof ParsedTour] as number
                        const diffFromSupplier = price > 0 && pt.supplierPrice > 0
                          ? ((price - pt.supplierPrice) / pt.supplierPrice * 100).toFixed(0)
                          : null
                        return (
                          <TableCell key={col.key} className={`text-right font-mono text-sm hidden xl:table-cell ${getCellColor(price, pt.minPrice, pt.maxPrice, false)}`}>
                            <div>
                              {price > 0 ? formatCurrency(price) : <span className="text-muted-foreground">—</span>}
                              {diffFromSupplier && (
                                <div className={`text-[10px] ${Number(diffFromSupplier) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                  {Number(diffFromSupplier) >= 0 ? '+' : ''}{diffFromSupplier}%
                                </div>
                              )}
                            </div>
                          </TableCell>
                        )
                      })}
                      <TableCell className="text-right">
                        {websiteMargin ? (
                          <Badge
                            variant="outline"
                            className={`text-xs font-mono ${
                              websiteMargin.margin > 0
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                                : websiteMargin.margin < 0
                                ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800'
                                : ''
                            }`}
                          >
                            {formatPercent(websiteMargin.margin)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

/** Price Range Chart (Min-Max per tour for top tours) */
function PriceRangeChart({ tours }: { tours: ParsedTour[] }) {
  const topTours = tours
    .filter((t) => t.maxPrice > 0 && t.minPrice > 0 && t.maxPrice !== t.minPrice)
    .sort((a, b) => (b.maxPrice - b.minPrice) - (a.maxPrice - a.minPrice))
    .slice(0, 15)

  const data = topTours.map((t) => ({
    name: t.tour.tourName.length > 30 ? t.tour.tourName.slice(0, 30) + '...' : t.tour.tourName,
    fullName: t.tour.tourName,
    min: t.minPrice,
    max: t.maxPrice,
    website: t.websitePrice,
    range: t.maxPrice - t.minPrice,
  }))

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Price Range Analysis</CardTitle>
          <CardDescription>Top tours by price spread across marketplaces</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
            No tours with price variation found
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Price Range Analysis</CardTitle>
        </div>
        <CardDescription>Top 15 tours with largest price spread (min-max across marketplaces)</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(350, data.length * 28)}>
          <ComposedChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 120, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => `€${v}`} />
            <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={115} tick={{ fontSize: 10 }} />
            <RechartsTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0]?.payload
                if (!d) return null
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-md max-w-[250px]">
                    <p className="text-xs font-medium mb-1">{d.fullName}</p>
                    <p className="text-sm text-muted-foreground">Min: <span className="font-medium">{formatCurrency(d.min)}</span></p>
                    <p className="text-sm text-muted-foreground">Max: <span className="font-medium">{formatCurrency(d.max)}</span></p>
                    <p className="text-sm text-muted-foreground">Website: <span className="font-medium">{formatCurrency(d.website)}</span></p>
                    <p className="text-sm text-muted-foreground">Range: <span className="font-medium">{formatCurrency(d.range)}</span></p>
                  </div>
                )
              }}
            />
            <Bar dataKey="min" name="Min Price" fill="oklch(0.55 0.15 165)" radius={[0, 0, 0, 0]} barSize={12} fillOpacity={0.7} />
            <Bar dataKey="max" name="Max Price" fill="oklch(0.55 0.24 25)" radius={[0, 4, 4, 0]} barSize={12} fillOpacity={0.7} />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

/** Discrepancy Alerts Panel */
function DiscrepancyAlertsPanel({ alerts }: { alerts: DiscrepancyAlert[] }) {
  const [filter, setFilter] = useState<string>('all')

  const filtered = filter === 'all' ? alerts : filter === 'loss' ? alerts.filter((a) => a.type === 'loss') : alerts.filter((a) => a.type === 'undercut')

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length
  const warningCount = alerts.filter((a) => a.severity === 'warning').length
  const infoCount = alerts.filter((a) => a.severity === 'info').length

  const severityConfig = {
    critical: {
      bg: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
      badge: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700',
      icon: ShieldAlert,
      iconColor: 'text-red-600',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
      badge: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
      badge: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700',
      icon: Info,
      iconColor: 'text-blue-600',
    },
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Pricing Discrepancy Alerts</CardTitle>
            </div>
            <CardDescription className="mt-1">
              Automatically detected pricing issues
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger size="sm" className="w-[140px]">
                <Filter className="h-3.5 w-3.5 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({alerts.length})</SelectItem>
                <SelectItem value="undercut">Undercut ({alerts.filter((a) => a.type === 'undercut').length})</SelectItem>
                <SelectItem value="loss">Loss ({alerts.filter((a) => a.type === 'loss').length})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {alerts.length > 0 && (
          <div className="flex items-center gap-3 mt-3">
            {criticalCount > 0 && (
              <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700">
                {criticalCount} Critical
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700">
                {warningCount} Warnings
              </Badge>
            )}
            {infoCount > 0 && (
              <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700">
                {infoCount} Info
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[65vh] overflow-y-auto table-scroll">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
              <div className="text-center">
                <ShieldCheck className="h-10 w-10 mx-auto mb-3 text-emerald-500" />
                <p className="font-medium">No discrepancies detected</p>
                <p className="text-xs mt-1">All prices look good!</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6 w-[50px]">Severity</TableHead>
                  <TableHead className="w-[60px]">Type</TableHead>
                  <TableHead>Tour</TableHead>
                  <TableHead className="hidden md:table-cell">Marketplace</TableHead>
                  <TableHead className="text-right">Our Price</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Market Price</TableHead>
                  <TableHead className="text-right">Diff</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((alert, idx) => {
                  const config = severityConfig[alert.severity]
                  const Icon = config.icon
                  return (
                    <TableRow key={`${alert.tour.id}-${alert.marketplace}-${idx}`}>
                      <TableCell className="pl-6">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <div className={`rounded-full p-1.5 ${config.badge}`}>
                                <Icon className="h-3 w-3" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="capitalize">{alert.severity}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {alert.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm truncate max-w-[200px]" title={alert.tour.tourName}>
                          {alert.tour.tourName}
                        </div>
                        <div className="text-muted-foreground text-xs hidden md:block">{alert.message}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">{alert.marketplace}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(alert.ourPrice)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm hidden sm:table-cell">
                        {formatCurrency(alert.marketPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`text-sm font-mono font-medium ${alert.diffPercent < -20 ? 'text-red-600' : 'text-amber-600'}`}>
                          {formatPercent(alert.diffPercent)}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/** Destination Price Analysis */
function DestinationPriceAnalysis({ tours }: { tours: ParsedTour[] }) {
  const data = useMemo(() => {
    const grouped: Record<string, ParsedTour[]> = {}
    for (const t of tours) {
      const city = t.tour.destinationCity || 'Unknown'
      if (!grouped[city]) grouped[city] = []
      grouped[city].push(t)
    }

    return Object.entries(grouped)
      .map(([city, cityTours]) => {
        const supplierPrices = cityTours.map((t) => t.supplierPrice).filter((p) => p > 0)
        const websitePrices = cityTours.map((t) => t.websitePrice).filter((p) => p > 0)
        const allPrices = cityTours.flatMap((t) => t.prices.map((p) => p.price)).filter((p) => p > 0)

        const avgSupplier = supplierPrices.length > 0 ? supplierPrices.reduce((a, b) => a + b, 0) / supplierPrices.length : 0
        const avgWebsite = websitePrices.length > 0 ? websitePrices.reduce((a, b) => a + b, 0) / websitePrices.length : 0
        const avgAll = allPrices.length > 0 ? allPrices.reduce((a, b) => a + b, 0) / allPrices.length : 0
        const minAll = allPrices.length > 0 ? Math.min(...allPrices) : 0
        const maxAll = allPrices.length > 0 ? Math.max(...allPrices) : 0

        const mostExpensive = cityTours
          .filter((t) => t.websitePrice > 0 || t.supplierPrice > 0)
          .sort((a, b) => (b.websitePrice || b.supplierPrice) - (a.websitePrice || a.supplierPrice))[0]
        const cheapest = cityTours
          .filter((t) => t.websitePrice > 0 || t.supplierPrice > 0)
          .sort((a, b) => (a.websitePrice || a.supplierPrice) - (b.websitePrice || b.supplierPrice))[0]

        return {
          city,
          tourCount: cityTours.length,
          avgPrice: Math.round(avgAll),
          avgSupplier: Math.round(avgSupplier),
          avgWebsite: Math.round(avgWebsite),
          minPrice: minAll,
          maxPrice: maxAll,
          range: maxAll - minAll,
          mostExpensive: mostExpensive?.tour.tourName || '—',
          mostExpensivePrice: mostExpensive?.websitePrice || mostExpensive?.supplierPrice || 0,
          cheapest: cheapest?.tour.tourName || '—',
          cheapestPrice: cheapest?.websitePrice || cheapest?.supplierPrice || 0,
        }
      })
      .sort((a, b) => b.tourCount - a.tourCount)
  }, [tours])

  return (
    <div className="space-y-6">
      {/* Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Average Price by Destination</CardTitle>
          </div>
          <CardDescription>Supplier, Website, and Overall average prices per city</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={Math.max(300, data.length * 32)}>
            <BarChart data={data.slice(0, 15)} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => `€${v}`} />
              <YAxis type="category" dataKey="city" tickLine={false} axisLine={false} width={95} tick={{ fontSize: 11 }} />
              <RechartsTooltip content={<ChartTooltipWrapper />} />
              <Legend />
              <Bar dataKey="avgSupplier" name="Avg Supplier" fill="oklch(0.55 0.24 25)" radius={[0, 4, 4, 0]} barSize={10} fillOpacity={0.8} />
              <Bar dataKey="avgWebsite" name="Avg Website" fill="oklch(0.75 0.18 85)" radius={[0, 4, 4, 0]} barSize={10} fillOpacity={0.8} />
              <Bar dataKey="avgPrice" name="Avg All" fill="oklch(0.55 0.15 165)" radius={[0, 4, 4, 0]} barSize={10} fillOpacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Destination Price Summary</CardTitle>
          <CardDescription>Detailed price statistics per destination</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[65vh] overflow-y-auto table-scroll">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Destination</TableHead>
                  <TableHead className="text-right">Tours</TableHead>
                  <TableHead className="text-right">Avg Price</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Avg Supplier</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Avg Website</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">Min</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">Max</TableHead>
                  <TableHead className="text-right hidden xl:table-cell">Range</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((d) => (
                  <TableRow key={d.city}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium text-sm">{d.city}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="font-mono text-xs">{d.tourCount}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium">{formatCurrency(d.avgPrice)}</TableCell>
                    <TableCell className="text-right font-mono text-sm hidden md:table-cell text-muted-foreground">{formatCurrency(d.avgSupplier)}</TableCell>
                    <TableCell className="text-right font-mono text-sm hidden md:table-cell">{formatCurrency(d.avgWebsite)}</TableCell>
                    <TableCell className="text-right font-mono text-sm hidden lg:table-cell text-emerald-600">{formatCurrency(d.minPrice)}</TableCell>
                    <TableCell className="text-right font-mono text-sm hidden lg:table-cell text-red-500">{formatCurrency(d.maxPrice)}</TableCell>
                    <TableCell className="text-right font-mono text-sm hidden xl:table-cell">{formatCurrency(d.range)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/** Category Price Analysis */
function CategoryPriceAnalysis({ tours }: { tours: ParsedTour[] }) {
  const data = useMemo(() => {
    const grouped: Record<string, ParsedTour[]> = {}
    for (const t of tours) {
      const cat = t.tour.category || 'Uncategorized'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(t)
    }

    return Object.entries(grouped)
      .map(([cat, catTours]) => {
        const websitePrices = catTours.map((t) => t.websitePrice).filter((p) => p > 0)
        const supplierPrices = catTours.map((t) => t.supplierPrice).filter((p) => p > 0)
        const allPrices = catTours.flatMap((t) => t.prices.map((p) => p.price)).filter((p) => p > 0)

        const avgWebsite = websitePrices.length > 0 ? websitePrices.reduce((a, b) => a + b, 0) / websitePrices.length : 0
        const avgSupplier = supplierPrices.length > 0 ? supplierPrices.reduce((a, b) => a + b, 0) / supplierPrices.length : 0
        const avgAll = allPrices.length > 0 ? allPrices.reduce((a, b) => a + b, 0) / allPrices.length : 0

        const totalRevenue = catTours.reduce((sum, t) => sum + parsePriceToNumber(t.tour.revenue), 0)
        const totalBookings = catTours.reduce((sum, t) => sum + t.tour.bookings, 0)
        const revenuePotential = avgWebsite * totalBookings

        return {
          category: cat,
          tourCount: catTours.length,
          avgPrice: Math.round(avgAll),
          avgWebsite: Math.round(avgWebsite),
          avgSupplier: Math.round(avgSupplier),
          totalBookings,
          totalRevenue,
          revenuePotential: Math.round(revenuePotential),
          margin: avgWebsite > 0 && avgSupplier > 0 ? ((avgWebsite - avgSupplier) / avgSupplier) * 100 : 0,
        }
      })
      .sort((a, b) => b.tourCount - a.tourCount)
  }, [tours])

  return (
    <div className="space-y-6">
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Average Price by Category</CardTitle>
            </div>
            <CardDescription>Supplier vs Website pricing per category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(250, data.length * 32)}>
              <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => `€${v}`} />
                <YAxis type="category" dataKey="category" tickLine={false} axisLine={false} width={95} tick={{ fontSize: 11 }} />
                <RechartsTooltip content={<ChartTooltipWrapper />} />
                <Legend />
                <Bar dataKey="avgSupplier" name="Avg Supplier" fill="oklch(0.55 0.24 25)" radius={[0, 4, 4, 0]} barSize={10} fillOpacity={0.8} />
                <Bar dataKey="avgWebsite" name="Avg Website" fill="oklch(0.75 0.18 85)" radius={[0, 4, 4, 0]} barSize={10} fillOpacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Revenue Potential by Category</CardTitle>
            </div>
            <CardDescription>Based on avg website price × total bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.filter((d) => d.revenuePotential > 0).slice(0, 10)}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="revenuePotential"
                  nameKey="category"
                  strokeWidth={0}
                >
                  {data.filter((d) => d.revenuePotential > 0).slice(0, 10).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md">
                        <p className="text-xs font-medium">{payload[0]?.payload?.category}</p>
                        <p className="text-sm text-muted-foreground">Revenue: <span className="font-medium">{formatCurrency(payload[0]?.payload?.revenuePotential)}</span></p>
                        <p className="text-sm text-muted-foreground">Bookings: <span className="font-medium">{formatNumber(payload[0]?.payload?.totalBookings)}</span></p>
                      </div>
                    )
                  }}
                />
                <Legend
                  content={({ payload }) => {
                    if (!payload?.length) return null
                    return (
                      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pt-2">
                        {payload.map((entry, index) => (
                          <div key={entry.value} className="flex items-center gap-1.5 text-xs">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-muted-foreground">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    )
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Category Price Summary</CardTitle>
          <CardDescription>Detailed pricing and revenue statistics per category</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[65vh] overflow-y-auto table-scroll">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Category</TableHead>
                  <TableHead className="text-right">Tours</TableHead>
                  <TableHead className="text-right">Avg Price</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Avg Supplier</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Avg Website</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">Margin</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Bookings</TableHead>
                  <TableHead className="text-right hidden xl:table-cell">Revenue</TableHead>
                  <TableHead className="text-right hidden xl:table-cell">Potential</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((d) => (
                  <TableRow key={d.category}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-2">
                        <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium text-sm">{d.category}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="font-mono text-xs">{d.tourCount}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium">{formatCurrency(d.avgPrice)}</TableCell>
                    <TableCell className="text-right font-mono text-sm hidden md:table-cell text-muted-foreground">{formatCurrency(d.avgSupplier)}</TableCell>
                    <TableCell className="text-right font-mono text-sm hidden md:table-cell">{formatCurrency(d.avgWebsite)}</TableCell>
                    <TableCell className="text-right hidden lg:table-cell">
                      {d.margin !== 0 ? (
                        <Badge
                          variant="outline"
                          className={`text-xs font-mono ${
                            d.margin > 0
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                              : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800'
                          }`}
                        >
                          {formatPercent(d.margin)}
                        </Badge>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm hidden sm:table-cell">{formatNumber(d.totalBookings)}</TableCell>
                    <TableCell className="text-right font-mono text-sm hidden xl:table-cell">{formatCurrency(d.totalRevenue)}</TableCell>
                    <TableCell className="text-right font-mono text-sm hidden xl:table-cell font-medium">{formatCurrency(d.revenuePotential)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/** Competitive Intelligence Summary */
function CompetitiveIntelligence({ tours, dashboardData }: { tours: ParsedTour[]; dashboardData: DashboardData | null }) {
  const marketplaceStats = useMemo(() => {
    return MARKETPLACE_KEYS.map((key) => {
      const label = MARKETPLACE_LABELS[key]
      const field = getPriceField(key)
      const linkField = getLinkField(key)

      const prices = tours.map((t) => parsePriceToNumber(t.tour[field] as string)).filter((p) => p > 0)
      const hasLink = tours.filter((t) => {
        const link = t.tour[linkField]
        return link && typeof link === 'string' && link.trim() !== '' && !link.startsWith('Not Listed') && !link.startsWith('MISSING')
      }).length
      const hasPrice = tours.filter((t) => parsePriceToNumber(t.tour[field] as string) > 0).length

      const avg = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
      const min = prices.length > 0 ? Math.min(...prices) : 0
      const max = prices.length > 0 ? Math.max(...prices) : 0
      const median = prices.length > 0
        ? [...prices].sort((a, b) => a - b)[Math.floor(prices.length / 2)]
        : 0

      return {
        key,
        label,
        totalTours: tours.length,
        listedCount: hasLink,
        hasPriceCount: hasPrice,
        missingCount: tours.length - hasLink,
        missingPriceCount: tours.length - hasPrice,
        coverage: (hasLink / tours.length) * 100,
        avgPrice: Math.round(avg),
        medianPrice: Math.round(median),
        minPrice: min,
        maxPrice: max,
      }
    })
  }, [tours])

  const ourAvgPrice = marketplaceStats.find((m) => m.key === 'website')?.avgPrice || 0
  const competitorKeys = MARKETPLACE_KEYS.filter((k) => k !== 'website')
  const avgCompetitorPrice =
    competitorKeys
      .map((k) => marketplaceStats.find((m) => m.key === k)?.avgPrice || 0)
      .filter((p) => p > 0).length > 0
      ? competitorKeys
          .map((k) => marketplaceStats.find((m) => m.key === k)?.avgPrice || 0)
          .filter((p) => p > 0)
          .reduce((a, b) => a + b, 0) /
        competitorKeys
          .map((k) => marketplaceStats.find((m) => m.key === k)?.avgPrice || 0)
          .filter((p) => p > 0).length
      : 0

  const positionVsCompetition = ourAvgPrice > 0 && avgCompetitorPrice > 0
    ? ((ourAvgPrice - avgCompetitorPrice) / avgCompetitorPrice) * 100
    : 0

  // Positioning scatter data
  const positioningData = tours
    .filter((t) => t.websitePrice > 0)
    .map((t) => {
      const compPrices = [
        t.ctripPrice, t.viatorPrice, t.klookPrice,
        t.expeditionPrice, t.civitatisPrice, t.headoutPrice,
      ].filter((p) => p > 0)
      const avgComp = compPrices.length > 0 ? compPrices.reduce((a, b) => a + b, 0) / compPrices.length : 0
      return {
        name: t.tour.tourName.length > 25 ? t.tour.tourName.slice(0, 25) + '...' : t.tour.tourName,
        fullName: t.tour.tourName,
        ourPrice: t.websitePrice,
        competitionAvg: Math.round(avgComp),
        diff: avgComp > 0 ? ((t.websitePrice - avgComp) / avgComp) * 100 : 0,
      }
    })
    .filter((d) => d.competitionAvg > 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tours"
          value={formatNumber(tours.length)}
          icon={Globe}
          iconBgClass="bg-chart-1/10 text-chart-1"
        />
        <StatCard
          title="Our Avg Price"
          value={formatCurrency(ourAvgPrice)}
          subtitle="Website average"
          icon={DollarSign}
          iconBgClass="bg-chart-2/10 text-chart-2"
        />
        <StatCard
          title="Competition Avg"
          value={formatCurrency(avgCompetitorPrice)}
          subtitle="Average of all marketplaces"
          icon={BarChart3}
          iconBgClass="bg-chart-3/10 text-chart-3"
          trend={positionVsCompetition}
        />
        <StatCard
          title="Price Position"
          value={formatPercent(positionVsCompetition)}
          subtitle={positionVsCompetition > 0 ? 'We are more expensive' : positionVsCompetition < 0 ? 'We are cheaper' : 'At parity'}
          icon={positionVsCompetition > 0 ? TrendingUp : positionVsCompetition < 0 ? TrendingDown : BarChart3}
          iconBgClass={`${
            positionVsCompetition > 5
              ? 'bg-amber-500/10 text-amber-600'
              : positionVsCompetition < -5
              ? 'bg-emerald-500/10 text-emerald-600'
              : 'bg-chart-4/10 text-chart-4'
          }`}
        />
      </div>

      {/* Marketplace Coverage + Listing Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Marketplace Coverage</CardTitle>
            </div>
            <CardDescription>Tours listed vs missing per platform</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={marketplaceStats} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <RechartsTooltip content={<ChartTooltipWrapper />} />
                <Legend />
                <Bar dataKey="listedCount" name="Listed" fill="oklch(0.55 0.15 165)" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="missingCount" name="Missing" fill="oklch(0.7 0.15 70)" stackId="a" radius={[4, 4, 0, 0]} fillOpacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Price Positioning Map</CardTitle>
            </div>
            <CardDescription>Our price vs competition average per tour</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="competitionAvg"
                  name="Competition Avg"
                  tickFormatter={(v) => `€${v}`}
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Competition Avg', position: 'bottom', offset: -2, fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="ourPrice"
                  name="Our Price"
                  tickFormatter={(v) => `€${v}`}
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Our Price', angle: -90, position: 'insideLeft', fontSize: 11 }}
                />
                <RechartsTooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md max-w-[220px]">
                        <p className="text-xs font-medium mb-1 truncate">{d.fullName}</p>
                        <p className="text-sm text-muted-foreground">Our Price: <span className="font-medium">{formatCurrency(d.ourPrice)}</span></p>
                        <p className="text-sm text-muted-foreground">Competition: <span className="font-medium">{formatCurrency(d.competitionAvg)}</span></p>
                        <p className={`text-xs mt-1 ${d.diff > 5 ? 'text-amber-600' : d.diff < -5 ? 'text-emerald-600' : ''}`}>
                          {formatPercent(d.diff)} vs competition
                        </p>
                      </div>
                    )
                  }}
                />
                <Scatter name="Tours" data={positioningData.slice(0, 200)} fill="oklch(0.65 0.18 55)" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Marketplace Stats Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Marketplace Intelligence Summary</CardTitle>
          <CardDescription>Complete overview of marketplace performance and pricing</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Marketplace</TableHead>
                <TableHead className="text-right">Listed</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Missing</TableHead>
                <TableHead className="text-right">Coverage</TableHead>
                <TableHead className="text-right hidden md:table-cell">Avg Price</TableHead>
                <TableHead className="text-right hidden md:table-cell">Median</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Min</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Max</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marketplaceStats.map((m) => (
                <TableRow key={m.key}>
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: MARKETPLACE_COLORS[m.key] || '#888' }} />
                      <span className="font-medium text-sm">{m.label}</span>
                      {m.key === 'website' && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">OURS</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatNumber(m.listedCount)}</TableCell>
                  <TableCell className="text-right font-mono text-sm hidden sm:table-cell">
                    {m.missingCount > 0 ? (
                      <span className="text-amber-600">{formatNumber(m.missingCount)}</span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className={`text-xs font-mono ${
                        m.coverage > 70
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                          : m.coverage > 30
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800'
                          : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800'
                      }`}
                    >
                      {m.coverage.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-medium hidden md:table-cell">
                    {formatCurrency(m.avgPrice)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm hidden md:table-cell text-muted-foreground">
                    {formatCurrency(m.medianPrice)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm hidden lg:table-cell text-emerald-600">
                    {formatCurrency(m.minPrice)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm hidden lg:table-cell text-red-500">
                    {formatCurrency(m.maxPrice)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main Analytics Page ─────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [tours, setTours] = useState<TourData[]>([])
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [destinationFilter, setDestinationFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortField, setSortField] = useState('tourName')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [toursRes, dashboardRes] = await Promise.all([
        fetch('/api/tours?limit=500'),
        fetch('/api/dashboard'),
      ])

      if (!toursRes.ok) throw new Error('Failed to fetch tours')
      if (!dashboardRes.ok) throw new Error('Failed to fetch dashboard data')

      const toursData = await toursRes.json()
      const dashData = await dashboardRes.json()

      setTours(toursData.tours || [])
      setDashboardData(dashData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Parse all tours
  const parsedTours = useMemo(() => {
    let result = tours.map(parseTour)

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          (t.tour.tourName || '').toLowerCase().includes(q) ||
          (t.tour.destinationCity || '').toLowerCase().includes(q) ||
          (t.tour.category || '').toLowerCase().includes(q)
      )
    }

    return result
  }, [tours, searchQuery])

  // Discrepancy alerts
  const discrepancies = useMemo(() => detectDiscrepancies(parsedTours), [parsedTours])

  // Handle sort
  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }, [sortField])

  if (loading) return <AnalyticsSkeleton />
  if (error) return <ErrorState message={error} onRetry={fetchData} />

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-full overflow-y-auto custom-scrollbar">
        <div className="space-y-6 p-6 min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold tracking-tight">Pricing Analytics</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Marketplace comparison, pricing intelligence, and discrepancy detection
              for {formatNumber(parsedTours.length)} tours
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tours..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-[200px] sm:w-[260px]"
              />
            </div>
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Tours Analyzed"
            value={formatNumber(parsedTours.length)}
            icon={Globe}
            iconBgClass="bg-chart-1/10 text-chart-1"
          />
          <StatCard
            title="Price Discrepancies"
            value={formatNumber(discrepancies.length)}
            subtitle={`${discrepancies.filter((d) => d.severity === 'critical').length} critical`}
            icon={AlertTriangle}
            iconBgClass="bg-red-500/10 text-red-600"
          />
          <StatCard
            title="Avg Supplier Price"
            value={formatCurrency(
              Math.round(
                parsedTours.filter((t) => t.supplierPrice > 0).reduce((s, t) => s + t.supplierPrice, 0) /
                  Math.max(parsedTours.filter((t) => t.supplierPrice > 0).length, 1)
              )
            )}
            icon={DollarSign}
            iconBgClass="bg-chart-2/10 text-chart-2"
          />
          <StatCard
            title="Avg Website Price"
            value={formatCurrency(
              Math.round(
                parsedTours.filter((t) => t.websitePrice > 0).reduce((s, t) => s + t.websitePrice, 0) /
                  Math.max(parsedTours.filter((t) => t.websitePrice > 0).length, 1)
              )
            )}
            icon={TrendingUp}
            iconBgClass="bg-emerald-500/10 text-emerald-600"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="comparison" className="gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              Comparison
            </TabsTrigger>
            <TabsTrigger value="discrepancies" className="gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Discrepancies
              {discrepancies.length > 0 && (
                <Badge variant="destructive" className="h-5 min-w-[20px] px-1 text-[10px]">
                  {discrepancies.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="destination" className="gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              By Destination
            </TabsTrigger>
            <TabsTrigger value="category" className="gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              By Category
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PriceRangeHistogram tours={parsedTours} />
              <MarketplaceAvgPriceChart tours={parsedTours} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PriceVarianceChart tours={parsedTours} />
              <PriceRangeChart tours={parsedTours} />
            </div>
            <WebsiteVsMarketplaceScatter tours={parsedTours} />
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="space-y-6">
            <PriceComparisonTable
              tours={parsedTours}
              destinationFilter={destinationFilter}
              categoryFilter={categoryFilter}
              sortField={sortField}
              sortDir={sortDir}
              onDestinationFilterChange={setDestinationFilter}
              onCategoryFilterChange={setCategoryFilter}
              onSort={handleSort}
            />
          </TabsContent>

          {/* Discrepancies Tab */}
          <TabsContent value="discrepancies" className="space-y-6">
            {discrepancies.length > 0 && (
              <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Pricing Issues Detected</AlertTitle>
                <AlertDescription>
                  Found {formatNumber(discrepancies.length)} pricing discrepancies across your tours.{' '}
                  {discrepancies.filter((d) => d.severity === 'critical').length} require immediate attention.
                </AlertDescription>
              </Alert>
            )}
            <DiscrepancyAlertsPanel alerts={discrepancies} />
          </TabsContent>

          {/* Destination Tab */}
          <TabsContent value="destination" className="space-y-6">
            <DestinationPriceAnalysis tours={parsedTours} />
          </TabsContent>

          {/* Category Tab */}
          <TabsContent value="category" className="space-y-6">
            <CategoryPriceAnalysis tours={parsedTours} />
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </TooltipProvider>
  )
}
