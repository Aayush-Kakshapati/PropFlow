import { useState } from 'react';
import { useRouter } from 'next/router';
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import authService from '../api/authService';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const isForced = user?.force_password_change;

  const [form, setForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [show, setShow] = useState({ old: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => { setForm(p => ({ ...p, [k]: e.target.value })); setError(''); };
  const toggle = (k) => () => setShow(p => ({ ...p, [k]: !p[k] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.old_password || !form.new_password || !form.confirm_password) {
      setError('All fields are required.');
      return;
    }
    if (form.new_password.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (form.new_password !== form.confirm_password) {
      setError('New passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authService.changePassword({
        old_password: form.old_password,
        new_password: form.new_password,
      });
      // Refresh user so force_password_change flag clears
      await refreshUser();
      router.replace('/dashboard');
    } catch (err) {
      const d = err.response?.data;
      setError(
        d?.old_password?.[0] ||
        d?.new_password?.[0] ||
        d?.detail ||
        'Failed to change password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--page-bg)' }}>
        <div className="w-full max-w-sm">
          <div className="card p-7 flex flex-col gap-5">
            {/* Header */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: isForced ? 'rgba(239,68,68,0.1)' : 'rgba(61,92,255,0.1)' }}
              >
                <KeyRound size={22} style={{ color: isForced ? '#ef4444' : 'var(--brand-500)' }} />
              </div>
              <div>
                <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
                  {isForced ? 'Set a new password' : 'Change password'}
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  {isForced
                    ? 'Your password was reset. Please choose a new one to continue.'
                    : 'Update your account password below.'}
                </p>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm p-3 rounded-lg text-red-600" style={{ background: 'var(--red-50)', border: '1px solid rgba(239,68,68,0.15)' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Current password */}
              <div>
                <label className="label">Current Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    className="input pl-9 pr-10"
                    type={show.old ? 'text' : 'password'}
                    placeholder="Your current password"
                    value={form.old_password}
                    onChange={set('old_password')}
                    disabled={loading}
                  />
                  <button type="button" onClick={toggle('old')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                    {show.old ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    className="input pl-9 pr-10"
                    type={show.new ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={form.new_password}
                    onChange={set('new_password')}
                    disabled={loading}
                  />
                  <button type="button" onClick={toggle('new')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                    {show.new ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className="label">Confirm New Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    className="input pl-9 pr-10"
                    type={show.confirm ? 'text' : 'password'}
                    placeholder="Re-enter new password"
                    value={form.confirm_password}
                    onChange={set('confirm_password')}
                    disabled={loading}
                    style={{
                      borderColor:
                        form.confirm_password && form.new_password !== form.confirm_password
                          ? '#ef4444'
                          : form.confirm_password && form.new_password === form.confirm_password
                          ? 'var(--green-500)'
                          : undefined,
                    }}
                  />
                  <button type="button" onClick={toggle('confirm')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                    {show.confirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {form.confirm_password && form.new_password === form.confirm_password && (
                  <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--green-600)' }}>
                    <CheckCircle2 size={11} /> Passwords match
                  </p>
                )}
              </div>

              <button type="submit" className="btn-primary w-full justify-center py-2.5 mt-1" disabled={loading}>
                {loading ? <><Spinner size={16} /> Updating…</> : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}