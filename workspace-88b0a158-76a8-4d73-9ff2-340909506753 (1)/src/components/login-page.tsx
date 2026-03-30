'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plane,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  isLoading: boolean;
}

const DEMO_CREDENTIALS = [
  { role: 'Admin', email: 'admin@tripventura.com', password: 'admin123' },
  { role: 'Manager', email: 'manager@tripventura.com', password: 'manager123' },
  { role: 'Operations', email: 'ops@tripventura.com', password: 'ops123' },
  { role: 'Finance', email: 'finance@tripventura.com', password: 'finance123' },
  { role: 'Viewer', email: 'viewer@tripventura.com', password: 'viewer123' },
];

export function LoginPage({ onLogin, isLoading }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDemoCreds, setShowDemoCreds] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!email.trim()) {
        setError('Please enter your email address.');
        return;
      }
      if (!password.trim()) {
        setError('Please enter your password.');
        return;
      }

      const result = await onLogin(email, password);
      if (!result.success) {
        setError(result.error || 'Invalid email or password. Please try again.');
      }
    },
    [email, password, onLogin],
  );

  const fillCredentials = (credEmail: string, credPassword: string) => {
    setEmail(credEmail);
    setPassword(credPassword);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* ── Left Panel: Branding ── */}
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-primary via-red-800 to-neutral-900">
        {/* Decorative floating blobs */}
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/[0.04] blur-2xl animate-pulse"
          style={{ animationDuration: '6s' }}
        />
        <div
          className="absolute top-1/3 -right-16 w-72 h-72 rounded-full bg-white/[0.06] blur-2xl animate-pulse"
          style={{ animationDuration: '8s', animationDelay: '1s' }}
        />
        <div
          className="absolute bottom-12 left-16 w-56 h-56 rounded-full bg-white/[0.03] blur-2xl animate-pulse"
          style={{ animationDuration: '7s', animationDelay: '2s' }}
        />
        <div
          className="absolute top-16 left-1/2 w-40 h-40 rounded-full border border-white/[0.08] blur-sm"
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-60 h-60 rounded-full border border-white/[0.05] blur-sm"
        />

        {/* Gold accent circles */}
        <div
          className="absolute -bottom-8 right-12 w-48 h-48 rounded-full bg-amber-400/[0.08] blur-3xl"
        />
        <div
          className="absolute top-20 right-32 w-32 h-32 rounded-full bg-amber-300/[0.06] blur-2xl"
        />

        {/* Content */}
        <div
          className="relative z-10 flex flex-col justify-center items-center px-12 lg:px-20 transition-all duration-1000 ease-out opacity-100 translate-y-0"
        >
          {/* Logo icon */}
          <div className="mb-8 relative">
            <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-2xl">
              <Plane className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center shadow-lg">
              <Plane className="w-4 h-4 text-neutral-900 -rotate-45" />
            </div>
          </div>

          {/* Company name */}
          <h1 className="text-5xl lg:text-6xl font-bold text-white tracking-tight mb-4">
            Trip<span className="text-amber-400">ventura</span>
          </h1>

          {/* Tagline */}
          <p className="text-xl lg:text-2xl text-white/90 font-medium mb-3">
            Break Free with Tripventura
          </p>

          {/* Subtitle */}
          <div className="flex items-center gap-3 mt-2">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-400/50" />
            <p className="text-amber-400/80 text-sm uppercase tracking-[0.2em] font-medium">
              Tour Operations Management System
            </p>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-400/50" />
          </div>

          {/* Feature highlights */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-md">
            {[
              { label: 'Destinations', value: '500+' },
              { label: 'Operators', value: '200+' },
              { label: 'Bookings', value: '50K+' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-white/50 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel: Login Form ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-8 md:px-8 lg:px-12 bg-gradient-to-b from-white to-gray-50/80">
        <div
          className="w-full max-w-md transition-all duration-1000 delay-200 ease-out opacity-100 translate-y-0"
        >
          {/* Mobile brand header */}
          <div className="md:hidden flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/25">
              <Plane className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Trip<span className="text-primary">ventura</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tour Operations Management System
            </p>
          </div>

          {/* Login card */}
          <Card className="border-gray-200/60 shadow-xl shadow-gray-200/40 rounded-2xl">
            <CardHeader className="pb-2 text-center">
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                Welcome back
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-1.5">
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error message */}
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-in fade-in slide-in-from-top-1 duration-200">
                    {error}
                  </div>
                )}

                {/* Email field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-muted-foreground">
                    Email address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="email"
                      ref={emailRef}
                      type="email"
                      placeholder="you@company.com"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      disabled={isLoading}
                      className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus-visible:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-muted-foreground"
                    >
                      Password
                    </Label>
                    <button
                      type="button"
                      className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      disabled={isLoading}
                      className="pl-10 pr-10 h-11 bg-gray-50/50 border-gray-200 focus-visible:bg-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                      disabled={isLoading}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) =>
                      setRememberMe(checked === true)
                    }
                    disabled={isLoading}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm font-normal text-muted-foreground cursor-pointer select-none"
                  >
                    Remember me for 30 days
                  </Label>
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 text-sm font-semibold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 hover:shadow-primary/30 transition-all cursor-pointer rounded-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              {/* Demo credentials collapsible */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowDemoCreds(!showDemoCreds)}
                  className="flex items-center justify-center gap-1.5 w-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-2 group cursor-pointer"
                >
                  <span>Demo Credentials</span>
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 transition-transform duration-200',
                      showDemoCreds && 'rotate-180',
                    )}
                  />
                </button>

                {showDemoCreds && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3 mt-1 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-[11px] text-muted-foreground mb-2.5 font-medium">
                      Click to auto-fill credentials:
                    </p>
                    <div className="space-y-1">
                      {DEMO_CREDENTIALS.map((cred) => (
                        <button
                          key={cred.role}
                          type="button"
                          onClick={() =>
                            fillCredentials(cred.email, cred.password)
                          }
                          className="flex items-center justify-between w-full rounded-lg px-3 py-2 text-xs hover:bg-white hover:shadow-sm transition-all group cursor-pointer text-left"
                        >
                          <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {cred.role}
                          </span>
                          <span className="text-muted-foreground font-mono text-[11px]">
                            {cred.email}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Footer text */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            &copy; {new Date().getFullYear()} Tripventura. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
