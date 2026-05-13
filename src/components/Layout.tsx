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
  PieChart
} from 'lucide-react';
import { useState } from 'react';
import { User } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  user: User;
  onLogout: () => void;
}

export default function Layout({ user, onLogout }: LayoutProps) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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

  return (
    <div className="min-h-screen bg-warm-bg flex text-ink">

      {/* ── Desktop Sidebar (lg+): full width with labels ── */}
      <aside className="hidden lg:flex w-64 flex-col bg-warm-sidebar border-r border-[#E5E5DF] sticky top-0 h-screen overflow-y-auto shrink-0">
        <div className="p-8 pb-12">
          <h1 className="text-3xl font-serif tracking-tight text-olive font-semibold">Élégance</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] opacity-60 font-semibold mt-1">Salon Management</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {allNav.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-5 py-3 rounded-2xl text-sm transition-all duration-200 font-medium",
                  isActive
                    ? "bg-olive text-white shadow-lg shadow-olive/20"
                    : "text-olive/70 hover:text-olive hover:bg-olive/5"
                )}
              >
                <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-[#E5E5DF]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-terracotta flex items-center justify-center text-white font-semibold shadow-sm shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate text-ink">{user.name}</p>
              <p className="text-[10px] uppercase tracking-wider opacity-50 font-bold">{user.role.replace('_', ' ')}</p>
            </div>
            <button onClick={onLogout} className="text-ink/30 hover:text-ink transition-colors p-1">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Tablet Sidebar (md–lg): icon rail, expands on hover ── */}
      <motion.aside
        className="hidden md:flex lg:hidden flex-col bg-warm-sidebar border-r border-[#E5E5DF] sticky top-0 h-screen overflow-y-auto shrink-0 z-30"
        animate={{ width: isExpanded ? 220 : 68 }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Logo area */}
        <div className="flex items-center h-20 px-4 overflow-hidden shrink-0">
          <div className="w-9 h-9 rounded-xl bg-olive flex items-center justify-center text-white font-serif text-lg font-bold shrink-0">
            É
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="ml-3 text-lg font-serif tracking-tight text-olive font-semibold whitespace-nowrap overflow-hidden"
              >
                Élégance
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 space-y-1 py-2">
          {allNav.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                title={!isExpanded ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-200 font-medium overflow-hidden",
                  isActive
                    ? "bg-olive text-white shadow-lg shadow-olive/20"
                    : "text-olive/70 hover:text-olive hover:bg-olive/5"
                )}
              >
                <item.icon size={20} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.13 }}
                      className="whitespace-nowrap"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="p-2 border-t border-[#E5E5DF] shrink-0">
          <div className="flex items-center gap-3 px-1 py-2 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-terracotta flex items-center justify-center text-white font-semibold shadow-sm shrink-0 text-sm">
              {user.name.charAt(0)}
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.13 }}
                  className="flex-1 overflow-hidden flex items-center justify-between"
                >
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold truncate text-ink">{user.name}</p>
                    <p className="text-[9px] uppercase tracking-wider opacity-50 font-bold">{user.role.replace('_', ' ')}</p>
                  </div>
                  <button onClick={onLogout} className="text-ink/30 hover:text-ink transition-colors p-1 ml-1">
                    <LogOut size={14} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      {/* ── Mobile Drawer Overlay ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Mobile Sidebar Drawer ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-72 bg-warm-sidebar text-ink z-50 md:hidden flex flex-col border-r border-[#E5E5DF]"
          >
            <div className="p-6 flex justify-between items-center border-b border-[#E5E5DF]">
              <div>
                <h1 className="text-2xl font-serif tracking-tight text-olive font-semibold">Élégance</h1>
                <p className="text-[9px] uppercase tracking-[0.2em] opacity-50 font-semibold mt-0.5">Salon Management</p>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 rounded-lg bg-olive/10 flex items-center justify-center text-olive hover:bg-olive/20 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 px-4 space-y-1 py-4 overflow-y-auto">
              {allNav.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3.5 rounded-2xl text-base font-medium transition-all",
                      isActive
                        ? "bg-olive text-white shadow-lg shadow-olive/20"
                        : "text-olive/70 hover:text-olive hover:bg-olive/5"
                    )}
                  >
                    <item.icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-[#E5E5DF]">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-olive/5">
                <div className="w-10 h-10 rounded-full bg-terracotta flex items-center justify-center text-white font-semibold shadow-sm shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-semibold truncate text-ink">{user.name}</p>
                  <p className="text-[10px] uppercase tracking-wider opacity-50 font-bold">{user.role.replace('_', ' ')}</p>
                </div>
                <button onClick={onLogout} className="text-ink/40 hover:text-ink transition-colors p-1.5 rounded-lg hover:bg-olive/10">
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 md:h-20 bg-warm-bg/50 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 border-b border-[#E5E5DF]/60">
          {/* Mobile hamburger */}
          <button
            className="md:hidden w-9 h-9 rounded-xl bg-olive/10 flex items-center justify-center text-olive hover:bg-olive/20 transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={20} />
          </button>

          {/* Page title - desktop */}
          <div className="hidden md:block">
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink/40">
              {allNav.find(n => n.href === location.pathname)?.name || 'Page'}
            </h2>
          </div>

          {/* Page title - mobile (centered) */}
          <div className="md:hidden absolute left-1/2 -translate-x-1/2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink/50">
              {allNav.find(n => n.href === location.pathname)?.name || 'Page'}
            </h2>
          </div>

          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-ink">{user.name}</p>
              <p className="text-[10px] text-ink/40 uppercase tracking-[0.2em] font-bold">{user.role.replace('_', ' ')}</p>
            </div>
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-olive text-white flex items-center justify-center text-sm font-semibold shadow-md">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        <section className="flex-1 p-3 sm:p-5 md:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet context={{ user }} />
          </div>
        </section>
      </main>
    </div>
  );
}