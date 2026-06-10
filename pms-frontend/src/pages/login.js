import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Building2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = await login(form);
      if (user?.force_password_change) {
        router.replace('/change-password');
      } else {
        router.replace('/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid credentials. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--surface-950, #0a0d1a)' }}
    >
      {/* Left panel - branding */}
      <div
        className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f1629 0%, #131c3a 100%)' }}
      >
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(61,92,255,0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(61,92,255,0.15) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
        {/* Glow orbs */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl opacity-20"
          style={{ background: 'var(--brand-500)' }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3 z-10">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--brand-500)', boxShadow: '0 4px 16px rgba(61,92,255,0.5)' }}
          >
            <Building2 size={20} color="#fff" />
          </div>
          <span className="font-display font-semibold text-xl text-white">PropFlow</span>
        </div>

        {/* Hero text */}
        <div className="relative z-10">
          <h2
            className="font-display text-4xl font-bold text-white leading-tight mb-4"
          >
            Manage your portfolio<br />with confidence
          </h2>
          <p style={{ color: 'var(--text-inverse-muted)' }} className="text-sm leading-relaxed max-w-sm">
            A complete property management system for tracking properties, leases, payments, and maintenance — all in one place.
          </p>

          {/* Stats row */}
          <div className="flex gap-6 mt-8">
            {[
              { label: 'Properties', value: '∞' },
              { label: 'Leases tracked', value: '100%' },
              { label: 'Uptime', value: '99.9%' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="font-display font-bold text-2xl text-white">{value}</p>
                <p className="text-xs" style={{ color: 'var(--text-inverse-muted)' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <p className="relative z-10 text-xs" style={{ color: 'rgba(240,242,248,0.2)' }}>
          © {new Date().getFullYear()} PropFlow. All rights reserved.
        </p>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ background: 'var(--page-bg)' }}>
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--brand-500)' }}
            >
              <Building2 size={16} color="#fff" />
            </div>
            <span className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>PropFlow</span>
          </div>

          <h1 className="font-display font-bold text-2xl mb-1" style={{ color: 'var(--text-primary)' }}>
            Welcome back
          </h1>
          <p className="text-sm mb-7" style={{ color: 'var(--text-muted)' }}>
            Sign in to your account to continue
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Error alert */}
            {error && (
              <div
                className="flex items-start gap-2.5 p-3 rounded-lg text-sm"
                style={{ background: 'var(--red-50)', color: '#b91c1c', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div>
              <label className="label">Username</label>
              <input
                name="username"
                type="text"
                autoComplete="username"
                value={form.username}
                onChange={handleChange}
                placeholder="your_username"
                className="input"
                disabled={loading}
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input pr-10"
                  disabled={loading}
                />
                
                
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            
            <p className="text-sm mb-7" style={{ color: 'var(--text-muted)' }}>
              Ask your owner/admin to create your account.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 mt-1"
            >
              {loading ? <><Spinner size={16} /> Signing in…</> : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
