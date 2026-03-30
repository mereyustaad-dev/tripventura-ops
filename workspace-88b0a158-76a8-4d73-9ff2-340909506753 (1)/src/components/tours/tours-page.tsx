'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  Pencil,
  Link2,
  MoreHorizontal,
  Globe,
  MapPin,
  Tag,
  Calendar,
  DollarSign,
  Check,
  Package,
  ArrowUpDown,
  Copy,
  Download,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ──────────────────────────────────────────────
// TypeScript Types
// ──────────────────────────────────────────────

interface Tour {
  id: string;
  tourName: string;
  websiteLink: string | null;
  tourLinkCtrip: string | null;
  tourLinkViator: string | null;
  tourLinkHeadout: string | null;
  tourLinkKlook: string | null;
  tourLinkExpedition: string | null;
  tourLinkCivitatis: string | null;
  destinationCity: string;
  supplierPriceAdult: string | null;
  supplierPriceChild: string | null;
  availabilityDay: string | null;
  inclusion: string | null;
  supplierInfo: string | null;
  websitePrice: string | null;
  ctripPrice: string | null;
  viatorPrice: string | null;
  klookPrice: string | null;
  expeditionPrice: string | null;
  civitatisPrice: string | null;
  headoutPrice: string | null;
  bookings: number;
  revenue: string | null;
  category: string | null;
  status: string;
  rating: number | null;
  sheetRow: number | null;
  createdAt: string;
  updatedAt: string;
}

interface ToursApiResponse {
  tours: Tour[];
  total: number;
  page: number;
  totalPages: number;
  filters: {
    destinations: string[];
    categories: string[];
  };
}

type SortField =
  | 'tourName'
  | 'destinationCity'
  | 'category'
  | 'supplierPriceAdult'
  | 'websitePrice'
  | 'ctripPrice'
  | 'viatorPrice'
  | 'availabilityDay'
  | 'status'
  | 'createdAt'
  | 'bookings';

interface FilterState {
  search: string;
  destination: string;
  category: string;
  status: string;
  availability: string;
  hasWebsite: boolean;
  hasCtrip: boolean;
  hasViator: boolean;
  hasKlook: boolean;
  hasExpedition: boolean;
  hasHeadout: boolean;
  hasCivitatis: boolean;
}

type EditField = 'name' | 'supplierPriceAdult' | 'supplierPriceChild' | 'websitePrice' | 'ctripPrice' | 'viatorPrice' | 'klookPrice' | 'expeditionPrice' | 'civitatisPrice' | 'headoutPrice' | 'status' | 'availabilityDay' | 'category';

interface EditValues {
  name: string;
  supplierPriceAdult: string;
  supplierPriceChild: string;
  websitePrice: string;
  ctripPrice: string;
  viatorPrice: string;
  klookPrice: string;
  expeditionPrice: string;
  civitatisPrice: string;
  headoutPrice: string;
  status: string;
  availabilityDay: string;
  category: string;
}

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'draft', label: 'Draft' },
];

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'All Availability' },
  { value: 'Every day', label: 'Every day' },
  { value: 'Specific days', label: 'Specific days' },
  { value: 'Ask availability', label: 'Ask availability' },
];

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const MARKETPLACES = [
  { key: 'hasWebsite' as const, label: 'Website', icon: Globe },
  { key: 'hasCtrip' as const, label: 'Ctrip', icon: Globe },
  { key: 'hasViator' as const, label: 'Viator', icon: Globe },
  { key: 'hasKlook' as const, label: 'Klook', icon: Globe },
  { key: 'hasExpedition' as const, label: 'Expedition', icon: Globe },
  { key: 'hasHeadout' as const, label: 'Headout', icon: Globe },
  { key: 'hasCivitatis' as const, label: 'Civitatis', icon: Globe },
];

const INITIAL_FILTERS: FilterState = {
  search: '',
  destination: '',
  category: '',
  status: '',
  availability: '',
  hasWebsite: false,
  hasCtrip: false,
  hasViator: false,
  hasKlook: false,
  hasExpedition: false,
  hasHeadout: false,
  hasCivitatis: false,
};

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function parsePrice(price: string | null | undefined): number {
  if (!price) return 0;
  const cleaned = price.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}

function formatPrice(price: string | null | undefined): string {
  if (!price) return '-';
  const num = parsePrice(price);
  if (num === 0) return '-';
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function getPriceColor(websitePrice: string | null, supplierPrice: string | null): string {
  const wp = parsePrice(websitePrice);
  const sp = parsePrice(supplierPrice);
  if (wp === 0 || sp === 0) return 'text-muted-foreground';
  return wp > sp ? 'text-emerald-600' : wp < sp ? 'text-red-500' : 'text-muted-foreground';
}

function getStatusBadgeClasses(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
    case 'inactive':
      return 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100';
    case 'draft':
      return 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100';
  }
}

function getAvailabilityBadgeClasses(availability: string | null): string {
  if (!availability) return 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100';
  const lower = (availability || '').toLowerCase();
  if (lower.includes('every day')) return 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
  if (lower.includes('ask')) return 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100';
  return 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100';
}

function countActiveFilters(filters: FilterState): number {
  let count = 0;
  if (filters.search) count++;
  if (filters.destination) count++;
  if (filters.category) count++;
  if (filters.status) count++;
  if (filters.availability) count++;
  if (filters.hasWebsite) count++;
  if (filters.hasCtrip) count++;
  if (filters.hasViator) count++;
  if (filters.hasKlook) count++;
  if (filters.hasExpedition) count++;
  if (filters.hasHeadout) count++;
  if (filters.hasCivitatis) count++;
  return count;
}

function copyToClipboard(text: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text);
  }
}

// ──────────────────────────────────────────────
// Sub-Components
// ──────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Package className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">No tours found</h3>
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

function TourCardMobile({
  tour,
  onView,
  onEdit,
  onCopyLink,
}: {
  tour: Tour;
  onView: (t: Tour) => void;
  onEdit: (t: Tour) => void;
  onCopyLink: (t: Tour) => void;
}) {
  return (
    <Card className="mb-3 py-4">
      <CardContent className="space-y-3 px-4 py-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="font-medium text-sm truncate">{tour.tourName}</p>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-xs">{tour.tourName}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Badge variant="outline" className={getStatusBadgeClasses(tour.status)}>
              {tour.status}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {tour.destinationCity}
          </span>
          {tour.category && (
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {tour.category}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted-foreground">Supplier:</span>
          <span className={cn('font-medium', getPriceColor(tour.websitePrice, tour.supplierPriceAdult))}>
            {formatPrice(tour.supplierPriceAdult)}
          </span>
          <span className="text-muted-foreground">Website:</span>
          <span className={cn('font-medium', getPriceColor(tour.websitePrice, tour.supplierPriceAdult))}>
            {formatPrice(tour.websitePrice)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getAvailabilityBadgeClasses(tour.availabilityDay)}>
            <Calendar className="h-3 w-3 mr-1" />
            {tour.availabilityDay || 'Ask availability'}
          </Badge>
        </div>

        <div className="flex items-center gap-1 pt-1 border-t">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(tour)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(tour)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onCopyLink(tour)}>
            <Link2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────
// Stats Summary Bar
// ──────────────────────────────────────────────

function StatsBar({ tours, total }: { tours: Tour[]; total: number }) {
  const activeCount = tours.filter(t => t.status === 'active').length;
  const ctripCount = tours.filter(t => t.tourLinkCtrip).length;
  const viatorCount = tours.filter(t => t.tourLinkViator).length;

  const stats = [
    { label: 'Total Tours', value: total, icon: Package, color: 'text-blue-600 bg-blue-50' },
    { label: 'Active Tours', value: activeCount, icon: Check, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Ctrip Listings', value: ctripCount, icon: Globe, color: 'text-violet-600 bg-violet-50' },
    { label: 'Viator Listings', value: viatorCount, icon: Globe, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map(stat => (
        <div
          key={stat.label}
          className="flex items-center gap-3 rounded-lg border bg-card p-3"
        >
          <div className={cn('flex items-center justify-center rounded-md p-2', stat.color)}>
            <stat.icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-2xl font-bold leading-none">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        </div>
      ))}
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
  availableCategories,
  activeFilterCount,
  onClearAll,
}: {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string | boolean) => void;
  availableDestinations: string[];
  availableCategories: string[];
  activeFilterCount: number;
  onClearAll: () => void;
}) {
  const [showMarketplaceFilters, setShowMarketplaceFilters] = useState(false);

  return (
    <div className="space-y-3">
      {/* Row 1: Main filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tours, destinations, inclusions..."
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

        <Select
          value={filters.destination}
          onValueChange={v => onFilterChange('destination', v === '__all__' ? '' : v)}
        >
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Destination" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Destinations</SelectItem>
            {availableDestinations.map(d => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.category}
          onValueChange={v => onFilterChange('category', v === '__all__' ? '' : v)}
        >
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Categories</SelectItem>
            {availableCategories.map(c => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={v => onFilterChange('status', v === '__all__' ? '' : v)}
        >
          <SelectTrigger className="w-[140px] h-9">
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

        <Select
          value={filters.availability}
          onValueChange={v => onFilterChange('availability', v === '__all__' ? '' : v)}
        >
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Availability" />
          </SelectTrigger>
          <SelectContent>
            {AVAILABILITY_OPTIONS.map(a => (
              <SelectItem key={a.value || '__all__'} value={a.value || '__all__'}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={() => setShowMarketplaceFilters(!showMarketplaceFilters)}
        >
          <Filter className="h-4 w-4 mr-1.5" />
          Marketplace
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-1.5 h-5 min-w-[20px] flex items-center justify-center px-1 text-[10px] font-bold"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={onClearAll}>
            <X className="h-3.5 w-3.5 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      {/* Row 2: Marketplace filter chips */}
      {showMarketplaceFilters && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border bg-muted/30">
          <span className="text-xs font-medium text-muted-foreground mr-1">Has listing:</span>
          {MARKETPLACES.map(mp => (
            <label
              key={mp.key}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border bg-background text-xs cursor-pointer hover:bg-accent transition-colors"
            >
              <Checkbox
                checked={filters[mp.key]}
                onCheckedChange={checked => onFilterChange(mp.key, !!checked)}
                className="size-3.5"
              />
              <span>{mp.label}</span>
            </label>
          ))}
        </div>
      )}
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
  fromItem,
  toItem,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
  fromItem: number;
  toItem: number;
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

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          Showing {fromItem} to {toItem} of {total} tours
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
// Tour Detail Dialog / Sheet
// ──────────────────────────────────────────────

function TourDetailDialog({
  tour,
  open,
  onClose,
  isEditing,
  editValues,
  onEditChange,
  onSave,
  onEdit,
  onCancelEdit,
}: {
  tour: Tour | null;
  open: boolean;
  onClose: () => void;
  isEditing: boolean;
  editValues: EditValues | null;
  onEditChange: (field: EditField, value: string) => void;
  onSave: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
}) {
  if (!tour) return null;

  const currentValues = isEditing && editValues ? editValues : {
    name: tour.tourName,
    supplierPriceAdult: tour.supplierPriceAdult || '',
    supplierPriceChild: tour.supplierPriceChild || '',
    websitePrice: tour.websitePrice || '',
    ctripPrice: tour.ctripPrice || '',
    viatorPrice: tour.viatorPrice || '',
    klookPrice: tour.klookPrice || '',
    expeditionPrice: tour.expeditionPrice || '',
    civitatisPrice: tour.civitatisPrice || '',
    headoutPrice: tour.headoutPrice || '',
    status: tour.status,
    availabilityDay: tour.availabilityDay || '',
    category: tour.category || '',
  };

  const marketplaceLinks = [
    { label: 'Website', url: tour.websiteLink },
    { label: 'Ctrip', url: tour.tourLinkCtrip },
    { label: 'Viator', url: tour.tourLinkViator },
    { label: 'Klook', url: tour.tourLinkKlook },
    { label: 'Expedition', url: tour.tourLinkExpedition },
    { label: 'Headout', url: tour.tourLinkHeadout },
    { label: 'Civitatis', url: tour.tourLinkCivitatis },
  ].filter(l => l.url);

  const pricingRows = [
    { label: 'Supplier (Adult)', value: formatPrice(currentValues.supplierPriceAdult) },
    { label: 'Supplier (Child)', value: formatPrice(currentValues.supplierPriceChild) },
    { label: 'Website', value: formatPrice(currentValues.websitePrice), compare: currentValues.supplierPriceAdult },
    { label: 'Ctrip', value: formatPrice(currentValues.ctripPrice), compare: currentValues.supplierPriceAdult },
    { label: 'Viator', value: formatPrice(currentValues.viatorPrice), compare: currentValues.supplierPriceAdult },
    { label: 'Klook', value: formatPrice(currentValues.klookPrice), compare: currentValues.supplierPriceAdult },
    { label: 'Expedition', value: formatPrice(currentValues.expeditionPrice), compare: currentValues.supplierPriceAdult },
    { label: 'Headout', value: formatPrice(currentValues.headoutPrice), compare: currentValues.supplierPriceAdult },
    { label: 'Civitatis', value: formatPrice(currentValues.civitatisPrice), compare: currentValues.supplierPriceAdult },
  ];

  const inclusions = tour.inclusion
    ? tour.inclusion.split(',').map(i => i.trim()).filter(Boolean)
    : [];

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="sm:max-w-2xl w-full p-0 overflow-hidden flex flex-col">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle className="text-lg">
            {isEditing ? (
              <Input
                value={currentValues.name}
                onChange={e => onEditChange('name', e.target.value)}
                className="text-lg font-semibold h-10"
              />
            ) : (
              tour.tourName
            )}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {currentValues.category ? `${tour.destinationCity} · ${currentValues.category}` : tour.destinationCity}
            </span>
            <Badge variant="outline" className={getStatusBadgeClasses(currentValues.status)}>
              {currentValues.status}
            </Badge>
            {tour.rating && (
              <span className="flex items-center gap-0.5 text-amber-500">
                {'★'.repeat(Math.round(tour.rating))}
                <span className="text-muted-foreground ml-0.5">{tour.rating.toFixed(1)}</span>
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 h-full">
          <div className="p-6 space-y-6">
            {/* Marketplace Links */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-muted-foreground" />
                Marketplace Links
              </h4>
              <div className="flex flex-wrap gap-2">
                {marketplaceLinks.length > 0 ? (
                  marketplaceLinks.map(link => (
                    <a
                      key={link.label}
                      href={link.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium bg-background hover:bg-accent transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {link.label}
                    </a>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No marketplace links available</p>
                )}
              </div>
            </div>

            {/* Pricing Comparison */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Pricing Comparison
              </h4>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Platform</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricingRows.map(row => (
                      <tr key={row.label} className="border-b last:border-0">
                        <td className="px-3 py-2 text-sm">
                          {isEditing && row.label !== 'Supplier (Adult)' && row.label !== 'Supplier (Child)' ? (
                            <Input
                              value={row.value === '-' ? '' : row.value.replace('$', '')}
                              onChange={e => {
                                const fieldMap: Record<string, EditField> = {
                                  'Website': 'websitePrice',
                                  'Ctrip': 'ctripPrice',
                                  'Viator': 'viatorPrice',
                                  'Klook': 'klookPrice',
                                  'Expedition': 'expeditionPrice',
                                  'Headout': 'headoutPrice',
                                  'Civitatis': 'civitatisPrice',
                                  'Supplier (Adult)': 'supplierPriceAdult',
                                  'Supplier (Child)': 'supplierPriceChild',
                                };
                                const field = fieldMap[row.label];
                                if (field) onEditChange(field, e.target.value);
                              }}
                              className="h-7 text-xs w-28"
                              placeholder="0"
                            />
                          ) : (
                            row.label
                          )}
                        </td>
                        <td className={cn('text-right px-3 py-2 text-sm font-medium', row.compare ? getPriceColor(row.value.replace('$', ''), row.compare) : '')}>
                          {row.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Availability & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Availability
                </h4>
                {isEditing ? (
                  <Input
                    value={currentValues.availabilityDay}
                    onChange={e => onEditChange('availabilityDay', e.target.value)}
                    className="h-9"
                    placeholder="e.g. Every day, Mon-Fri"
                  />
                ) : (
                  <Badge variant="outline" className={getAvailabilityBadgeClasses(tour.availabilityDay)}>
                    {tour.availabilityDay || 'Ask availability'}
                  </Badge>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  Category
                </h4>
                {isEditing ? (
                  <Input
                    value={currentValues.category}
                    onChange={e => onEditChange('category', e.target.value)}
                    className="h-9"
                    placeholder="e.g. Day Trip, Adventure"
                  />
                ) : (
                  <p className="text-sm">{tour.category || '-'}</p>
                )}
              </div>
            </div>

            {/* Edit: Status */}
            {isEditing && (
              <div>
                <h4 className="text-sm font-medium mb-2">Status</h4>
                <Select value={currentValues.status} onValueChange={v => onEditChange('status', v)}>
                  <SelectTrigger className="h-9 w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Inclusions */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <Check className="h-4 w-4 text-muted-foreground" />
                Inclusions
              </h4>
              {inclusions.length > 0 ? (
                <ul className="space-y-1">
                  {inclusions.map((inc, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                      {inc}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No inclusion details</p>
              )}
            </div>

            {/* Supplier Info */}
            {tour.supplierInfo && (
              <div>
                <h4 className="text-sm font-medium mb-2">Supplier Info</h4>
                <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">{tour.supplierInfo}</p>
              </div>
            )}

            {/* Meta */}
            <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
              <p>Sheet Row: {tour.sheetRow || '-'}</p>
              <p>Bookings: {tour.bookings}</p>
              <p>Revenue: {tour.revenue ? `$${tour.revenue}` : '-'}</p>
              <p>Created: {new Date(tour.createdAt).toLocaleDateString()}</p>
              <p>Updated: {new Date(tour.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="p-4 border-t bg-background flex flex-row gap-2 shrink-0">
          {isEditing ? (
            <>
              <Button variant="outline" className="flex-1" onClick={onCancelEdit}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={onSave}>
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Close
              </Button>
              <Button className="flex-1" onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-1.5" />
                Edit Tour
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ──────────────────────────────────────────────
// Main ToursPage Component
// ──────────────────────────────────────────────

export default function ToursPage() {
  // ── Data State ──
  const [data, setData] = useState<ToursApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Filter State ──
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  // ── Pagination State ──
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // ── Sort State ──
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // ── Selection State ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Detail Dialog State ──
  const [detailTour, setDetailTour] = useState<Tour | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<EditValues | null>(null);
  const [saving, setSaving] = useState(false);

  // ── URL Params Sync ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const newFilters: Partial<FilterState> = {};
    if (params.get('search')) newFilters.search = params.get('search')!;
    if (params.get('destination')) newFilters.destination = params.get('destination')!;
    if (params.get('category')) newFilters.category = params.get('category')!;
    if (params.get('status')) newFilters.status = params.get('status')!;
    if (params.get('availability')) newFilters.availability = params.get('availability')!;
    if (params.get('hasWebsite') === 'true') newFilters.hasWebsite = true;
    if (params.get('hasCtrip') === 'true') newFilters.hasCtrip = true;
    if (params.get('hasViator') === 'true') newFilters.hasViator = true;
    if (params.get('hasKlook') === 'true') newFilters.hasKlook = true;
    if (params.get('hasExpedition') === 'true') newFilters.hasExpedition = true;
    if (params.get('hasHeadout') === 'true') newFilters.hasHeadout = true;
    if (params.get('hasCivitatis') === 'true') newFilters.hasCivitatis = true;
    if (params.get('page')) setPage(parseInt(params.get('page')!));
    if (params.get('limit')) setPageSize(parseInt(params.get('limit')!));
    if (params.get('sortBy')) setSortField(params.get('sortBy') as SortField);
    if (params.get('sortOrder')) setSortOrder(params.get('sortOrder') as 'asc' | 'desc');

    if (Object.keys(newFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...newFilters }));
    }
  }, []);

  // ── Sync URL params ──
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.destination) params.set('destination', filters.destination);
    if (filters.category) params.set('category', filters.category);
    if (filters.status) params.set('status', filters.status);
    if (filters.availability) params.set('availability', filters.availability);
    if (filters.hasWebsite) params.set('hasWebsite', 'true');
    if (filters.hasCtrip) params.set('hasCtrip', 'true');
    if (filters.hasViator) params.set('hasViator', 'true');
    if (filters.hasKlook) params.set('hasKlook', 'true');
    if (filters.hasExpedition) params.set('hasExpedition', 'true');
    if (filters.hasHeadout) params.set('hasHeadout', 'true');
    if (filters.hasCivitatis) params.set('hasCivitatis', 'true');
    if (page > 1) params.set('page', String(page));
    if (pageSize !== 50) params.set('limit', String(pageSize));
    if (sortField !== 'createdAt') params.set('sortBy', sortField);
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder);

    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [filters, page, pageSize, sortField, sortOrder]);

  // ── Fetch Tours ──
  useEffect(() => {
    let cancelled = false;

    async function fetchTours() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (filters.search) params.set('search', filters.search);
        if (filters.destination) params.set('destination', filters.destination);
        if (filters.category) params.set('category', filters.category);
        if (filters.status) params.set('status', filters.status);
        if (filters.availability) params.set('availability', filters.availability);
        if (filters.hasWebsite) params.set('hasWebsite', 'true');
        if (filters.hasCtrip) params.set('hasCtrip', 'true');
        if (filters.hasViator) params.set('hasViator', 'true');
        if (filters.hasKlook) params.set('hasKlook', 'true');
        if (filters.hasExpedition) params.set('hasExpedition', 'true');
        if (filters.hasHeadout) params.set('hasHeadout', 'true');
        if (filters.hasCivitatis) params.set('hasCivitatis', 'true');
        params.set('page', String(page));
        params.set('limit', String(pageSize));
        params.set('sortBy', sortField);
        params.set('sortOrder', sortOrder);

        const res = await fetch(`/api/tours?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: ToursApiResponse = await res.json();
        if (!cancelled) {
          setData(json);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch tours');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchTours();

    return () => {
      cancelled = true;
    };
  }, [filters, page, pageSize, sortField, sortOrder]);

  // ── Handlers ──
  const handleFilterChange = useCallback((key: keyof FilterState, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
    setSelectedIds(new Set());
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
    setSelectedIds(new Set());
  }, []);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortOrder('asc');
      }
    },
    [sortField]
  );

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    setSelectedIds(new Set());
  }, []);

  const handleSelectAll = useCallback(() => {
    if (!data) return;
    if (selectedIds.size === data.tours.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.tours.map(t => t.id)));
    }
  }, [data, selectedIds.size]);

  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleViewTour = useCallback((tour: Tour) => {
    setDetailTour(tour);
    setIsEditing(false);
    setEditValues(null);
    setDialogOpen(true);
  }, []);

  const handleEditTour = useCallback((tour: Tour) => {
    setDetailTour(tour);
    setIsEditing(true);
    setEditValues({
      name: tour.tourName,
      supplierPriceAdult: tour.supplierPriceAdult || '',
      supplierPriceChild: tour.supplierPriceChild || '',
      websitePrice: tour.websitePrice || '',
      ctripPrice: tour.ctripPrice || '',
      viatorPrice: tour.viatorPrice || '',
      klookPrice: tour.klookPrice || '',
      expeditionPrice: tour.expeditionPrice || '',
      civitatisPrice: tour.civitatisPrice || '',
      headoutPrice: tour.headoutPrice || '',
      status: tour.status,
      availabilityDay: tour.availabilityDay || '',
      category: tour.category || '',
    });
    setDialogOpen(true);
  }, []);

  const handleEditChange = useCallback((field: EditField, value: string) => {
    setEditValues(prev => (prev ? { ...prev, [field]: value } : null));
  }, []);

  const handleSave = useCallback(async () => {
    if (!detailTour || !editValues) return;
    setSaving(true);
    try {
      const res = await fetch('/api/tours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: detailTour.id,
          tourName: editValues.name,
          supplierPriceAdult: editValues.supplierPriceAdult,
          supplierPriceChild: editValues.supplierPriceChild,
          websitePrice: editValues.websitePrice,
          ctripPrice: editValues.ctripPrice,
          viatorPrice: editValues.viatorPrice,
          klookPrice: editValues.klookPrice,
          expeditionPrice: editValues.expeditionPrice,
          civitatisPrice: editValues.civitatisPrice,
          headoutPrice: editValues.headoutPrice,
          status: editValues.status,
          availabilityDay: editValues.availabilityDay,
          category: editValues.category,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      setIsEditing(false);
      setEditValues(null);
      // Re-fetch to get updated data
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.destination) params.set('destination', filters.destination);
      if (filters.category) params.set('category', filters.category);
      if (filters.status) params.set('status', filters.status);
      if (filters.availability) params.set('availability', filters.availability);
      if (filters.hasWebsite) params.set('hasWebsite', 'true');
      if (filters.hasCtrip) params.set('hasCtrip', 'true');
      if (filters.hasViator) params.set('hasViator', 'true');
      if (filters.hasKlook) params.set('hasKlook', 'true');
      if (filters.hasExpedition) params.set('hasExpedition', 'true');
      if (filters.hasHeadout) params.set('hasHeadout', 'true');
      if (filters.hasCivitatis) params.set('hasCivitatis', 'true');
      params.set('page', String(page));
      params.set('limit', String(pageSize));
      params.set('sortBy', sortField);
      params.set('sortOrder', sortOrder);
      const json = await (await fetch(`/api/tours?${params.toString()}`)).json();
      setData(json);
    } catch {
      // keep editing open
    } finally {
      setSaving(false);
    }
  }, [detailTour, editValues, filters, page, pageSize, sortField, sortOrder]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditValues(null);
  }, []);

  const handleCopyLink = useCallback((tour: Tour) => {
    const links = [
      tour.websiteLink && `Website: ${tour.websiteLink}`,
      tour.tourLinkCtrip && `Ctrip: ${tour.tourLinkCtrip}`,
      tour.tourLinkViator && `Viator: ${tour.tourLinkViator}`,
      tour.tourLinkKlook && `Klook: ${tour.tourLinkKlook}`,
      tour.tourLinkExpedition && `Expedition: ${tour.tourLinkExpedition}`,
      tour.tourLinkHeadout && `Headout: ${tour.tourLinkHeadout}`,
      tour.tourLinkCivitatis && `Civitatis: ${tour.tourLinkCivitatis}`,
    ].filter(Boolean);

    if (links.length > 0) {
      copyToClipboard(`${tour.tourName}\n${links.join('\n')}`);
    } else if (tour.websiteLink) {
      copyToClipboard(tour.websiteLink);
    }
  }, []);

  const handleBulkStatusChange = useCallback(
    async (newStatus: string) => {
      if (selectedIds.size === 0) return;
      try {
        await Promise.all(
          Array.from(selectedIds).map(id =>
            fetch('/api/tours', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, status: newStatus }),
            })
          )
        );
        setSelectedIds(new Set());
        // Trigger re-fetch by incrementing page then decrementing
        setPage(prev => {
          const next = prev + 1;
          return next - 1;
        });
      } catch {
        // silent fail
      }
    },
    [selectedIds]
  );

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setTimeout(() => {
      setDetailTour(null);
      setIsEditing(false);
      setEditValues(null);
    }, 200);
  }, []);

  // ── Computed Values ──
  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);
  const fromItem = useMemo(() => (page - 1) * pageSize + 1, [page, pageSize]);
  const toItem = useMemo(
    () => Math.min(page * pageSize, data?.total || 0),
    [page, pageSize, data?.total]
  );
  const isAllSelected = useMemo(
    () => data ? selectedIds.size === data.tours.length && data.tours.length > 0 : false,
    [data, selectedIds.size]
  );

  // ── Sort header render helper ──
  const SortHeader = ({
    field,
    children,
    className,
  }: {
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }) => (
    <Button
      variant="ghost"
      size="sm"
      className={cn('-ml-3 h-8 gap-1 text-xs font-medium', className)}
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className={cn('h-3.5 w-3.5', sortField === field ? 'opacity-100' : 'opacity-40')} />
    </Button>
  );

  // ── Render ──
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 min-h-screen bg-background">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tours</h1>
          <p className="text-sm text-muted-foreground">
            Manage your tour inventory, pricing, and marketplace listings
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Check className="h-4 w-4 mr-1.5" />
                  Bulk Actions ({selectedIds.size})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleBulkStatusChange('active')}>
                  <Check className="h-4 w-4 mr-2" />
                  Set Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusChange('inactive')}>
                  <X className="h-4 w-4 mr-2" />
                  Set Inactive
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusChange('draft')}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Set Draft
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    const selectedTours = data?.tours.filter(t => selectedIds.has(t.id)) || [];
                    const csvContent = [
                      ['Tour Name', 'Destination', 'Category', 'Status', 'Supplier Price', 'Website Price'].join(','),
                      ...selectedTours.map(t =>
                        [
                          `"${t.tourName}"`,
                          `"${t.destinationCity}"`,
                          `"${t.category || ''}"`,
                          t.status,
                          t.supplierPriceAdult || '',
                          t.websitePrice || '',
                        ].join(',')
                      ),
                    ].join('\n');
                    copyToClipboard(csvContent);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Copy as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        availableDestinations={data?.filters.destinations || []}
        availableCategories={data?.filters.categories || []}
        activeFilterCount={activeFilterCount}
        onClearAll={handleClearAllFilters}
      />

      {/* Stats Bar */}
      {data && !loading && (
        <StatsBar tours={data.tours} total={data.total} />
      )}

      {/* Table / Card View */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        {loading && !data ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState message={error} />
        ) : data && data.tours.length === 0 ? (
          <EmptyState onClear={handleClearAllFilters} />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <div className="max-h-[70vh] overflow-y-auto table-scroll">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur-sm z-10">
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          className="size-3.5"
                        />
                      </TableHead>
                      <TableHead className="min-w-[200px]">
                        <SortHeader field="tourName">Tour Name</SortHeader>
                      </TableHead>
                      <TableHead className="min-w-[120px]">
                        <SortHeader field="destinationCity">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Destination
                          </span>
                        </SortHeader>
                      </TableHead>
                      <TableHead className="min-w-[100px]">
                        <SortHeader field="category">
                          <span className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            Category
                          </span>
                        </SortHeader>
                      </TableHead>
                      <TableHead className="min-w-[100px] text-right">
                        <SortHeader field="supplierPriceAdult">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Supplier
                          </span>
                        </SortHeader>
                      </TableHead>
                      <TableHead className="min-w-[100px] text-right">
                        <SortHeader field="websitePrice">Website</SortHeader>
                      </TableHead>
                      <TableHead className="min-w-[100px] text-right">
                        <SortHeader field="ctripPrice">Ctrip</SortHeader>
                      </TableHead>
                      <TableHead className="min-w-[100px] text-right">
                        <SortHeader field="viatorPrice">Viator</SortHeader>
                      </TableHead>
                      <TableHead className="min-w-[120px]">
                        <SortHeader field="availabilityDay">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Availability
                          </span>
                        </SortHeader>
                      </TableHead>
                      <TableHead className="min-w-[90px]">
                        <SortHeader field="status">Status</SortHeader>
                      </TableHead>
                      <TableHead className="w-24 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={`skel-${i}`}>
                          {Array.from({ length: 11 }).map((_, j) => (
                            <TableCell key={j}>
                              <Skeleton className="h-5 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                    {!loading &&
                      data.tours.map(tour => (
                        <TableRow
                          key={tour.id}
                          className={cn(
                            'group cursor-pointer',
                            selectedIds.has(tour.id) && 'bg-muted/50'
                          )}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(tour.id)}
                              onCheckedChange={() => handleSelectOne(tour.id)}
                              className="size-3.5"
                              onClick={e => e.stopPropagation()}
                            />
                          </TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  className="text-left text-sm font-medium truncate max-w-[280px] flex items-center gap-1.5 hover:text-primary transition-colors"
                                  onClick={() => handleViewTour(tour)}
                                >
                                  <span className="truncate">{tour.tourName}</span>
                                  {tour.websiteLink && (
                                    <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="max-w-md">
                                <p className="text-xs font-medium">{tour.tourName}</p>
                                {tour.websiteLink && (
                                  <p className="text-xs text-muted-foreground mt-1 truncate max-w-sm">
                                    {tour.websiteLink}
                                  </p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {tour.destinationCity}
                          </TableCell>
                          <TableCell>
                            {tour.category ? (
                              <Badge variant="outline" className="text-xs font-normal">
                                {tour.category}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {formatPrice(tour.supplierPriceAdult)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              'text-right text-sm font-medium',
                              getPriceColor(tour.websitePrice, tour.supplierPriceAdult)
                            )}
                          >
                            {formatPrice(tour.websitePrice)}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {formatPrice(tour.ctripPrice)}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {formatPrice(tour.viatorPrice)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[11px]',
                                getAvailabilityBadgeClasses(tour.availabilityDay)
                              )}
                            >
                              {tour.availabilityDay || 'Ask availability'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn('text-[11px]', getStatusBadgeClasses(tour.status))}
                            >
                              {tour.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-0.5">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleViewTour(tour);
                                    }}
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View details</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleEditTour(tour);
                                    }}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit tour</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleCopyLink(tour);
                                    }}
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copy links</TooltipContent>
                              </Tooltip>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewTour(tour)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditTour(tour)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit Tour
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleCopyLink(tour)}>
                                    <Link2 className="h-4 w-4 mr-2" />
                                    Copy Links
                                  </DropdownMenuItem>
                                  {tour.websiteLink && (
                                    <DropdownMenuItem asChild>
                                      <a
                                        href={tour.websiteLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Open Website
                                      </a>
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden p-3 max-h-[70vh] overflow-y-auto table-scroll">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-36 w-full rounded-xl" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      className="size-3.5"
                    />
                    <span className="text-xs text-muted-foreground">
                      Select all ({data.tours.length})
                    </span>
                  </div>
                  <div>
                    {data.tours.map(tour => (
                      <div key={tour.id} className={cn(selectedIds.has(tour.id) && 'opacity-75')}>
                        <TourCardMobile
                          tour={tour}
                          onView={handleViewTour}
                          onEdit={handleEditTour}
                          onCopyLink={handleCopyLink}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Pagination */}
            {data && (
              <Pagination
                page={page}
                totalPages={data.totalPages}
                total={data.total}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={handlePageSizeChange}
                fromItem={fromItem}
                toItem={toItem}
              />
            )}
          </>
        )}
      </div>

      {/* Tour Detail Sheet */}
      <TourDetailDialog
        tour={detailTour}
        open={dialogOpen}
        onClose={handleCloseDialog}
        isEditing={isEditing}
        editValues={editValues}
        onEditChange={handleEditChange}
        onSave={handleSave}
        onEdit={() => {
          if (detailTour) handleEditTour(detailTour);
        }}
        onCancelEdit={handleCancelEdit}
      />

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .table-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .table-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .table-scroll::-webkit-scrollbar-thumb {
          background: hsl(var(--border));
          border-radius: 3px;
        }
        .table-scroll::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.5);
        }
      `}</style>
    </div>
  );
}
