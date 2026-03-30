'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useAppStore } from '@/stores/app-store';
import { LoginPage } from '@/components/login-page';
import DashboardPage from '@/components/dashboard/dashboard-page';
import ToursPage from '@/components/tours/tours-page';
import AnalyticsPage from '@/components/analytics/analytics-page';
import BookingsPage from '@/components/bookings/bookings-page';
import CommunicationsPage from '@/components/communications/communications-page';
import SettingsPage from '@/components/settings/settings-page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  Map,
  BarChart3,
  CalendarCheck,
  MessageSquare,
  Settings,
  LogOut,
  Plane,
  Menu,
  X,
  Bell,
  RefreshCw,
  ChevronRight,
  Database,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tours' as const, label: 'Tour Management', icon: Map },
  { id: 'analytics' as const, label: 'Pricing Analytics', icon: BarChart3 },
  { id: 'bookings' as const, label: 'Bookings & Revenue', icon: CalendarCheck },
  { id: 'communications' as const, label: 'Communications', icon: MessageSquare },
  { id: 'settings' as const, label: 'Settings', icon: Settings },
];

function Sidebar({ unreadNotifications }: { unreadNotifications: number }) {
  const { currentView, setView, sidebarOpen, setSidebarOpen } = useAppStore();
  const { user, logout } = useAuthStore();

  const roleColors: Record<string, string> = {
    admin: 'bg-red-500',
    manager: 'bg-blue-500',
    operations: 'bg-green-500',
    finance: 'bg-purple-500',
    viewer: 'bg-gray-500',
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-64' : 'w-16'
        } lg:relative lg:z-auto`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Plane className="w-4 h-4 text-primary-foreground" />
          </div>
          {sidebarOpen && (
            <div className="flex flex-col min-w-0 animate-fade-in">
              <span className="font-bold text-sm tracking-tight truncate">Tripventura</span>
              <span className="text-[10px] text-sidebar-foreground/50 truncate">Operations Hub</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto p-1 rounded hover:bg-sidebar-accent transition-colors lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4 custom-scrollbar">
          <nav className="px-3 space-y-1">
            {sidebarOpen && (
              <p className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 px-3 mb-3">
                Navigation
              </p>
            )}
            {NAV_ITEMS.map((item) => {
              const isActive = currentView === item.id;
              return (
                <TooltipProvider key={item.id} delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          setView(item.id);
                          if (window.innerWidth < 1024) setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                          isActive
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        }`}
                      >
                        <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground'}`} />
                        {sidebarOpen && (
                          <span className="truncate animate-fade-in">{item.label}</span>
                        )}
                        {sidebarOpen && item.id === 'communications' && unreadNotifications > 0 && (
                          <Badge className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0 min-w-[20px] text-center">
                            {unreadNotifications > 99 ? '99+' : unreadNotifications}
                          </Badge>
                        )}
                        {!sidebarOpen && item.id === 'communications' && unreadNotifications > 0 && (
                          <span className="absolute right-2 top-2 w-2 h-2 bg-red-500 rounded-full" />
                        )}
                      </button>
                    </TooltipTrigger>
                    {!sidebarOpen && (
                      <TooltipContent side="right" className="font-medium">
                        {item.label}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Sync indicator */}
        {sidebarOpen && (
          <div className="px-3 py-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent/50 text-sidebar-foreground/60">
              <Database className="w-4 h-4" />
              <span className="text-xs">324 tours synced</span>
              <RefreshCw className="w-3 h-3 ml-auto text-green-400" />
            </div>
          </div>
        )}

        {/* User profile */}
        <div className="border-t border-sidebar-border p-3 shrink-0">
          {sidebarOpen && user ? (
            <div className="flex items-center gap-3 px-2 animate-fade-in">
              <Avatar className="w-8 h-8">
                <AvatarFallback className={`text-white text-xs font-bold ${roleColors[user.role] || 'bg-gray-500'}`}>
                  {(user.name || '').split(' ').map(n => n?.[0] || '').join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-[10px] text-sidebar-foreground/50 capitalize truncate">{user.role} • {user.department}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={logout}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : user ? (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={logout}
                    className="w-full flex justify-center p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
                  >
                    <LogOut className="w-5 h-5 text-sidebar-foreground/50" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Logout</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </div>
      </aside>
    </>
  );
}

function Header() {
  const { currentView, sidebarOpen, setSidebarOpen } = useAppStore();
  const { user } = useAuthStore();

  const viewLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    tours: 'Tour Management',
    analytics: 'Pricing Analytics',
    bookings: 'Bookings & Revenue',
    communications: 'Communications',
    settings: 'Settings',
  };

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">{viewLabels[currentView]}</h1>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Tripventura</span>
            <ChevronRight className="w-3 h-3" />
            <span className="font-medium text-foreground">{viewLabels[currentView]}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="outline" className="hidden sm:flex text-xs">
          <Plane className="w-3 h-3 mr-1 text-primary" />
          {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
        </Badge>
      </div>
    </header>
  );
}

function AppShell() {
  const { currentView } = useAppStore();
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { useAuthStore } = await import('@/stores/auth-store');
        const user = useAuthStore.getState().user;
        if (!user) return;
        const res = await fetch('/api/notifications', {
          headers: { 'x-user-id': user.id },
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadNotifications(data.unreadCount || 0);
        }
      } catch { /* ignore */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const renderView = useCallback(() => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardPage />;
      case 'tours':
        return <ToursPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'bookings':
        return <BookingsPage />;
      case 'communications':
        return <CommunicationsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  }, [currentView]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar unreadNotifications={unreadNotifications} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-hidden">
          <div className="h-full animate-fade-in" key={currentView}>
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { isAuthenticated, login, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setLoginError('');
    const result = await login(email, password);
    setIsLoading(false);
    if (!result.success) {
      setLoginError(result.error || 'Login failed');
    }
  };

  if (!isAuthenticated) {
    return (
      <LoginPage onLogin={handleLogin} isLoading={isLoading} />
    );
  }

  return <AppShell />;
}

