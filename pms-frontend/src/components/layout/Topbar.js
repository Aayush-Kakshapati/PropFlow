import { Bell, Search } from 'lucide-react';
import { useRouter } from 'next/router';

const PAGE_TITLES = {
  '/dashboard': { title: 'Dashboard', sub: 'Overview of your portfolio' },
  '/properties': { title: 'Properties', sub: 'Manage your properties' },
  '/leases': { title: 'Leases', sub: 'All active & inactive leases' },
  '/payments': { title: 'Payments', sub: 'Payment history & records' },
  '/maintenance': { title: 'Maintenance', sub: 'Service requests & status' },
};

export default function Topbar() {
  const router = useRouter();

  const getPageInfo = () => {
    // Match /properties/[id]/units dynamically
    if (router.pathname.includes('/units')) return { title: 'Units', sub: 'Units for this property' };
    return PAGE_TITLES[router.pathname] || { title: 'PropFlow', sub: '' };
  };

  const { title, sub } = getPageInfo();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <header
      className="fixed top-0 right-0 z-20 flex items-center justify-between px-6 py-4"
      style={{
        left: '240px',
        background: 'rgba(245,246,251,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(19,24,48,0.07)',
      }}
    >
      <div>
        <h1
          className="font-display font-semibold text-xl leading-none"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h1>
        {sub && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <p className="text-xs hidden md:block" style={{ color: 'var(--text-muted)' }}>{today}</p>

        {/* <button
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'white'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Bell size={16} />
        </button> */}
      </div>
    </header>
  );
}
