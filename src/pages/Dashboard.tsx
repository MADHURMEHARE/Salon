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
  ArrowDownRight,
  Loader2
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
  BarChart,
  Bar,
  Cell
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
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="animate-spin text-olive/20" size={40} />
    </div>
  );

  if (!data) return null;

  const isViewingIndividual = user.role === 'employee' || selectedEmployeeId !== '';
  const isEmployee = user.role === 'employee';

  const stats = [
    // Hide Sales for employees viewing their own dashboard
    ...(isEmployee ? [] : [{ 
      name: selectedEmployeeId ? 'Employee Sales' : 'Total Revenue', 
      value: `₹${data.metrics.totalRevenue.toLocaleString()}`, 
      icon: TrendingUp 
    }]),
    { 
      name: isEmployee ? 'Lifetime Earnings' : (selectedEmployeeId ? 'Employee Earnings' : 'Salon Profit'), 
      value: `₹${data.metrics.salonProfit.toLocaleString()}`, 
      icon: CreditCard 
    },
    ...(isViewingIndividual ? [{
      name: 'Pending Payout',
      value: `₹${(data.metrics.pendingCommission || 0).toLocaleString()}`,
      icon: ArrowUpRight
    }] : []),
    { 
      name: isViewingIndividual ? 'Clients Served' : 'Total Customers', 
      value: data.metrics.customers.toLocaleString(), 
      icon: Users 
    },
    { 
      name: isViewingIndividual ? 'Sessions' : 'Appointments', 
      value: data.metrics.appointments.toLocaleString(), 
      icon: CalendarCheck 
    },
  ];

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="serif text-4xl md:text-5xl text-ink">Overview</h2>
          <p className="text-sm text-olive/60 italic mt-1 font-medium">
            {selectedEmployeeId 
              ? `Viewing performance for ${employees.find(e => e.id.toString() === selectedEmployeeId)?.name}`
              : isEmployee ? "Your performance and earnings today." : "Welcome back. Your salon is flourishing today."
            }
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="flex-1 md:flex-none bg-white border border-olive/12 text-olive px-4 md:px-6 py-3 md:py-4 rounded-full text-xs md:text-sm font-bold tracking-tight hover:bg-olive/5 transition-all shadow-sm outline-none cursor-pointer"
          >
            <option value="day">Daily View</option>
            <option value="month">Monthly View</option>
            <option value="year">Yearly View</option>
          </select>

          {user.role !== 'employee' && (
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="flex-1 md:flex-none bg-white border border-olive/12 text-olive px-4 md:px-6 py-3 md:py-4 rounded-full text-xs md:text-sm font-bold tracking-tight hover:bg-olive/5 transition-all shadow-sm outline-none cursor-pointer"
            >
              <option value="">All Studio Data</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          )}
          <div className="flex w-full md:w-auto gap-3">
            <button 
              onClick={() => setIsQuickBillOpen(true)}
              className="flex-1 md:flex-none bg-white border border-olive/12 text-olive px-6 py-3 md:px-8 md:py-4 rounded-full text-xs md:text-sm font-bold tracking-tight hover:bg-olive/5 transition-all active:scale-95 shadow-sm"
            >
              Quick Bill
            </button>
            <Link 
              to="/admin/appointments"
              className="flex-1 md:flex-none bg-olive text-white px-6 py-3 md:px-8 md:py-4 rounded-full text-xs md:text-sm font-bold tracking-tight shadow-lg shadow-olive/20 hover:shadow-olive/30 transition-all text-center"
            >
              New Appt
            </Link>
          </div>
        </div>
      </header>

      {isQuickBillOpen && (
        <QuickBillModal 
          currentUser={user}
          onClose={() => setIsQuickBillOpen(false)} 
          onSuccess={() => {
            setIsQuickBillOpen(false);
            fetchData();
          }} 
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-[32px] border border-olive/12 shadow-[0_10px_30px_-10px_rgba(90,90,64,0.08)] group hover:shadow-xl transition-all"
          >
            <div className="flex items-center gap-5">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110",
                i === 1 ? "bg-orange-50 text-terracotta" : "bg-olive/5 text-olive"
              )}>
                <stat.icon size={22} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-ink/40 mb-1">{stat.name}</p>
                <h3 className="text-2xl font-semibold serif text-ink">{stat.value}</h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[32px] border border-olive/12 shadow-[0_10px_30px_-10px_rgba(90,90,64,0.08)]">
          <div className="flex justify-between items-center mb-10">
            <h3 className="serif text-2xl text-ink">
              {isEmployee ? 'Earnings Overview' : (selectedEmployeeId ? 'Personal Sales' : 'Revenue Overview')}
            </h3>
            <span className="text-xs underline cursor-pointer font-semibold text-olive/60">Details</span>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.recentRevenue}>
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
                  tick={{ fontSize: 10, fill: '#5A5A40', opacity: 0.5 }} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#5A5A40', opacity: 0.5 }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '20px', 
                    border: '1px solid rgba(90,90,64,0.1)', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                    fontSize: '12px',
                    fontFamily: 'Inter'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#5A5A40" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-olive text-white p-10 rounded-[32px] shadow-2xl flex flex-col">
          <h3 className="serif text-2xl mb-2">Top Performed</h3>
          <p className="text-xs opacity-60 mb-10 font-light italic">Studio's most requested services</p>
          <div className="space-y-8 flex-1">
            {data.topServices.map((service, i) => (
              <div key={service.name} className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold tracking-tight">{service.name}</span>
                  <span className="text-[10px] uppercase font-bold opacity-50">{service.count} bookings</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(service.count / (data.topServices[0]?.count || 1)) * 100}%` }}
                    className="h-full bg-white transition-all shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 pt-10 border-t border-white/10">
            <button className="w-full py-4 text-xs font-bold uppercase tracking-widest bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
              View Analytics Report
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[32px] border border-olive/12 shadow-[0_10px_30px_-10px_rgba(90,90,64,0.08)] flex flex-col mb-10">
        <div className="flex justify-between items-center mb-8">
          <h3 className="serif text-2xl text-ink">Recent Sessions</h3>
          <Link to="/admin/appointments" className="text-xs underline cursor-pointer font-semibold text-olive/60">View All</Link>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-olive/40 font-bold border-b border-olive/5">
                <th className="pb-4">Customer</th>
                <th className="pb-4">Service</th>
                <th className="pb-4">Stylist</th>
                <th className="pb-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-olive/5">
              {data.recentAppointments.map((appt) => (
                <tr key={appt.id} className="group">
                  <td className="py-5">
                    <p className="text-xs font-bold text-ink">{appt.customer_name}</p>
                    <p className="text-[10px] text-olive/40 font-medium">{appt.customer_phone}</p>
                  </td>
                  <td className="py-5">
                    <p className="text-xs text-olive/60 font-medium">{appt.service_name}</p>
                  </td>
                  <td className="py-5">
                    <p className="text-xs text-olive/60 font-medium italic">{appt.employee_name}</p>
                  </td>
                  <td className="py-5 text-right">
                    <span className={cn(
                      "text-[9px] uppercase tracking-wider px-2 py-1 rounded-full border font-bold",
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
