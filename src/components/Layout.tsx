import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  LayoutDashboard, 
  Scissors, 
  Package, 
  UserCircle, 
  LogOut,
  Menu,
  X,
  PieChart,
  Bell,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { User } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { subscribeToPush } from '../lib/push';

interface LayoutProps {
  user: User;
  onLogout: () => void;
}

export default function Layout({ user, onLogout }: LayoutProps) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(subscription => {
          setIsSubscribed(!!subscription);
        });
      });
    }
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSubscribe = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    await subscribeToPush(token);
    setIsSubscribed(true);
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Appointments', href: '/admin/appointments', icon: Calendar },
    { name: 'Customers', href: '/admin/customers', icon: UserCircle },
  ];

  const adminNavigation = [
    { name: 'Inventory', href: '/admin/inventory', icon: Package },
    { name: 'Services', href: '/admin/services', icon: Scissors },
    { name: 'Employees', href: '/admin/employees', icon: Users },
    { name: 'Reports', href: '/admin/reports', icon: PieChart },
  ];

  const isAdmin = user.role === 'admin' || user.role === 'master_admin';
  const allNav = isAdmin ? [...navigation, ...adminNavigation] : navigation;

  // Bottom tab nav: show only first 4 items on mobile
  const mobileTabNav = allNav.slice(0, 4);

  const currentPage = allNav.find(n => n.href === location.pathname)?.name || 'Page';

  return (
    <div className="min-h-screen bg-warm-bg flex text-ink">

      {/* ─── DESKTOP / TABLET SIDEBAR ─────────────────────────────── */}
      <aside
        className={cn(
          "hidden md:flex flex-col bg-warm-sidebar border-r border-[#E5E5DF] sticky top-0 h-screen overflow-y-auto transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[72px]" : "w-64"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center transition-all duration-300",
          isCollapsed ? "p-4 justify-center" : "p-8 pb-10"
        )}>
          {isCollapsed ? (
            <span className="text-2xl font-serif text-olive font-semibold">É</span>
          ) : (
            <div>
              <h1 className="text-3xl font-serif tracking-tight text-olive font-semibold">Élégance</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] opacity-60 font-semibold mt-1">Salon Management</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1">
          {allNav.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                title={isCollapsed ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-2xl text-sm transition-all duration-200 font-medium group",
                  isCollapsed ? "px-0 py-3 justify-center" : "px-5 py-3",
                  isActive
                    ? "bg-olive text-white shadow-lg shadow-olive/20"
                    : "text-olive/70 hover:text-olive hover:bg-olive/8"
                )}
              >
                <item.icon
                  size={18}
                  strokeWidth={isActive ? 2 : 1.5}
                  className="shrink-0"
                />
                {!isCollapsed && (
                  <span className="truncate">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className={cn(
          "border-t border-[#E5E5DF] transition-all duration-300",
          isCollapsed ? "p-3" : "p-5"
        )}>
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-terracotta flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {user.name.charAt(0)}
              </div>
              <button
                onClick={handleSubscribe}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  isSubscribed ? "text-emerald-500" : "text-ink/30 hover:text-olive hover:bg-olive/5"
                )}
                title={isSubscribed ? "Notifications Enabled" : "Enable Notifications"}
              >
                <Bell size={15} fill={isSubscribed ? "currentColor" : "none"} />
              </button>
              <button
                onClick={onLogout}
                className="text-ink/30 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                title="Log out"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-terracotta flex items-center justify-center text-white font-semibold text-sm shadow-sm shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-ink">{user.name}</p>
                <p className="text-[10px] uppercase tracking-wider opacity-50 font-bold truncate">
                  {user.role.replace('_', ' ')}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleSubscribe}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    isSubscribed ? "text-emerald-500" : "text-ink/30 hover:text-olive hover:bg-olive/5"
                  )}
                  title={isSubscribed ? "Notifications Enabled" : "Enable Notifications"}
                >
                  <Bell size={15} fill={isSubscribed ? "currentColor" : "none"} />
                </button>
                <button
                  onClick={onLogout}
                  className="text-ink/30 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                  title="Log out"
                >
                  <LogOut size={15} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(v => !v)}
          className="absolute top-1/2 -translate-y-1/2 -right-3.5 w-7 h-7 rounded-full bg-warm-sidebar border border-[#E5E5DF] shadow-sm flex items-center justify-center text-olive/50 hover:text-olive transition-colors z-10"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed
            ? <ChevronRight size={13} strokeWidth={2.5} />
            : <ChevronLeft size={13} strokeWidth={2.5} />
          }
        </button>
      </aside>

      {/* ─── MOBILE OVERLAY DRAWER (for "More" or all nav) ──────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              className="fixed inset-x-0 bottom-0 bg-warm-sidebar z-50 md:hidden rounded-t-3xl border-t border-[#E5E5DF] shadow-2xl"
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-ink/20" />
              </div>

              <div className="flex justify-between items-center px-6 pt-3 pb-4">
                <h2 className="text-base font-serif text-olive font-semibold">All Sections</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-xl hover:bg-ink/5 text-ink/50"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="px-4 pb-4 grid grid-cols-2 gap-2">
                {allNav.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all",
                        isActive
                          ? "bg-olive text-white shadow-lg shadow-olive/20"
                          : "text-olive/70 bg-olive/5 hover:bg-olive/10"
                      )}
                    >
                      <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {/* User row inside drawer */}
              <div className="mx-4 mb-6 mt-2 p-4 rounded-2xl bg-ink/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-terracotta flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{user.name}</p>
                    <p className="text-[10px] uppercase tracking-wider opacity-50 font-bold">
                      {user.role.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleSubscribe}
                    className={cn(
                      "p-2 rounded-xl transition-colors",
                      isSubscribed ? "text-emerald-500" : "text-ink/30"
                    )}
                  >
                    <Bell size={18} fill={isSubscribed ? "currentColor" : "none"} />
                  </button>
                  <button
                    onClick={onLogout}
                    className="p-2 rounded-xl text-ink/30 hover:text-red-400 transition-colors"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ─── MAIN CONTENT ─────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Sticky header */}
        <header className="h-16 md:h-20 bg-warm-bg/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 md:px-10 border-b border-[#E5E5DF]/60">
          {/* Mobile: page title | Desktop: breadcrumb label */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink/40">
              {currentPage}
            </h2>
          </div>

          {/* Desktop: user info */}
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-ink">{user.name}</p>
              <p className="text-[10px] text-ink/40 uppercase tracking-[0.2em] font-bold">
                {user.role.replace('_', ' ')}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-olive text-white flex items-center justify-center text-sm font-semibold shadow-md">
              {user.name.charAt(0)}
            </div>
          </div>

          {/* Mobile: avatar only */}
          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-olive text-white flex items-center justify-center text-xs font-semibold shadow-md">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Page content — add bottom padding on mobile for the tab bar */}
        <section className="flex-1 p-3 sm:p-6 md:p-10 overflow-auto pb-24 md:pb-10">
          <div className="max-w-7xl mx-auto">
            <Outlet context={{ user }} />
          </div>
        </section>
      </main>

      {/* ─── MOBILE BOTTOM TAB BAR ────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-warm-sidebar/95 backdrop-blur-xl border-t border-[#E5E5DF] safe-area-inset-bottom">
        <div className="flex items-stretch h-16">
          {mobileTabNav.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 relative",
                  isActive ? "text-olive" : "text-ink/35"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-olive"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon
                  size={20}
                  strokeWidth={isActive ? 2.2 : 1.5}
                />
                <span className="text-[10px] font-semibold tracking-wide">
                  {item.name.split(' ')[0]}
                </span>
              </Link>
            );
          })}

          {/* "More" tab — shown only if there are more items than the tab bar shows */}
          {allNav.length > mobileTabNav.length && (
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-200",
                isMobileMenuOpen ? "text-olive" : "text-ink/35"
              )}
            >
              <Menu size={20} strokeWidth={1.5} />
              <span className="text-[10px] font-semibold tracking-wide">More</span>
            </button>
          )}
        </div>

        {/* iOS safe area spacer */}
        <div className="h-safe-bottom bg-warm-sidebar/95" />
      </nav>
    </div>
  );
}