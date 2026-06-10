import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard, Building2, Users, FileText,
  CreditCard, Wrench, LogOut, ChevronRight, KeyRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['owner', 'admin', 'tenant'] },
  { href: '/properties', label: 'Properties', icon: Building2, roles: ['owner', 'admin'] },
  { href: '/tenants',     label: 'Tenants',     icon: Users,           roles: ['owner', 'admin'] },
  { href: '/leases', label: 'Leases', icon: FileText, roles: ['owner', 'admin'] },
  { href: '/payments', label: 'Payments', icon: CreditCard, roles: ['owner', 'admin', 'tenant'] },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench, roles: ['owner', 'admin', 'tenant'] },
];

export default function Sidebar() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isActive = (href) => {
    if (href === '/dashboard') return router.pathname === '/dashboard';
    return router.pathname.startsWith(href);
  };

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-60 flex flex-col z-30"
      style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
    >
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--brand-500)', boxShadow: '0 2px 8px rgba(61,92,255,0.4)' }}
        >
          <Building2 size={16} color="#fff" />
        </div>
        <div>
          <p className="font-display font-700 text-white text-sm leading-none">PropFlow</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-inverse-muted)' }}>Management</p>
        </div>
      </div>

      {/* User pill */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
        <div
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: 'var(--brand-500)', color: '#fff' }}
          >
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.username || 'User'}</p>
            <p className="text-xs capitalize" style={{ color: 'var(--text-inverse-muted)' }}>{user?.role || 'owner'}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(240,242,248,0.25)' }}>
          Navigation
        </p>
        {NAV_ITEMS.filter((item) => item.roles.includes(user?.role || 'tenant')).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx('sidebar-item', isActive(href) && 'active')}
          >
            <Icon size={16} className="flex-shrink-0" />
            <span className="flex-1">{label}</span>
            {isActive(href) && <ChevronRight size={13} className="opacity-60" />}
          </Link>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 pb-5 flex flex-col gap-1" style={{ borderTop: '1px solid var(--sidebar-border)', paddingTop: '12px' }}>
        <Link
          href="/change-password"
          className={clsx('sidebar-item', isActive('/change-password') && 'active')}
        >
          <KeyRound size={16} />
          <span className="flex-1">Change Password</span>
          {isActive('/change-password') && <ChevronRight size={13} className="opacity-60" />}
        </Link>
        <button
          onClick={handleLogout}
          className="sidebar-item w-full hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}