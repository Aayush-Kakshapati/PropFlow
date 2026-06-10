import { useState, useEffect } from 'react';
import { Wrench, Plus } from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import { maintenanceService } from '../api/services';
import { EmptyState, ErrorState, Badge, SkeletonRow, Modal, FormField } from '../components/ui';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const STATUS_ORDER = ['pending', 'in_progress', 'completed', 'cancelled'];
const STATUS_LABEL = { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' };
const STATUS_ACTIONS = {
  pending: { label: 'Start Work', next: 'in_progress' },
  in_progress: { label: 'Mark Complete', next: 'completed' },
  completed: null,
  cancelled: null,
};

function StatusSelect({ requestId, current, onUpdate, userRole }) {
  const [loading, setLoading] = useState(false);
  if (userRole === 'tenant') {
    if (current === 'completed' || current === 'cancelled') {
      return <Badge variant={current} label={STATUS_LABEL[current]} />;
    }
    const update = async (next) => {
      setLoading(true);
      try {
        await maintenanceService.updateStatus(requestId, { status: next });
        onUpdate();
      } finally {
        setLoading(false);
      }
    };
    return (
      <div className="flex gap-1">
        <button onClick={() => update('completed')} disabled={loading} className="btn-primary">Complete</button>
        {current === 'pending' && (
          <button onClick={() => update('cancelled')} disabled={loading} className="btn-secondary">Cancel</button>
        )}
      </div>
    );
  }
  const action = STATUS_ACTIONS[current];
  if (!action) return <Badge variant={current} label={STATUS_LABEL[current] || current} />;

  const handleClick = async () => {
    setLoading(true);
    try {
      await maintenanceService.updateStatus(requestId, { status: action.next });
      onUpdate();
    } catch (err) {
      console.error('Status update failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
      style={{
        background: action.next === 'completed' ? 'rgba(34,197,94,0.1)' : 'rgba(59,130,246,0.1)',
        color: action.next === 'completed' ? 'var(--green-600)' : '#1d4ed8',
        border: `1px solid ${action.next === 'completed' ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.2)'}`,
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? '…' : action.label}
    </button>
  );
}


function IssueTypePill({ type }) {
  return (
    <span
      className="text-xs font-medium px-2.5 py-1 rounded-lg capitalize"
      style={{ background: 'var(--page-bg)', color: 'var(--text-secondary)', border: '1px solid var(--card-border)' }}
    >
      {type?.replace(/_/g, ' ') || 'General'}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const colors = {
    High: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)', color: '#dc2626' },
    Medium: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)', color: '#d97706' },
    Low: { bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.2)', color: '#16a34a' },
  };
  const style = colors[priority] || colors.Low;
  return (
    <span
      className="text-xs font-medium px-2.5 py-1 rounded-lg"
      style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
    >
      {priority || 'Low'}
    </span>
  );
}

export default function MaintenancePage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', description: '' });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await maintenanceService.getOwnerRequests();
      setRequests(Array.isArray(data) ? data : data.results || []);
    } catch {
      setError('Failed to load maintenance requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  const createTicket = async (e) => {
    e.preventDefault();
    await maintenanceService.create(createForm);
    setCreateForm({ title: '', description: '' });
    setShowCreateModal(false);
    load();
  };

  const filtered = filter === 'all'
    ? requests
    : requests.filter(r => r.status === filter);

  const counts = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = requests.filter(r => r.status === s).length;
    return acc;
  }, {});

  const fmtDate = (d) => {
    try { return d ? format(new Date(d), 'MMM d, yyyy') : '—'; } catch { return d || '—'; }
  };

  const FILTER_TABS = [
    { key: 'all', label: `All (${requests.length})` },
    { key: 'pending', label: `Pending (${counts.pending || 0})` },
    { key: 'in_progress', label: `In Progress (${counts.in_progress || 0})` },
    { key: 'completed', label: `Completed (${counts.completed || 0})` },
  ];

  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-6 pt-2">
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATUS_ORDER.map((s) => (
              <div
                key={s}
                className="card p-4 flex items-center gap-3 cursor-pointer transition-all duration-150"
                style={{ opacity: filter !== 'all' && filter !== s ? 0.6 : 1 }}
                onClick={() => setFilter(filter === s ? 'all' : s)}
              >
                <Badge variant={s} label={STATUS_LABEL[s]} />
                <span className="font-display font-bold text-2xl ml-auto" style={{ color: 'var(--text-primary)' }}>
                  {counts[s] || 0}
                </span>
              </div>
            ))}
          </div>
        )}

        {error && <ErrorState message={error} onRetry={load} />}
        {user?.role === 'tenant' && (
          <div className="flex justify-end">
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={14} /> Create Ticket
            </button>
          </div>
        )}

        <div className="card overflow-hidden">
          <div style={{ borderBottom: '1px solid var(--card-border)' }}>
            <div className="px-5 py-4 flex items-center gap-3">
              <Wrench size={16} style={{ color: 'var(--text-muted)' }} />
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Maintenance Requests</p>
            </div>
            <div className="flex px-5 gap-1 pb-0" style={{ borderTop: '1px solid var(--card-border)' }}>
              {FILTER_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className="text-xs font-medium px-3 py-2.5 transition-colors relative"
                  style={{
                    color: filter === tab.key ? 'var(--brand-500)' : 'var(--text-muted)',
                    borderBottom: filter === tab.key ? '2px solid var(--brand-500)' : '2px solid transparent',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <table className="data-table">
              <tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}</tbody>
            </table>
          ) : filtered.length === 0 ? (
            <EmptyState
              title={filter === 'all' ? 'No maintenance requests' : `No ${STATUS_LABEL[filter]?.toLowerCase()} requests`}
              description={filter === 'all' ? 'Requests from tenants will appear here.' : 'Try switching the filter above.'}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tenant</th>
                    <th>Unit</th>
                    <th>Issue Type</th>
                    <th>Description</th>
                    <th>Submitted</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{r.tenant?.username || r.tenant}</span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{r.unit_name || r.unit}</td>
                      <td><IssueTypePill type={r.issue_type} /></td>
                      <td>
                        <span
                          className="block max-w-xs truncate text-sm"
                          style={{ color: 'var(--text-secondary)' }}
                          title={r.description}
                        >
                          {r.description || '—'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{fmtDate(r.created_at)}</td>
                      <td><PriorityBadge priority={r.priority} /></td>
                      <td><Badge variant={r.status} label={STATUS_LABEL[r.status] || r.status} /></td>
                      <td>
                        <StatusSelect requestId={r.id} current={r.status} onUpdate={load} userRole={user?.role} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {showCreateModal && (
          <Modal title="Create Maintenance Ticket" onClose={() => setShowCreateModal(false)}>
            <form onSubmit={createTicket} className="flex flex-col gap-3">
              {user?.role === 'tenant' && (
                <div className="p-3 rounded-lg" style={{ background: 'var(--blue-50)', border: '1px solid rgba(59,130,246,0.15)' }}>
                  <p className="text-sm" style={{ color: 'var(--blue-600)' }}>
                    <strong>Unit Auto-Assignment:</strong> The unit will be automatically assigned based on your active lease.
                  </p>
                </div>
              )}

              <FormField label="Title">
                <input className="input" value={createForm.title} onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))} required />
              </FormField>
              <FormField label="Description">
                <textarea className="input" value={createForm.description} onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))} />
              </FormField>
              <button className="btn-primary justify-center">Submit Ticket</button>
            </form>
          </Modal>
        )}
      </div>
    </ProtectedRoute>
  );
}
