import { X, AlertCircle, Inbox } from 'lucide-react';

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, className = '' }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-spin-slow ${className}`}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--brand-500)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ── PageLoader ────────────────────────────────────────────────────────────────
export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <Spinner size={28} />
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ title = 'No data yet', description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'var(--page-bg)', border: '1px solid var(--card-border)' }}
      >
        <Inbox size={24} style={{ color: 'var(--text-muted)' }} />
      </div>
      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{title}</p>
      {description && (
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ── ErrorState ────────────────────────────────────────────────────────────────
export function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'var(--red-50)', border: '1px solid rgba(239,68,68,0.15)' }}
      >
        <AlertCircle size={24} className="text-red-500" />
      </div>
      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Error loading data</p>
      <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary mt-4">Retry</button>
      )}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ title, children, onClose, maxWidth = 'max-w-md' }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal-panel ${maxWidth}`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--page-bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
const BADGE_STYLES = {
  active: { bg: 'var(--green-50)', color: 'var(--green-600)', dot: 'var(--green-500)' },
  inactive: { bg: '#f5f6fb', color: 'var(--text-muted)', dot: '#c8cedf' },
  pending: { bg: 'var(--amber-50)', color: '#b45309', dot: 'var(--amber-500)' },
  in_progress: { bg: 'var(--blue-50)', color: '#1d4ed8', dot: 'var(--blue-500)' },
  completed: { bg: 'var(--green-50)', color: 'var(--green-600)', dot: 'var(--green-500)' },
  cancelled: { bg: '#fee2e2', color: '#b91c1c', dot: '#ef4444' },
  occupied: { bg: '#faf5ff', color: '#7c3aed', dot: '#8b5cf6' },
  vacant: { bg: 'var(--green-50)', color: 'var(--green-600)', dot: 'var(--green-500)' },
};

export function Badge({ variant = 'inactive', label, showDot = true }) {
  const style = BADGE_STYLES[variant] || BADGE_STYLES.inactive;
  return (
    <span
      className="badge"
      style={{ background: style.bg, color: style.color }}
    >
      {showDot && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: style.dot }}
        />
      )}
      {label}
    </span>
  );
}

// ── FormField ─────────────────────────────────────────────────────────────────
export function FormField({ label, error, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────
export function SkeletonRow({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="skeleton h-3 rounded" style={{ width: `${60 + Math.random() * 30}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="skeleton h-3 w-20 rounded" />
      <div className="skeleton h-7 w-32 rounded" />
      <div className="skeleton h-2 w-16 rounded" />
    </div>
  );
}
