import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, CreditCard, Wrench, Home } from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import dashboardService from '../api/dashboardService';
import propertyService from '../api/propertyService';
import { maintenanceService, paymentService } from '../api/services';
import { Badge, EmptyState, ErrorState, SkeletonCard, SkeletonRow } from '../components/ui';

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <Icon size={16} style={{ color: 'var(--brand-500)' }} />
      </div>
      <p className="font-display font-bold text-2xl mt-2" style={{ color: 'var(--text-primary)' }}>{value}</p>
    </div>
  );
}

function PaymentBadge({ status }) {
  if (status === 'paid') return <Badge variant="completed" label="Paid" />;
  if (status === 'late') return <Badge variant="pending" label="Late" />;
  return <Badge variant="pending" label="Pending" />;
}

function nextMaintenanceStatus(status) {
  if (status === 'pending') return 'in_progress';
  if (status === 'in_progress') return 'completed';
  return null;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [properties, setProperties] = useState([]);
  const [payments, setPayments] = useState([]);
  const [maintenance, setMaintenance] = useState([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const statsRes = await dashboardService.getStats();
      const role = statsRes.data?.role;
      const reqs = [
        paymentService.getAll(),
        maintenanceService.getOwnerRequests(),
      ];
      if (role !== 'tenant') reqs.push(propertyService.getAll());
      const [paymentsRes, maintenanceRes, propertiesRes] = await Promise.all(reqs);
      setStats(statsRes.data);
      setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : paymentsRes.data.results || []);
      setMaintenance(Array.isArray(maintenanceRes.data) ? maintenanceRes.data : maintenanceRes.data.results || []);
      setProperties(propertiesRes ? (Array.isArray(propertiesRes.data) ? propertiesRes.data : propertiesRes.data.results || []) : []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        (err.response?.status ? `Backend error (${err.response.status})` : `Connection error: ${err.message}`) ||
        'Failed to load dashboard'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const pendingPayments = useMemo(
    () => payments.filter((p) => p.status === 'pending' || p.status === 'late'),
    [payments]
  );

  const handleMarkPaid = async (payment) => {
    await paymentService.markPaid(payment.id, { amount_paid: payment.amount_due });
    load();
  };

  const handleMaintenanceUpdate = async (item) => {
    const next = nextMaintenanceStatus(item.status);
    if (!next) return;
    await maintenanceService.updateStatus(item.id, { status: next });
    load();
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-5 pt-2">
        {error && <ErrorState message={error} onRetry={load} />}

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : stats?.role === 'tenant' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-4">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Current Lease</p>
              {stats?.current_lease ? (
                <div className="mt-2">
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{stats.current_lease.property}</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{stats.current_lease.unit}</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--green-600)' }}>${Number(stats.current_lease.rent_amount).toLocaleString()}/mo</p>
                </div>
              ) : (
                <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>No current lease</p>
              )}
            </div>
            <StatCard label="Rent Status" value={(stats?.rent_status || 'pending').toUpperCase()} icon={CreditCard} />
            <StatCard label="Maintenance Requests" value={maintenance.length} icon={Wrench} />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Properties" value={stats?.total_properties ?? 0} icon={Building2} />
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Occupancy</p>
                <Home size={16} style={{ color: 'var(--brand-500)' }} />
              </div>
              <p className="font-display font-bold text-2xl mt-2" style={{ color: 'var(--text-primary)' }}>{stats?.occupancy_rate ?? 0}%</p>
              <Badge variant={stats?.occupancy_status === 'High' ? 'completed' : stats?.occupancy_status === 'Medium' ? 'pending' : 'pending'} label={stats?.occupancy_status || 'Low'} />
            </div>
            <StatCard label="Pending Payments" value={stats?.pending_payments ?? pendingPayments.length} icon={CreditCard} />
            <StatCard label="Open Maintenance" value={stats?.pending_maintenance ?? 0} icon={Wrench} />
          </div>
        )}

        {stats?.role !== 'tenant' && (
          <div className="card p-4 flex flex-wrap gap-2">
            <Link href="/properties" className="btn-secondary">Manage Properties</Link>
            <Link href="/properties" className="btn-secondary">Manage Units</Link>
            <Link href="/signup" className="btn-secondary">Manage Tenants</Link>
            <Link href="/leases" className="btn-secondary">Manage Leases</Link>
            <Link href="/payments" className="btn-secondary">All Payments</Link>
            <Link href="/maintenance" className="btn-secondary">All Maintenance</Link>
          </div>
        )}

        <div className="card overflow-hidden">
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--card-border)' }}>
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              {stats?.role === 'tenant' ? 'Payment History' : 'Pending Payments'}
            </p>
          </div>
          {loading ? (
            <table className="data-table"><tbody>{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}</tbody></table>
          ) : (stats?.role === 'tenant' ? payments : pendingPayments).length === 0 ? (
            <EmptyState title="No payments" description="Payment records will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Unit</th>
                    <th>Due</th>
                    <th>Amount</th>
                    <th>Status</th>
                    {stats?.role !== 'tenant' && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {(stats?.role === 'tenant' ? payments : pendingPayments).slice(0, 8).map((p) => (
                    <tr key={p.id}>
                      <td>{p.property || '—'}</td>
                      <td>{p.unit || '—'}</td>
                      <td>{p.due_date || '—'}</td>
                      <td>${Number(p.amount_due ?? p.amount ?? 0).toLocaleString()}</td>
                      <td><PaymentBadge status={p.status} /></td>
                      {stats?.role !== 'tenant' && (
                        <td>
                          <button className="btn-primary" onClick={() => handleMarkPaid(p)}>Mark Paid</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--card-border)' }}>
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Maintenance Requests</p>
          </div>
          {loading ? (
            <table className="data-table"><tbody>{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}</tbody></table>
          ) : maintenance.length === 0 ? (
            <EmptyState title="No maintenance requests" description="Requests will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Unit</th>
                    <th>Status</th>
                    <th>Description</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenance.slice(0, 8).map((m) => {
                    const next = nextMaintenanceStatus(m.status);
                    return (
                      <tr key={m.id}>
                        <td>{m.title || m.issue_type || 'Maintenance'}</td>
                        <td>{m.unit_name || m.unit || '—'}</td>
                        <td><Badge variant={m.status} label={m.status?.replace('_', ' ') || 'pending'} /></td>
                        <td>{m.description || '—'}</td>
                        <td>
                          {next ? (
                            <button className="btn-primary" onClick={() => handleMaintenanceUpdate(m)}>
                              {next === 'in_progress' ? 'Start' : 'Complete'}
                            </button>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
