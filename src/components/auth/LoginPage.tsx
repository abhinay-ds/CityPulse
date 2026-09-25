/**
 * LoginPage — CityPulse authentication login screen.
 * Matches the existing CityPulse design language (slate/orange/white).
 */

import React, { useState } from 'react';
import { MapPin, Eye, EyeOff, LogIn, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginPageProps {
  onNavigateToSignup: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToSignup }) => {
  const { login, continueAsGuest, isLoading, authError, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = localError || authError;

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setLocalError('Please enter your email address.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError('Please enter a valid email address.');
      return false;
    }
    if (!password) {
      setLocalError('Please enter your password.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!validateForm()) return;

    try {
      await login(email.trim(), password);
    } catch {
      // Error is handled by AuthContext and displayed via authError
    }
  };

  const handleGuestAccess = () => {
    setLocalError(null);
    clearError();
    continueAsGuest();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-slate-200/50 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-sm">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1">
                <span className="text-2xl font-black tracking-tight text-slate-900">CITY</span>
                <span className="text-2xl font-black tracking-tight text-orange-600">PULSE</span>
              </div>
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-sm text-slate-500 mt-1">
              Sign in to access your civic health dashboard
            </p>
          </div>
        </div>

        {/* Login form card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-5">
          {/* Error display */}
          {displayError && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span className="font-medium leading-relaxed">{displayError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setLocalError(null);
                }}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setLocalError(null);
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 pr-11 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all transform active:scale-[0.98] cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Guest access */}
          <button
            onClick={handleGuestAccess}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ArrowRight className="w-4 h-4 text-slate-500" />
            <span>Continue as Guest</span>
          </button>

          <p className="text-[11px] text-slate-400 text-center">
            Guest mode provides full access to demo civic data.
          </p>
        </div>

        {/* Sign up link */}
        <div className="text-center">
          <p className="text-sm text-slate-500">
            Don't have an account?{' '}
            <button
              onClick={onNavigateToSignup}
              className="font-bold text-orange-600 hover:text-orange-700 transition-colors cursor-pointer"
            >
              Create one
            </button>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-400 space-y-1">
          <p>CityPulse · Live Civic Health Dashboard</p>
        </div>
      </div>
    </div>
  );
};
