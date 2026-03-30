'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Send,
  Bell,
  MessageSquare,
  Mail,
  Phone,
  Users,
  AlertTriangle,
  Check,
  Clock,
  Trash2,
  Copy,
  Zap,
  Globe,
  Megaphone,
  CheckCheck,
  Info,
  AlertCircle,
  X,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ──────────────────────────────────────────────
// TypeScript Types
// ──────────────────────────────────────────────

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string | null;
  isActive: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  channel: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

type Channel = 'whatsapp' | 'email' | 'wechat' | 'in-app';
type Priority = 'normal' | 'high' | 'urgent';
type NotificationType = 'info' | 'warning' | 'alert' | 'success';

interface MessageTemplate {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  channel: Channel;
  priority: Priority;
  icon: React.ElementType;
}

interface ComposeForm {
  title: string;
  message: string;
  channel: Channel;
  type: NotificationType;
  priority: Priority;
  recipientIds: string[];
}

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const CHANNEL_OPTIONS: { value: Channel; label: string; color: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp', color: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
  { value: 'email', label: 'Email', color: 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100' },
  { value: 'wechat', label: 'WeChat', color: 'bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-100' },
  { value: 'in-app', label: 'In-App', color: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100' },
];

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: 'normal', label: 'Normal', color: 'bg-gray-100 text-gray-600' },
  { value: 'high', label: 'High', color: 'bg-amber-100 text-amber-700' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' },
];

const TYPE_OPTIONS: { value: NotificationType; label: string; color: string }[] = [
  { value: 'info', label: 'Info', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'warning', label: 'Warning', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'alert', label: 'Alert', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'success', label: 'Success', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
];

const INITIAL_COMPOSE: ComposeForm = {
  title: '',
  message: '',
  channel: 'in-app',
  type: 'info',
  priority: 'normal',
  recipientIds: [],
};

const TEMPLATES: MessageTemplate[] = [
  {
    id: 'alert-all',
    title: 'Important System Notice',
    message: 'Please be advised of an important update regarding our tour operations. All staff members are requested to review the latest guidelines and ensure compliance. Thank you for your cooperation.',
    type: 'alert',
    channel: 'in-app',
    priority: 'high',
    icon: Megaphone,
  },
  {
    id: 'price-update',
    title: 'Tour Price Update',
    message: 'We have updated our tour pricing for the upcoming season. Please review the new rates in the tours management section. Updated prices will be reflected across all marketplaces.',
    type: 'warning',
    channel: 'email',
    priority: 'normal',
    icon: AlertTriangle,
  },
  {
    id: 'new-tour',
    title: 'New Tour Available',
    message: 'A new tour has been added to our catalog! Check out the details and make sure all marketplace listings are up to date. Contact operations for more information.',
    type: 'info',
    channel: 'in-app',
    priority: 'normal',
    icon: Globe,
  },
  {
    id: 'cancellation',
    title: 'Urgent: Tour Cancellation Notice',
    message: 'An urgent tour cancellation has been processed. All affected bookings need to be reviewed and customers notified immediately. Please check the bookings section for details.',
    type: 'alert',
    channel: 'whatsapp',
    priority: 'urgent',
    icon: AlertCircle,
  },
];

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function getChannelBadgeClasses(channel: string | null): string {
  if (!channel) return 'bg-gray-100 text-gray-700 border-gray-200';
  switch ((channel || '').toLowerCase()) {
    case 'whatsapp': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'email': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'wechat': return 'bg-teal-100 text-teal-700 border-teal-200';
    case 'in-app': return 'bg-gray-100 text-gray-700 border-gray-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function getTypeIcon(type: string) {
  switch ((type || '').toLowerCase()) {
    case 'info': return <Info className="h-4 w-4 text-blue-500" />;
    case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'alert': return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'success': return <Check className="h-4 w-4 text-emerald-500" />;
    default: return <Bell className="h-4 w-4 text-gray-500" />;
  }
}

function getTypeBadgeClasses(type: string): string {
  switch ((type || '').toLowerCase()) {
    case 'info': return 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100';
    case 'warning': return 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100';
    case 'alert': return 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100';
    case 'success': return 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
    default: return 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100';
  }
}

function getChannelIcon(channel: string | null) {
  switch (channel?.toLowerCase()) {
    case 'whatsapp': return <Phone className="h-3.5 w-3.5" />;
    case 'email': return <Mail className="h-3.5 w-3.5" />;
    case 'wechat': return <MessageSquare className="h-3.5 w-3.5" />;
    case 'in-app': return <Bell className="h-3.5 w-3.5" />;
    default: return <Bell className="h-3.5 w-3.5" />;
  }
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getInitials(name: string): string {
  return (name || '')
    .split(' ')
    .map(w => w?.[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ──────────────────────────────────────────────
// Sub-Components
// ──────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="lg:col-span-3 space-y-3">
          <Skeleton className="h-6 w-48" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="rounded-full bg-red-50 p-4 mb-4">
        <AlertCircle className="h-10 w-10 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold mb-1">Something went wrong</h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <Zap className="h-4 w-4 mr-1.5" />
        Try Again
      </Button>
    </div>
  );
}

function QuickActionCard({
  template,
  onClick,
}: {
  template: MessageTemplate;
  onClick: (t: MessageTemplate) => void;
}) {
  const Icon = template.icon;
  const priorityColor = PRIORITY_OPTIONS.find(p => p.value === template.priority)?.color;

  return (
    <button
      onClick={() => onClick(template)}
      className="flex items-start gap-3 rounded-lg border p-4 text-left hover:bg-accent/50 transition-colors w-full"
    >
      <div className="rounded-lg bg-muted p-2 shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium truncate">{template.title}</span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{template.message}</p>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', priorityColor)}>
            {template.priority}
          </Badge>
          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', getTypeBadgeClasses(template.type))}>
            {template.type}
          </Badge>
        </div>
      </div>
    </button>
  );
}

function RecipientSelector({
  users,
  selected,
  onChange,
  open,
  onToggle,
}: {
  users: User[];
  selected: string[];
  onChange: (ids: string[]) => void;
  open: boolean;
  onToggle: () => void;
}) {
  const activeUsers = users.filter(u => u.isActive);

  const handleToggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const handleSelectAll = () => {
    if (selected.length === activeUsers.length) {
      onChange([]);
    } else {
      onChange(activeUsers.map(u => u.id));
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'flex items-center justify-between w-full rounded-md border px-3 py-2 text-sm',
          'hover:bg-accent transition-colors',
          open ? 'ring-2 ring-ring ring-offset-2' : ''
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          {selected.length === 0 ? (
            <span className="text-muted-foreground">Select recipients...</span>
          ) : (
            <span className="truncate">
              {selected.length} recipient{selected.length !== 1 ? 's' : ''} selected
            </span>
          )}
        </div>
        {selected.length > 0 && (
          <Badge variant="secondary" className="ml-2 text-xs shrink-0">
            {selected.length}
          </Badge>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onToggle} />
          <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover p-2 shadow-lg">
            <div className="flex items-center justify-between px-2 py-1.5 mb-1">
              <span className="text-xs font-medium text-muted-foreground">
                {activeUsers.length} users
              </span>
              <button
                onClick={handleSelectAll}
                className="text-xs text-primary hover:underline"
              >
                {selected.length === activeUsers.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <ScrollArea className="max-h-60">
              <div className="space-y-0.5">
                {activeUsers.map(user => (
                  <label
                    key={user.id}
                    className={cn(
                      'flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer',
                      'hover:bg-accent transition-colors',
                      selected.includes(user.id) && 'bg-accent/50'
                    )}
                  >
                    <Checkbox
                      checked={selected.includes(user.id)}
                      onCheckedChange={() => handleToggle(user.id)}
                      className="size-4"
                    />
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarFallback className="text-[10px] bg-muted">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                      {user.role}
                    </Badge>
                  </label>
                ))}
              </div>
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
}

function NotificationCard({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-accent/30',
        !notification.isRead && 'bg-blue-50/50 border-blue-100'
      )}
    >
      <div className="rounded-lg bg-muted p-2 shrink-0 mt-0.5">
        {getTypeIcon(notification.type)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className={cn('text-sm truncate', !notification.isRead && 'font-semibold')}>
                {notification.title}
              </h4>
              {!notification.isRead && (
                <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!notification.isRead && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onMarkRead(notification.id)}
                title="Mark as read"
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', getTypeBadgeClasses(notification.type))}>
            {notification.type}
          </Badge>
          {notification.channel && (
            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', getChannelBadgeClasses(notification.channel))}>
              {getChannelIcon(notification.channel)}
              <span className="ml-1 capitalize">{notification.channel}</span>
            </Badge>
          )}
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
            <Clock className="h-3 w-3" />
            {formatTimeAgo(notification.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Compose Panel
// ──────────────────────────────────────────────

function ComposePanel({
  users,
  compose,
  onComposeChange,
  onSend,
  sending,
  onApplyTemplate,
}: {
  users: User[];
  compose: ComposeForm;
  onComposeChange: (update: Partial<ComposeForm>) => void;
  onSend: () => void;
  sending: boolean;
  onApplyTemplate: (t: MessageTemplate) => void;
}) {
  const [recipientOpen, setRecipientOpen] = useState(false);

  const isValid = compose.title.trim() && compose.message.trim();

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Send className="h-4 w-4 text-muted-foreground" />
          Compose Message
        </h3>

        <div className="space-y-4">
          {/* Recipients */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Recipients
            </label>
            <RecipientSelector
              users={users}
              selected={compose.recipientIds}
              onChange={ids => onComposeChange({ recipientIds: ids })}
              open={recipientOpen}
              onToggle={() => setRecipientOpen(!recipientOpen)}
            />
          </div>

          {/* Channel & Type Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Channel
              </label>
              <Select
                value={compose.channel}
                onValueChange={v => onComposeChange({ channel: v as Channel })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNEL_OPTIONS.map(ch => (
                    <SelectItem key={ch.value} value={ch.value}>
                      <span className="flex items-center gap-2">
                        {ch.value === 'whatsapp' && <Phone className="h-3.5 w-3.5" />}
                        {ch.value === 'email' && <Mail className="h-3.5 w-3.5" />}
                        {ch.value === 'wechat' && <MessageSquare className="h-3.5 w-3.5" />}
                        {ch.value === 'in-app' && <Bell className="h-3.5 w-3.5" />}
                        {ch.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Type
              </label>
              <Select
                value={compose.type}
                onValueChange={v => onComposeChange({ type: v as NotificationType })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Priority
            </label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => onComposeChange({ priority: p.value })}
                  className={cn(
                    'flex-1 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                    compose.priority === p.value
                      ? p.color + ' border-current'
                      : 'bg-background hover:bg-accent'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Title
            </label>
            <Input
              placeholder="Message title..."
              value={compose.title}
              onChange={e => onComposeChange({ title: e.target.value })}
              className="h-9"
            />
          </div>

          {/* Message Body */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Message
            </label>
            <Textarea
              placeholder="Type your message here..."
              value={compose.message}
              onChange={e => onComposeChange({ message: e.target.value })}
              rows={5}
              className="resize-none text-sm"
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={onSend}
            disabled={!isValid || sending}
            className="w-full"
          >
            {sending ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Notification
              </>
            )}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4 text-muted-foreground" />
          Quick Actions
        </h3>
        <div className="space-y-2">
          {TEMPLATES.map(template => (
            <QuickActionCard
              key={template.id}
              template={template}
              onClick={onApplyTemplate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main CommunicationsPage Component
// ──────────────────────────────────────────────

export default function CommunicationsPage() {
  // ── Data State ──
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Compose State ──
  const [compose, setCompose] = useState<ComposeForm>(INITIAL_COMPOSE);
  const [sending, setSending] = useState(false);

  // ── Active Tab ──
  const [activeTab, setActiveTab] = useState('compose');

  // ── Template Dialog ──
  const [templateDialog, setTemplateDialog] = useState<MessageTemplate | null>(null);

  // ── Fetch Users ──
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Users fetch error:', err);
    }
  }, []);

  // ── Fetch Notifications ──
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const data: NotificationsResponse = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Notifications fetch error:', err);
    }
  }, []);

  // ── Initial Load ──
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchUsers(), fetchNotifications()]);
      } catch {
        setError('Failed to load communication data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchUsers, fetchNotifications]);

  // ── Mark as Read ──
  const handleMarkRead = useCallback(async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Mark read error:', err);
    }
  }, []);

  // ── Mark All as Read ──
  const handleMarkAllRead = useCallback(async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  }, []);

  // ── Send Notification ──
  const handleSend = useCallback(async () => {
    if (!compose.title.trim() || !compose.message.trim()) return;

    setSending(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: compose.title,
          message: compose.message,
          type: compose.type,
          channel: compose.channel,
          recipientIds: compose.recipientIds.length > 0 ? compose.recipientIds : undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to send notification');

      setCompose(INITIAL_COMPOSE);
      await fetchNotifications();
      setActiveTab('notifications');
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setSending(false);
    }
  }, [compose, fetchNotifications]);

  // ── Apply Template ──
  const handleApplyTemplate = useCallback((template: MessageTemplate) => {
    setCompose({
      ...INITIAL_COMPOSE,
      title: template.title,
      message: template.message,
      channel: template.channel,
      type: template.type,
      priority: template.priority,
    });
    setActiveTab('compose');
    setTemplateDialog(template);
  }, []);

  // ── Compose Change ──
  const handleComposeChange = useCallback((update: Partial<ComposeForm>) => {
    setCompose(prev => ({ ...prev, ...update }));
  }, []);

  // ── Filter notifications ──
  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);

  // ── Render ──
  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); setError(null); }} />;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            Communications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Send notifications and manage team communications
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Bell className="h-3.5 w-3.5 mr-1.5" />
              {unreadCount} unread
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="h-4 w-4 mr-1.5" />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
          <div className="flex items-center justify-center rounded-md p-2 bg-blue-50 text-blue-600">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <p className="text-2xl font-bold leading-none">{notifications.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Total</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
          <div className="flex items-center justify-center rounded-md p-2 bg-amber-50 text-amber-600">
            <Mail className="h-4 w-4" />
          </div>
          <div>
            <p className="text-2xl font-bold leading-none">{unreadCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Unread</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
          <div className="flex items-center justify-center rounded-md p-2 bg-emerald-50 text-emerald-600">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <p className="text-2xl font-bold leading-none">{users.filter(u => u.isActive).length}</p>
            <p className="text-xs text-muted-foreground mt-1">Active Users</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
          <div className="flex items-center justify-center rounded-md p-2 bg-purple-50 text-purple-600">
            <Send className="h-4 w-4" />
          </div>
          <div>
            <p className="text-2xl font-bold leading-none">
              {notifications.filter(n => n.channel === 'whatsapp').length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">WhatsApp</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Compose & Quick Actions */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-5">
              <ComposePanel
                users={users}
                compose={compose}
                onComposeChange={handleComposeChange}
                onSend={handleSend}
                sending={sending}
                onApplyTemplate={handleApplyTemplate}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: Notifications */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Notifications
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {notifications.length} notification{notifications.length !== 1 ? 's' : ''} total
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={fetchNotifications}
                  title="Refresh"
                >
                  <Zap className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="px-5 border-b">
                  <TabsList className="h-9 bg-transparent p-0">
                    <TabsTrigger value="all" className="text-xs data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-3">
                      All ({notifications.length})
                    </TabsTrigger>
                    <TabsTrigger value="unread" className="text-xs data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-3">
                      Unread ({unreadCount})
                    </TabsTrigger>
                    <TabsTrigger value="read" className="text-xs data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-3">
                      Read ({readNotifications.length})
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="all" className="mt-0">
                  <NotificationList
                    notifications={notifications}
                    onMarkRead={handleMarkRead}
                    emptyMessage="No notifications yet"
                  />
                </TabsContent>
                <TabsContent value="unread" className="mt-0">
                  <NotificationList
                    notifications={unreadNotifications}
                    onMarkRead={handleMarkRead}
                    emptyMessage="All caught up! No unread notifications"
                  />
                </TabsContent>
                <TabsContent value="read" className="mt-0">
                  <NotificationList
                    notifications={readNotifications}
                    onMarkRead={handleMarkRead}
                    emptyMessage="No read notifications"
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Templates Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Copy className="h-4 w-4" />
            Message Templates
          </CardTitle>
          <CardDescription>
            Pre-built templates for common communication scenarios. Click to load into compose.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TEMPLATES.map(template => {
              const Icon = template.icon;
              return (
                <button
                  key={template.id}
                  onClick={() => handleApplyTemplate(template)}
                  className="flex flex-col items-start gap-3 rounded-lg border p-4 text-left hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="rounded-lg bg-muted p-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', getTypeBadgeClasses(template.type))}>
                        {template.type}
                      </Badge>
                      <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', getChannelBadgeClasses(template.channel))}>
                        {template.channel}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">{template.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{template.message}</p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-auto">
                    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', PRIORITY_OPTIONS.find(p => p.value === template.priority)?.color)}>
                      {template.priority}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Template Applied Toast Dialog */}
      <Dialog
        open={!!templateDialog}
        onOpenChange={open => { if (!open) setTemplateDialog(null); }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-500" />
              Template Loaded
            </DialogTitle>
            <DialogDescription>
              The template has been loaded into the compose form. Review and send when ready.
            </DialogDescription>
          </DialogHeader>
          {templateDialog && (
            <div className="space-y-3 py-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Title</p>
                <p className="text-sm font-medium">{templateDialog.title}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Channel</p>
                <Badge variant="outline" className={cn(getChannelBadgeClasses(templateDialog.channel))}>
                  {templateDialog.channel}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Priority</p>
                <Badge variant="outline" className={cn(PRIORITY_OPTIONS.find(p => p.value === templateDialog.priority)?.color)}>
                  {templateDialog.priority}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialog(null)}>
              Close
            </Button>
            <Button onClick={() => { setTemplateDialog(null); setActiveTab('compose'); }}>
              <Send className="h-4 w-4 mr-1.5" />
              Go to Compose
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ──────────────────────────────────────────────
// Notification List (extracted for reuse)
// ──────────────────────────────────────────────

function NotificationList({
  notifications,
  onMarkRead,
  emptyMessage,
}: {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  emptyMessage: string;
}) {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="rounded-full bg-muted p-3 mb-3">
          <Bell className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[500px]">
      <div className="p-4 space-y-3">
        {notifications.map(notification => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onMarkRead={onMarkRead}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
