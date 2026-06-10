import { useState, useEffect } from 'react';
import { CreditCard, DollarSign } from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import { paymentService } from '../api/services';
import { EmptyState, ErrorState, SkeletonRow } from '../components/ui';
import { format } from 'date-fns';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await paymentService.getAll();
      setPayments(Array.isArray(data) ? data : data.results || []);
    } catch {
      setError('Failed to load payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const handleMarkPaid = async (payment) => {
    await paymentService.markPaid(payment.id, { amount_paid: payment.amount_due });
    load();
  };

  const fmtDate = (d) => {
    try { return d ? format(new Date(d), 'MMM d, yyyy') : '—'; } catch { return d || '—'; }
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-6 pt-2">
        <div className="flex items-center justify-between">
          {!loading && payments.length > 0 && (
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', color: 'var(--green-600)' }}
            >
              <DollarSign size={15} />
              <span>Total collected: <strong>${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
            </div>
          )}
          <div className="ml-auto" />
        </div>

        {error && <ErrorState message={error} onRetry={load} />}

        <div className="card overflow-hidden">
          <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--card-border)' }}>
            <CreditCard size={16} style={{ color: 'var(--text-muted)' }} />
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Payment History</p>
            <span
              className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: 'var(--page-bg)', color: 'var(--text-muted)' }}
            >
              {payments.length} records
            </span>
          </div>

          {loading ? (
            <table className="data-table">
              <tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}</tbody>
            </table>
          ) : payments.length === 0 ? (
            <EmptyState
              title="No payments recorded"
              description="Payments will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tenant</th>
                    <th>Property</th>
                    <th>Unit</th>
                    <th>Amount</th>
                    <th>Late Fee</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{p.tenant}</span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.property}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.unit}</td>
                      <td>
                        <span className="font-mono font-semibold text-sm" style={{ color: 'var(--green-600)' }}>
                          ${Number(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono text-sm" style={{ color: p.late_fee_applied > 0 ? '#dc2626' : 'var(--text-muted)' }}>
                          ${Number(p.late_fee_applied || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{fmtDate(p.payment_date || p.paid_date || p.due_date)}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{p.status}</td>
                      <td>
                        {(p.status === 'pending' || p.status === 'late') ? (
                          <button className="btn-primary" onClick={() => handleMarkPaid(p)}>Mark Paid</button>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </ProtectedRoute>
  );
}
