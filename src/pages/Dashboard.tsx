import { useState, useEffect } from 'react';
import { Link, useOutletContext, useLocation } from 'react-router-dom';
import api from '../services/api';
import { DashboardData, User } from '../types';
import QuickBillModal from '../components/QuickBillModal';
import { 
  TrendingUp, 
  Users, 
  CalendarCheck, 
  CreditCard,
  ArrowUpRight,
  Loader2,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';

export default function Dashboard() {
  const { user } = useOutletContext<{ user: User }>();
  const location = useLocation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isQuickBillOpen, setIsQuickBillOpen] = useState(false);
  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(location.state?.employeeId || '');
  const [period, setPeriod] = useState<'day' | 'month' | 'year'>('day');

  const fetchData = async (empId?: string, currentPeriod?: string) => {
    try {
      const p = currentPeriod || period;
      const url = empId 
        ? `/analytics/dashboard?employeeId=${empId}&period=${p}` 
        : `/analytics/dashboard?period=${p}`;
      const { data } = await api.get(url);
      setData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedEmployeeId, period);
    if (user.role !== 'employee') {
      api.get('/employees').then(res => setEmployees(res.data)).catch(console.error);
    }
  }, [selectedEmployeeId, user.role, period]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-olive/20" size={36} />
    </div>
  );

  if (!data) return null;

  const isViewingIndividual = user.role === 'employee' || selectedEmployeeId !== '';
  const isEmployee = user.role === 'employee';

  const stats = [
    ...(isEmployee ? [] : [{ 
      name: selectedEmployeeId ? 'Employee Sales' : 'Total Revenue', 
      value: `₹${data.metrics.totalRevenue.toLocaleString()}`, 
      icon: TrendingUp,
      accent: false
    }]),
    { 
      name: isEmployee ? 'Lifetime Earnings' : (selectedEmployeeId ? 'Employee Earnings' : 'Salon Profit'), 
      value: `₹${data.metrics.salonProfit.toLocaleString()}`, 
      icon: CreditCard,
      accent: true
    },
    ...(isViewingIndividual ? [{
      name: 'Pending Payout',
      value: `₹${(data.metrics.pendingCommission || 0).toLocaleString()}`,
      icon: ArrowUpRight,
      accent: false
    }] : []),
    { 
      name: isViewingIndividual ? 'Clients Served' : 'Total Customers', 
      value: data.metrics.customers.toLocaleString(), 
      icon: Users,
      accent: false
    },
    { 
      name: isViewingIndividual ? 'Sessions' : 'Appointments', 
      value: data.metrics.appointments.toLocaleString(), 
      icon: CalendarCheck,
      accent: false
    },
  ];

  // Custom select wrapper for consistent styling
  const SelectPill = ({ value, onChange, children }: any) => (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="appearance-none bg-white border border-olive/12 text-olive pl-4 pr-9 py-2.5 rounded-full text-xs font-bold tracking-tight hover:bg-olive/5 transition-all shadow-sm outline-none cursor-pointer w-full"
      >
        {children}
      </select>
      <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-olive/40 pointer-events-none" />
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-10">

      {/* ── Header ─────────────────────────────────────── */}
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        {/* Title block */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-olive/40 font-bold mb-1 flex items-center gap-1.5">
            <Sparkles size={9} className="opacity-60" />
            {isEmployee ? "Your Studio" : "Salon Intelligence"}
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-ink leading-none">Overview</h2>
          <p className="text-xs text-olive/50 italic mt-1.5 font-medium">
            {selectedEmployeeId 
              ? `Viewing: ${employees.find(e => e.id.toString() === selectedEmployeeId)?.name}`
              : isEmployee 
                ? "Your performance and earnings today."
                : "Welcome back. Your salon is flourishing."
            }
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {/* Filters row */}
          <div className="flex gap-2 flex-1 sm:flex-none">
            <SelectPill value={period} onChange={(e: any) => setPeriod(e.target.value)}>
              <option value="day">Daily</option>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </SelectPill>

            {user.role !== 'employee' && (
              <SelectPill value={selectedEmployeeId} onChange={(e: any) => setSelectedEmployeeId(e.target.value)}>
                <option value="">All Studio</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </SelectPill>
            )}
          </div>

          {/* Action buttons row */}
          <div className="flex gap-2">
            <button 
              onClick={() => setIsQuickBillOpen(true)}
              className="flex-1 sm:flex-none bg-white border border-olive/12 text-olive px-5 py-2.5 rounded-full text-xs font-bold tracking-tight hover:bg-olive/5 transition-all active:scale-95 shadow-sm whitespace-nowrap"
            >
              Quick Bill
            </button>
            <Link 
              to="/admin/appointments"
              className="flex-1 sm:flex-none bg-olive text-white px-5 py-2.5 rounded-full text-xs font-bold tracking-tight shadow-lg shadow-olive/20 hover:shadow-olive/30 transition-all text-center whitespace-nowrap active:scale-95"
            >
              + New Appt
            </Link>
          </div>
        </div>
      </header>

      {isQuickBillOpen && (
        <QuickBillModal 
          currentUser={user}
          onClose={() => setIsQuickBillOpen(false)} 
          onSuccess={() => { setIsQuickBillOpen(false); fetchData(); }} 
        />
      )}

      {/* ── Stat Cards ─────────────────────────────────── */}
      {/* Mobile: horizontal scroll strip | md+: grid */}
      <div className="md:hidden -mx-3 px-3">
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              className={cn(
                "snap-start shrink-0 w-44 p-5 rounded-3xl border",
                stat.accent 
                  ? "bg-terracotta/5 border-terracotta/15"
                  : "bg-white border-olive/10 shadow-[0_6px_20px_-6px_rgba(90,90,64,0.08)]"
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center mb-3",
                stat.accent ? "bg-terracotta/10 text-terracotta" : "bg-olive/8 text-olive"
              )}>
                <stat.icon size={17} strokeWidth={1.8} />
              </div>
              <p className="text-[9px] uppercase font-bold tracking-widest text-ink/35 mb-1 leading-tight">{stat.name}</p>
              <h3 className="text-xl font-semibold font-serif text-ink">{stat.value}</h3>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Desktop grid */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={cn(
              "p-6 lg:p-8 rounded-[28px] border group hover:shadow-xl transition-all duration-300",
              stat.accent 
                ? "bg-terracotta/5 border-terracotta/15"
                : "bg-white border-olive/10 shadow-[0_10px_30px_-10px_rgba(90,90,64,0.08)]"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center transition-transform group-hover:scale-110",
                stat.accent ? "bg-terracotta/10 text-terracotta" : "bg-olive/8 text-olive"
              )}>
                <stat.icon size={20} strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold tracking-widest text-ink/35 mb-1">{stat.name}</p>
                <h3 className="text-2xl font-semibold font-serif text-ink">{stat.value}</h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Charts Row ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">

        {/* Area chart */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-7 md:p-10 rounded-[28px] md:rounded-[32px] border border-olive/10 shadow-[0_10px_30px_-10px_rgba(90,90,64,0.08)]">
          <div className="flex justify-between items-center mb-5 md:mb-8">
            <div>
              <h3 className="font-serif text-lg md:text-2xl text-ink">
                {isEmployee ? 'Earnings Overview' : (selectedEmployeeId ? 'Personal Sales' : 'Revenue Overview')}
              </h3>
              <p className="text-[10px] text-olive/40 font-medium mt-0.5 uppercase tracking-wider">
                {period === 'day' ? 'Today' : period === 'month' ? 'This Month' : 'This Year'}
              </p>
            </div>
            <span className="text-xs underline cursor-pointer font-semibold text-olive/50 hover:text-olive transition-colors">Details</span>
          </div>
          <div className="h-[220px] sm:h-[280px] md:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.recentRevenue} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5A5A40" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#5A5A40" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5DF" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#5A5A40', opacity: 0.5 }} 
                  dy={12}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#5A5A40', opacity: 0.5 }}
                  width={50}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: '1px solid rgba(90,90,64,0.1)', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
                    fontSize: '11px',
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#5A5A40" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top services */}
        <div className="bg-olive text-white p-5 sm:p-7 md:p-8 rounded-[28px] md:rounded-[32px] shadow-2xl flex flex-col">
          <div className="mb-5 md:mb-8">
            <h3 className="font-serif text-lg md:text-2xl mb-1">Top Performed</h3>
            <p className="text-[10px] opacity-50 font-light italic">Most requested services</p>
          </div>

          {/* Mobile: compact horizontal pills */}
          <div className="flex-1 space-y-4 md:space-y-6">
            {data.topServices.map((service, i) => (
              <div key={service.name} className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold tracking-tight">{service.name}</span>
                  <span className="text-[9px] uppercase font-bold opacity-50">{service.count}×</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(service.count / (data.topServices[0]?.count || 1)) * 100}%` }}
                    transition={{ delay: i * 0.1, duration: 0.6, ease: 'easeOut' }}
                    className="h-full bg-white/80 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <button className="w-full py-3 text-[10px] font-bold uppercase tracking-widest bg-white/10 hover:bg-white/20 rounded-2xl transition-all active:scale-95">
              View Analytics Report
            </button>
          </div>
        </div>
      </div>

      {/* ── Recent Sessions Table ───────────────────────── */}
      <div className="bg-white rounded-[28px] md:rounded-[32px] border border-olive/10 shadow-[0_10px_30px_-10px_rgba(90,90,64,0.08)] overflow-hidden mb-4 md:mb-10">
        <div className="flex justify-between items-center px-5 sm:px-7 md:px-10 py-5 md:py-7 border-b border-olive/6">
          <h3 className="font-serif text-lg md:text-2xl text-ink">Recent Sessions</h3>
          <Link to="/admin/appointments" className="text-xs underline font-semibold text-olive/50 hover:text-olive transition-colors">
            View All
          </Link>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden divide-y divide-olive/6">
          {data.recentAppointments.map((appt) => (
            <div key={appt.id} className="flex items-center gap-3 px-5 py-4">
              <div className="w-9 h-9 rounded-full bg-olive/8 flex items-center justify-center text-olive font-semibold text-sm shrink-0">
                {appt.customer_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-ink truncate">{appt.customer_name}</p>
                <p className="text-[10px] text-olive/50 font-medium truncate">{appt.service_name} · <span className="italic">{appt.employee_name}</span></p>
              </div>
              <span className={cn(
                "text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full border font-bold shrink-0",
                appt.status === 'completed' ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                appt.status === 'confirmed' ? "bg-blue-50 border-blue-100 text-blue-600" :
                "bg-white border-olive/10 text-olive/30"
              )}>
                {appt.status === 'completed' ? 'Paid' : appt.status}
              </span>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-olive/35 font-bold">
                <th className="px-10 pb-4 pt-6">Customer</th>
                <th className="pb-4 pt-6">Service</th>
                <th className="pb-4 pt-6">Stylist</th>
                <th className="px-10 pb-4 pt-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-olive/5">
              {data.recentAppointments.map((appt) => (
                <tr key={appt.id} className="group hover:bg-olive/2 transition-colors">
                  <td className="px-10 py-5">
                    <p className="text-xs font-bold text-ink">{appt.customer_name}</p>
                    <p className="text-[10px] text-olive/40 font-medium">{appt.customer_phone}</p>
                  </td>
                  <td className="py-5">
                    <p className="text-xs text-olive/60 font-medium">{appt.service_name}</p>
                  </td>
                  <td className="py-5">
                    <p className="text-xs text-olive/60 font-medium italic">{appt.employee_name}</p>
                  </td>
                  <td className="px-10 py-5 text-right">
                    <span className={cn(
                      "text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full border font-bold",
                      appt.status === 'completed' ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                      appt.status === 'confirmed' ? "bg-blue-50 border-blue-100 text-blue-600" :
                      "bg-white border-olive/10 text-olive/20"
                    )}>
                      {appt.status === 'completed' ? 'PAID' : appt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}