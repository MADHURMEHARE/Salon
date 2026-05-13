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
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-warm-sidebar border-r border-[#E5E5DF] sticky top-0 h-screen overflow-y-auto">
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
            <div className="w-10 h-10 rounded-full bg-terracotta flex items-center justify-center text-white font-semibold shadow-sm">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate text-ink">{user.name}</p>
              <p className="text-[10px] uppercase tracking-wider opacity-50 font-bold">{user.role.replace('_', ' ')}</p>
            </div>
            <button 
              onClick={onLogout}
              className="text-ink/30 hover:text-ink transition-colors p-1"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
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

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-72 bg-warm-sidebar text-ink z-50 md:hidden flex flex-col border-r border-[#E5E5DF]"
          >
            <div className="p-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-serif tracking-tight text-olive font-semibold">Élégance</h1>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <nav className="flex-1 px-4 space-y-2">
              {allNav.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-4 px-5 py-4 rounded-2xl text-lg font-medium",
                    location.pathname === item.href ? "bg-olive text-white shadow-lg shadow-olive/20" : "text-olive/70"
                  )}
                >
                  <item.icon size={24} />
                  {item.name}
                </Link>
              ))}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-warm-bg/50 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6 md:px-10">
          <button 
            className="md:hidden text-ink"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
          <div className="hidden md:block">
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink/40">
              {allNav.find(n => n.href === location.pathname)?.name || 'Page'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-ink">{user.name}</p>
              <p className="text-[10px] text-ink/40 uppercase tracking-[0.2em] font-bold">{user.role.replace('_', ' ')}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-olive text-white flex items-center justify-center text-sm font-semibold shadow-md">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        <section className="flex-1 p-3 sm:p-6 md:p-10 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet context={{ user }} />
          </div>
        </section>
      </main>
    </div>
  );
}
