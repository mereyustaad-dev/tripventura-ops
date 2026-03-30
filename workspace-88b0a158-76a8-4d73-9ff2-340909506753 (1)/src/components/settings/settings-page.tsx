'use client';

import React, { useCallback, useMemo, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Shield,
  Key,
  Database,
  RefreshCw,
  Settings,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Globe,
  AlertCircle,
  Download,
  Upload,
  UserCircle,
  Clock,
  Mail,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ──────────────────────────────────────────────
// TypeScript Types
// ──────────────────────────────────────────────

interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string | null;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}

interface SyncLog {
  id: string;
  sheetUrl: string;
  status: string;
  totalRows: number;
  importedRows: number;
  error: string | null;
  startedAt: string;
  completedAt: string | null;
}

type Role = 'admin' | 'manager' | 'operations' | 'finance' | 'viewer';

interface AddUserForm {
  name: string;
  email: string;
  password: string;
  role: Role;
  department: string;
}

interface EditUserForm {
  id: string;
  name: string;
  role: Role;
  department: string;
  isActive: boolean;
}

interface SystemSettings {
  currency: string;
  dateFormat: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyReport: boolean;
  autoSync: boolean;
}

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const ROLE_CONFIG: Record<Role, { label: string; color: string; description: string }> = {
  admin: {
    label: 'Admin',
    color: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100',
    description: 'Full system access',
  },
  manager: {
    label: 'Manager',
    color: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100',
    description: 'Operations + Finance access',
  },
  operations: {
    label: 'Operations',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    description: 'Tour management, bookings',
  },
  finance: {
    label: 'Finance',
    color: 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100',
    description: 'Revenue, pricing analytics',
  },
  viewer: {
    label: 'Viewer',
    color: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100',
    description: 'Read-only dashboard access',
  },
};

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'operations', label: 'Operations' },
  { value: 'finance', label: 'Finance' },
  { value: 'viewer', label: 'Viewer' },
];

const SYNC_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Check },
  running: { label: 'Running', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: RefreshCw },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700 border-red-200', icon: X },
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Clock },
};

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'TRY', label: 'TRY (₺)' },
];

const DATE_FORMAT_OPTIONS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

const INITIAL_ADD_USER: AddUserForm = {
  name: '',
  email: '',
  password: '',
  role: 'viewer',
  department: '',
};

const INITIAL_EDIT_USER: EditUserForm = {
  id: '',
  name: '',
  role: 'viewer',
  department: '',
  isActive: true,
};

const DEFAULT_SETTINGS: SystemSettings = {
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  emailNotifications: true,
  pushNotifications: true,
  weeklyReport: false,
  autoSync: false,
};

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function getInitials(name: string): string {
  return (name || '')
    .split(' ')
    .map(w => w?.[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getRoleBadgeClasses(role: string): string {
  return ROLE_CONFIG[role as Role]?.color || ROLE_CONFIG.viewer.color;
}

function getSyncStatusBadgeClasses(status: string): string {
  return SYNC_STATUS_CONFIG[status]?.color || SYNC_STATUS_CONFIG.pending.color;
}

// ──────────────────────────────────────────────
// Sub-Components
// ──────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <Skeleton className="h-7 w-40 mb-1" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
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
        <RefreshCw className="h-4 w-4 mr-1.5" />
        Try Again
      </Button>
    </div>
  );
}

function RoleDescriptionsCard() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          Role Permissions
        </CardTitle>
        <CardDescription>Overview of access levels</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {ROLE_OPTIONS.map(role => {
            const config = ROLE_CONFIG[role.value];
            return (
              <div key={role.value} className="flex items-start gap-3 px-4 py-3">
                <Badge variant="outline" className={cn('text-xs shrink-0 mt-0.5', config.color)}>
                  {config.label}
                </Badge>
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileCard() {
  const [profile, setProfile] = useState({
    name: 'Current User',
    email: 'admin@tripventura.com',
    role: 'Admin',
    department: 'Management',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editDepartment, setEditDepartment] = useState(profile.department);

  const handleSave = () => {
    setProfile(prev => ({
      ...prev,
      name: editName,
      department: editDepartment,
    }));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(profile.name);
    setEditDepartment(profile.department);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <UserCircle className="h-4 w-4 text-muted-foreground" />
          My Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials(profile.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <Input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="h-8 text-sm mb-1"
              />
            ) : (
              <p className="text-sm font-semibold truncate">{profile.name}</p>
            )}
            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
          </div>
        </div>

        <div className="space-y-3">
          {isEditing ? (
            <div>
              <Label className="text-xs">Department</Label>
              <Input
                value={editDepartment}
                onChange={e => setEditDepartment(e.target.value)}
                className="h-8 text-sm mt-1"
              />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Role</span>
                <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-200">
                  <Shield className="h-3 w-3 mr-1" />
                  {profile.role}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Department</span>
                <span className="text-xs font-medium">{profile.department}</span>
              </div>
            </>
          )}
        </div>

        <Separator />

        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 h-8" onClick={handleCancel}>
              <X className="h-3.5 w-3.5 mr-1" />
              Cancel
            </Button>
            <Button size="sm" className="flex-1 h-8" onClick={handleSave}>
              <Check className="h-3.5 w-3.5 mr-1" />
              Save
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="w-full h-8" onClick={() => setIsEditing(true)}>
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Edit Profile
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function AddUserDialog({
  open,
  onOpenChange,
  onAdd,
  adding,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (form: AddUserForm) => void;
  adding: boolean;
}) {
  const [form, setForm] = useState<AddUserForm>(INITIAL_ADD_USER);

  const isValid = form.name.trim() && form.email.trim() && form.password.trim();

  const handleSubmit = () => {
    if (!isValid) return;
    onAdd(form);
    setForm(INITIAL_ADD_USER);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New User
          </DialogTitle>
          <DialogDescription>
            Create a new user account with the specified role and department.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs font-medium">Full Name *</Label>
            <Input
              placeholder="John Doe"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="h-9 mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-medium">Email *</Label>
            <Input
              placeholder="john@tripventura.com"
              type="email"
              value={form.email}
              onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
              className="h-9 mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-medium">Password *</Label>
            <div className="relative">
              <Key className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Minimum 8 characters"
                type="password"
                value={form.password}
                onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                className="h-9 mt-1 pl-9"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium">Role</Label>
              <Select
                value={form.role}
                onValueChange={v => setForm(prev => ({ ...prev, role: v as Role }))}
              >
                <SelectTrigger className="h-9 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(r => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Department</Label>
              <Input
                placeholder="e.g. Operations"
                value={form.department}
                onChange={e => setForm(prev => ({ ...prev, department: e.target.value }))}
                className="h-9 mt-1"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || adding}>
            {adding ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1.5" />
                Create User
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({
  user,
  open,
  onOpenChange,
  onSave,
  saving,
}: {
  user: EditUserForm | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (form: EditUserForm) => void;
  saving: boolean;
}) {
  // Use user directly as the source of truth via useMemo;
  const form = useMemo(() => user || INITIAL_EDIT_USER, [user]);
  const [localEdits, setLocalEdits] = useState<Partial<EditUserForm>>({});

  const currentForm = useMemo(
    () => ({ ...form, ...localEdits }),
    [form, localEdits]
  );

  if (!user && !open) return null;

  const isValid = currentForm.name.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Edit User
          </DialogTitle>
          <DialogDescription>
            Update user details and role assignment.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs font-medium">Full Name *</Label>
            <Input
              value={currentForm.name}
              onChange={e => setLocalEdits(prev => ({ ...prev, name: e.target.value }))}
              className="h-9 mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium">Role</Label>
              <Select
                value={currentForm.role}
                onValueChange={v => setLocalEdits(prev => ({ ...prev, role: v as Role }))}
              >
                <SelectTrigger className="h-9 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(r => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Department</Label>
              <Input
                value={currentForm.department}
                onChange={e => setLocalEdits(prev => ({ ...prev, department: e.target.value }))}
                className="h-9 mt-1"
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Account Status</p>
              <p className="text-xs text-muted-foreground">
                {currentForm.isActive ? 'User can log in and access the system' : 'User account is deactivated'}
              </p>
            </div>
            <Switch
              checked={currentForm.isActive}
              onCheckedChange={checked => setLocalEdits(prev => ({ ...prev, isActive: checked }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSave(currentForm)} disabled={!isValid || saving}>
            {saving ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-1.5" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UsersTable({
  users,
  onEdit,
  onToggleActive,
}: {
  users: UserRecord[];
  onEdit: (user: UserRecord) => void;
  onToggleActive: (user: UserRecord) => void;
}) {
  return (
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-5">User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="hidden lg:table-cell">Department</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden xl:table-cell">Last Login</TableHead>
            <TableHead className="text-right pr-5">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map(user => (
            <TableRow key={user.id}>
              <TableCell className="pl-5">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-[10px] bg-muted">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium truncate max-w-[140px]">{user.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground truncate max-w-[180px] block">
                  {user.email}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={cn('text-xs', getRoleBadgeClasses(user.role))}>
                  {ROLE_CONFIG[user.role as Role]?.label || user.role}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <span className="text-sm text-muted-foreground">
                  {user.department || '-'}
                </span>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    user.isActive
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  )}
                >
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                <span className="text-xs text-muted-foreground">
                  {formatDate(user.lastLogin)}
                </span>
              </TableCell>
              <TableCell className="text-right pr-5">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(user)}
                    title="Edit user"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-8 w-8',
                      user.isActive ? 'text-red-500 hover:text-red-700' : 'text-emerald-500 hover:text-emerald-700'
                    )}
                    onClick={() => onToggleActive(user)}
                    title={user.isActive ? 'Deactivate user' : 'Activate user'}
                  >
                    {user.isActive ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function UsersMobileCards({
  users,
  onEdit,
  onToggleActive,
}: {
  users: UserRecord[];
  onEdit: (user: UserRecord) => void;
  onToggleActive: (user: UserRecord) => void;
}) {
  return (
    <div className="md:hidden space-y-3 p-4">
      {users.map(user => (
        <Card key={user.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="text-xs bg-muted">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
              <Badge variant="outline" className={cn('text-[10px] shrink-0', getRoleBadgeClasses(user.role))}>
                {ROLE_CONFIG[user.role as Role]?.label || user.role}
              </Badge>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px]',
                    user.isActive
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  )}
                >
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
                {user.department && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {user.department}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(user)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-7 w-7',
                    user.isActive ? 'text-red-500' : 'text-emerald-500'
                  )}
                  onClick={() => onToggleActive(user)}
                >
                  {user.isActive ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main SettingsPage Component
// ──────────────────────────────────────────────

export default function SettingsPage() {
  // ── Data State ──
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Dialog State ──
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<EditUserForm | null>(null);

  // ── Action State ──
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Sync State ──
  const [sheetUrl, setSheetUrl] = useState('');
  const [syncing, setSyncing] = useState(false);

  // ── System Settings State (visual only) ──
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);

  // ── Active Tab ──
  const [activeTab, setActiveTab] = useState('users');

  // ── Fetch Users ──
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Users fetch error:', err);
      throw err;
    }
  }, []);

  // ── Fetch Sync Logs ──
  const fetchSyncLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/sync');
      if (!res.ok) throw new Error('Failed to fetch sync logs');
      const data = await res.json();
      setSyncLogs(data.syncLogs || []);
    } catch (err) {
      console.error('Sync logs fetch error:', err);
      throw err;
    }
  }, []);

  // ── Initial Load ──
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchUsers(), fetchSyncLogs()]);
      } catch {
        setError('Failed to load settings data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchUsers, fetchSyncLogs]);

  // ── Add User ──
  const handleAddUser = useCallback(async (form: AddUserForm) => {
    setAdding(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create user');
      }
      await fetchUsers();
      setAddDialogOpen(false);
    } catch (err) {
      console.error('Add user error:', err);
      alert(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setAdding(false);
    }
  }, [fetchUsers]);

  // ── Edit User ──
  const handleOpenEdit = useCallback((user: UserRecord) => {
    setEditUser({
      id: user.id,
      name: user.name,
      role: user.role as Role,
      department: user.department || '',
      isActive: user.isActive,
    });
    setEditDialogOpen(true);
  }, []);

  const handleSaveEdit = useCallback(async (form: EditUserForm) => {
    if (!form.id) return;
    setSaving(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to update user');
      await fetchUsers();
      setEditDialogOpen(false);
      setEditUser(null);
    } catch (err) {
      console.error('Edit user error:', err);
    } finally {
      setSaving(false);
    }
  }, [fetchUsers]);

  // ── Toggle Active ──
  const handleToggleActive = useCallback(async (user: UserRecord) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          name: user.name,
          role: user.role,
          department: user.department,
          isActive: !user.isActive,
        }),
      });
      if (!res.ok) throw new Error('Failed to update user');
      await fetchUsers();
    } catch (err) {
      console.error('Toggle active error:', err);
    }
  }, [fetchUsers]);

  // ── Sync ──
  const handleSync = useCallback(async () => {
    if (!sheetUrl.trim()) return;
    setSyncing(true);
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetUrl: sheetUrl.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Sync failed');
      }
      await fetchSyncLogs();
      setSheetUrl('');
      setActiveTab('sync');
    } catch (err) {
      console.error('Sync error:', err);
      alert(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }, [sheetUrl, fetchSyncLogs]);

  // ── Render ──
  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); setError(null); }} />;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage users, data sync, and system preferences
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="users" className="text-xs flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 hidden sm:block" />
            Users
          </TabsTrigger>
          <TabsTrigger value="sync" className="text-xs flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 hidden sm:block" />
            Data Sync
          </TabsTrigger>
          <TabsTrigger value="system" className="text-xs flex items-center gap-1.5">
            <Settings className="h-3.5 w-3.5 hidden sm:block" />
            System
          </TabsTrigger>
          <TabsTrigger value="profile" className="text-xs flex items-center gap-1.5">
            <UserCircle className="h-3.5 w-3.5 hidden sm:block" />
            Profile
          </TabsTrigger>
        </TabsList>

        {/* ─── Users Tab ─── */}
        <TabsContent value="users" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        User Management
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {users.length} user{users.length !== 1 ? 's' : ''} registered
                      </CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setAddDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-1.5" />
                      Add User
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="max-h-[500px]">
                    <UsersTable
                      users={users}
                      onEdit={handleOpenEdit}
                      onToggleActive={handleToggleActive}
                    />
                    <UsersMobileCards
                      users={users}
                      onEdit={handleOpenEdit}
                      onToggleActive={handleToggleActive}
                    />
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <RoleDescriptionsCard />
            </div>
          </div>
        </TabsContent>

        {/* ─── Data Sync Tab ─── */}
        <TabsContent value="sync" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    Import Data
                  </CardTitle>
                  <CardDescription>
                    Sync tour data from a Google Sheets spreadsheet.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs font-medium">Google Sheets URL</Label>
                    <div className="relative mt-1">
                      <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        value={sheetUrl}
                        onChange={e => setSheetUrl(e.target.value)}
                        className="h-9 pl-9 text-sm"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleSync}
                    disabled={!sheetUrl.trim() || syncing}
                    className="w-full"
                  >
                    {syncing ? (
                      <>
                        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1.5" />
                        Sync Now
                      </>
                    )}
                  </Button>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Tip:</span> Make sure the Google Sheet is published and accessible. The first row should contain column headers.
                    </p>
                  </div>

                  <Separator />

                  {/* Sync Stats */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">Sync History Summary</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-md border p-2.5 text-center">
                        <p className="text-lg font-bold">{syncLogs.length}</p>
                        <p className="text-[10px] text-muted-foreground">Total Syncs</p>
                      </div>
                      <div className="rounded-md border p-2.5 text-center">
                        <p className="text-lg font-bold text-emerald-600">
                          {syncLogs.filter(s => s.status === 'completed').length}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Successful</p>
                      </div>
                      <div className="rounded-md border p-2.5 text-center">
                        <p className="text-lg font-bold text-red-500">
                          {syncLogs.filter(s => s.status === 'failed').length}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Failed</p>
                      </div>
                      <div className="rounded-md border p-2.5 text-center">
                        <p className="text-lg font-bold">
                          {syncLogs.reduce((sum, s) => sum + s.importedRows, 0).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Rows Imported</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Sync History
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        Recent data import activity
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchSyncLogs}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="max-h-[500px]">
                    {syncLogs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 px-4">
                        <div className="rounded-full bg-muted p-3 mb-3">
                          <Database className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">No sync history yet</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Import data from Google Sheets to see sync logs here
                        </p>
                      </div>
                    ) : (
                      <div className="hidden md:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="pl-5">Status</TableHead>
                              <TableHead>Sheet URL</TableHead>
                              <TableHead className="text-center">Rows</TableHead>
                              <TableHead className="hidden lg:table-cell">Started</TableHead>
                              <TableHead className="hidden lg:table-cell">Duration</TableHead>
                              <TableHead className="hidden xl:table-cell">Error</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {syncLogs.map(log => {
                              const duration = log.completedAt && log.startedAt
                                ? `${Math.round((new Date(log.completedAt).getTime() - new Date(log.startedAt).getTime()) / 1000)}s`
                                : '-';
                              return (
                                <TableRow key={log.id}>
                                  <TableCell className="pl-5">
                                    <Badge variant="outline" className={cn('text-xs', getSyncStatusBadgeClasses(log.status))}>
                                      {SYNC_STATUS_CONFIG[log.status]?.label || log.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
                                      {log.sheetUrl}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className="text-xs font-mono">
                                      {log.importedRows}/{log.totalRows}
                                    </span>
                                  </TableCell>
                                  <TableCell className="hidden lg:table-cell">
                                    <span className="text-xs text-muted-foreground">
                                      {formatDateShort(log.startedAt)}
                                    </span>
                                  </TableCell>
                                  <TableCell className="hidden lg:table-cell">
                                    <span className="text-xs text-muted-foreground font-mono">
                                      {duration}
                                    </span>
                                  </TableCell>
                                  <TableCell className="hidden xl:table-cell">
                                    {log.error ? (
                                      <span className="text-xs text-red-500 truncate max-w-[150px] block" title={log.error}>
                                        {log.error}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                    {/* Mobile cards for sync logs */}
                    {syncLogs.length > 0 && (
                      <div className="md:hidden space-y-3 p-4">
                        {syncLogs.map(log => (
                          <div key={log.id} className="rounded-lg border p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className={cn('text-[10px]', getSyncStatusBadgeClasses(log.status))}>
                                {SYNC_STATUS_CONFIG[log.status]?.label || log.status}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {formatDateShort(log.startedAt)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{log.sheetUrl}</p>
                            <div className="flex items-center gap-3 text-[10px]">
                              <span className="font-mono">{log.importedRows}/{log.totalRows} rows</span>
                              {log.error && (
                                <span className="text-red-500 truncate">{log.error}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ─── System Settings Tab ─── */}
        <TabsContent value="system" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Display Settings */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    Display Preferences
                  </CardTitle>
                  <CardDescription>
                    Configure how data is displayed across the system
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium">Currency Display</Label>
                      <Select
                        value={settings.currency}
                        onValueChange={v => setSettings(prev => ({ ...prev, currency: v }))}
                      >
                        <SelectTrigger className="h-9 mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCY_OPTIONS.map(c => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Date Format</Label>
                      <Select
                        value={settings.dateFormat}
                        onValueChange={v => setSettings(prev => ({ ...prev, dateFormat: v }))}
                      >
                        <SelectTrigger className="h-9 mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DATE_FORMAT_OPTIONS.map(d => (
                            <SelectItem key={d.value} value={d.value}>
                              {d.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Preview</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: settings.currency,
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(1250)}
                      {' '}&middot;{' '}
                      {settings.dateFormat === 'MM/DD/YYYY' && '12/31/2025'}
                      {settings.dateFormat === 'DD/MM/YYYY' && '31/12/2025'}
                      {settings.dateFormat === 'YYYY-MM-DD' && '2025-12-31'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Notification Settings */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Control how and when you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Email Notifications</p>
                      <p className="text-xs text-muted-foreground">
                        Receive important updates via email
                      </p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={checked => setSettings(prev => ({ ...prev, emailNotifications: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Push Notifications</p>
                      <p className="text-xs text-muted-foreground">
                        Get real-time push notifications in the browser
                      </p>
                    </div>
                    <Switch
                      checked={settings.pushNotifications}
                      onCheckedChange={checked => setSettings(prev => ({ ...prev, pushNotifications: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Weekly Report</p>
                      <p className="text-xs text-muted-foreground">
                        Receive a weekly summary report via email
                      </p>
                    </div>
                    <Switch
                      checked={settings.weeklyReport}
                      onCheckedChange={checked => setSettings(prev => ({ ...prev, weeklyReport: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Auto Data Sync</p>
                      <p className="text-xs text-muted-foreground">
                        Automatically sync data from Google Sheets daily
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoSync}
                      onCheckedChange={checked => setSettings(prev => ({ ...prev, autoSync: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <RoleDescriptionsCard />
              <ProfileCard />
            </div>
          </div>
        </TabsContent>

        {/* ─── Profile Tab ─── */}
        <TabsContent value="profile" className="mt-6">
          <div className="max-w-lg mx-auto space-y-6">
            <ProfileCard />
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs font-medium">Current Password</Label>
                  <Input type="password" placeholder="Enter current password" className="h-9 mt-1.5" />
                </div>
                <div>
                  <Label className="text-xs font-medium">New Password</Label>
                  <Input type="password" placeholder="Enter new password" className="h-9 mt-1.5" />
                </div>
                <div>
                  <Label className="text-xs font-medium">Confirm New Password</Label>
                  <Input type="password" placeholder="Confirm new password" className="h-9 mt-1.5" />
                </div>
                <Button className="w-full" variant="outline">
                  <Key className="h-4 w-4 mr-1.5" />
                  Update Password
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add User Dialog */}
      <AddUserDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddUser}
        adding={adding}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        user={editUser}
        open={editDialogOpen}
        onOpenChange={open => { if (!open) { setEditDialogOpen(false); setEditUser(null); } }}
        onSave={handleSaveEdit}
        saving={saving}
      />
    </div>
  );
}
