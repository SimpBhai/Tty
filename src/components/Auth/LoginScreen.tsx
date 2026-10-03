import React, { useState } from 'react';
import {
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both your username and password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const res = await login(username.trim(), password.trim());
    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Invalid username or password.');
    }
  };

  return (
    <div
      id="login-screen"
      className="min-h-screen w-screen bg-[#090b0e] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none"
    >
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      {/* Subtle Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10">
        <div className="bg-[#121622] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-8 backdrop-blur-md">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-950/80 border border-indigo-700/60 text-indigo-400 mb-3 shadow-lg shadow-indigo-950/50">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Welcome back!
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              We're so excited to see you again!
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div
                id="login-error-alert"
                className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/70 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                Username or Tag <span className="text-rose-400">*</span>
              </label>
              <input
                id="login-username-input"
                type="text"
                required
                autoFocus
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#0a0c10] border border-slate-700/80 focus:border-indigo-500 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-all"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0a0c10] border border-slate-700/80 focus:border-indigo-500 rounded-lg pl-3.5 pr-10 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                id="login-submit-button"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-lg text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Log In</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
