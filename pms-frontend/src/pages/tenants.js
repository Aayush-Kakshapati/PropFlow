import { useState, useEffect } from 'react';
import { Plus, Users, Pencil, Trash2, KeyRound, ShieldAlert } from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import authService from '../api/authService';
import { Modal, EmptyState, ErrorState, Badge, FormField, Spinner, SkeletonRow } from '../components/ui';

// ── Helpers ───────────────────────────────────────────────────────────────────
function flattenErrors(data) {
  if (!data) return 'Something went wrong.';
  if (typeof data === 'string') return data;
  return Object.entries(data)
    .map(([field, msgs]) => {
      const text = Array.isArray(msgs) ? msgs.join(' ') : String(msgs);
      return field === 'detail' ? text : `${field}: ${text}`;
    })
    .join(' · ');
}

// ── Add Tenant Modal ──────────────────────────────────────────────────────────
function AddTenantModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ username: '', name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.email.trim() || !form.password) {
      setError('Username, email and password are required.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await authService.createTenant(form);
      onSuccess();
      onClose();
    } catch (err) {
      setError(flattenErrors(err.response?.data));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Add New Tenant" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="text-sm p-3 rounded-lg text-red-600" style={{ background: 'var(--red-50)', border: '1px solid rgba(239,68,68,0.15)' }}>
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Username">
            <input className="input" placeholder="john_doe" value={form.username} onChange={set('username')} disabled={loading} />
          </FormField>
          <FormField label="Full Name">
            <input className="input" placeholder="John Doe" value={form.name} onChange={set('name')} disabled={loading} />
          </FormField>
        </div>
        <FormField label="Email">
          <input className="input" type="email" placeholder="john@example.com" value={form.email} onChange={set('email')} disabled={loading} />
        </FormField>
        <FormField label="Password">
          <input className="input" type="password" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} disabled={loading} />
        </FormField>
        <p className="text-xs -mt-2" style={{ color: 'var(--text-muted)' }}>
          Tenant will be prompted to change their password on first login.
        </p>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center" disabled={loading}>Cancel</button>
          <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
            {loading ? <><Spinner size={14} /> Creating…</> : 'Create Tenant'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Edit Tenant Modal ─────────────────────────────────────────────────────────
function EditTenantModal({ tenant, onClose, onSuccess }) {
  const [form, setForm] = useState({
    username: tenant.username ?? '',
    name: tenant.name ?? '',
    email: tenant.email ?? '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.email.trim()) {
      setError('Username and email are required.');
      return;
    }
    if (form.password && form.password.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    const payload = { username: form.username, name: form.name, email: form.email };
    if (form.password) payload.password = form.password;
    setLoading(true);
    try {
      await authService.updateTenant(tenant.id, payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(flattenErrors(err.response?.data));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Edit Tenant" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="text-sm p-3 rounded-lg text-red-600" style={{ background: 'var(--red-50)', border: '1px solid rgba(239,68,68,0.15)' }}>
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Username">
            <input className="input" placeholder="john_doe" value={form.username} onChange={set('username')} disabled={loading} />
          </FormField>
          <FormField label="Full Name">
            <input className="input" placeholder="John Doe" value={form.name} onChange={set('name')} disabled={loading} />
          </FormField>
        </div>
        <FormField label="Email">
          <input className="input" type="email" placeholder="john@example.com" value={form.email} onChange={set('email')} disabled={loading} />
        </FormField>
        <FormField label="Reset Password">
          <input className="input" type="password" placeholder="Leave blank to keep current" value={form.password} onChange={set('password')} disabled={loading} />
        </FormField>
        {form.password && (
          <p className="text-xs -mt-2 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <KeyRound size={11} /> Tenant will be prompted to change this password on next login.
          </p>
        )}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center" disabled={loading}>Cancel</button>
          <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
            {loading ? <><Spinner size={14} /> Saving…</> : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Delete Tenant Modal ───────────────────────────────────────────────────────
function DeleteTenantModal({ tenant, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    try {
      await authService.deleteTenant(tenant.id);
      onSuccess();
      onClose();
    } catch (err) {
      setError(flattenErrors(err.response?.data));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Delete Tenant" onClose={onClose}>
      <div className="flex flex-col gap-4">
        {error && (
          <div className="text-sm p-3 rounded-lg text-red-600" style={{ background: 'var(--red-50)', border: '1px solid rgba(239,68,68,0.15)' }}>
            {error}
          </div>
        )}
        <div
          className="flex items-start gap-3 p-3 rounded-lg"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
        >
          <ShieldAlert size={16} className="flex-shrink-0 mt-0.5 text-red-500" />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Deleting{' '}
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {tenant.name || tenant.username}
            </span>{' '}
            will also remove all their leases and payment records. This cannot be undone.
          </p>
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center" disabled={loading}>Cancel</button>
          <button
            type="button"
            onClick={handleDelete}
            className="btn-primary flex-1 justify-center"
            disabled={loading}
            style={{ background: 'var(--red-600, #dc2626)', borderColor: 'var(--red-600, #dc2626)' }}
          >
            {loading ? <><Spinner size={14} /> Deleting…</> : 'Delete Tenant'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editTenant, setEditTenant] = useState(null);
  const [deleteTenant, setDeleteTenant] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await authService.getTenants();
      setTenants(Array.isArray(data) ? data : data.results || []);
    } catch {
      setError('Failed to load tenants.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-6 pt-2">
        <div className="flex items-center justify-between">
          <div />
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Add Tenant
          </button>
        </div>

        {error && <ErrorState message={error} onRetry={load} />}

        <div className="card overflow-hidden">
          <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--card-border)' }}>
            <Users size={16} style={{ color: 'var(--text-muted)' }} />
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>All Tenants</p>
            <span
              className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: 'var(--page-bg)', color: 'var(--text-muted)' }}
            >
              {tenants.length}
            </span>
          </div>

          {loading ? (
            <table className="data-table">
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)}
              </tbody>
            </table>
          ) : tenants.length === 0 ? (
            <EmptyState
              title="No tenants yet"
              description="Add a tenant to get started."
              action={
                <button className="btn-primary" onClick={() => setShowAdd(true)}>
                  <Plus size={14} /> Add Tenant
                </button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tenant</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: 'var(--brand-500)', color: '#fff' }}
                          >
                            {(t.name || t.username)?.[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            {t.name || '—'}
                          </span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>@{t.username}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{t.email || '—'}</td>
                      <td>
                        {t.force_password_change ? (
                          <Badge variant="pending" label="Password Reset" />
                        ) : (
                          <Badge variant="active" label="Active" />
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditTenant(t)}
                            className="btn-icon"
                            title="Edit tenant"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTenant(t)}
                            className="btn-icon"
                            title="Delete tenant"
                            style={{ color: 'var(--red-500, #ef4444)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAdd && <AddTenantModal onClose={() => setShowAdd(false)} onSuccess={load} />}
      {editTenant && <EditTenantModal tenant={editTenant} onClose={() => setEditTenant(null)} onSuccess={load} />}
      {deleteTenant && <DeleteTenantModal tenant={deleteTenant} onClose={() => setDeleteTenant(null)} onSuccess={load} />}
    </ProtectedRoute>
  );
}