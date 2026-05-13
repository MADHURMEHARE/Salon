import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../services/api';
import { DashboardData, User } from '../types';
import { 
  TrendingUp, 
  CreditCard,
  Calendar,
  Loader2,
  ChevronRight,
  TrendingDown,
  ArrowUpRight
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
import Swal from 'sweetalert2';

export default function Reports() {
  const { user } = useOutletContext<{ user: User }>();
  // ... (existing state)
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'day' | 'month' | 'year'>('month');
  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  const fetchReport = async (p: string, empId: string) => {
    setLoading(true);
    try {
      const url = empId 
        ? `/analytics/dashboard?employeeId=${empId}&period=${p}` 
        : `/analytics/dashboard?period=${p}`;
      const { data } = await api.get(url);
      setData(data);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Report Error',
        text: 'Failed to generate financial report'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(period, selectedEmployeeId);
  }, [period, selectedEmployeeId]);

  useEffect(() => {
    if (user.role !== 'employee') {
      api.get('/employees').then(res => setEmployees(res.data)).catch(err => {
        console.error(err);
        Swal.fire('Error', 'Failed to fetch artist list', 'error');
      });
    }
  }, [user.role]);

  if (loading && !data) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="animate-spin text-olive/20" size={40} />
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="serif text-4xl md:text-5xl text-ink">Financial Reports</h2>
          <p className="text-sm text-olive/60 italic mt-1 font-medium">Detailed revenue and performance analytics for your studio.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row flex-wrap gap-4">
          <div className="flex bg-white/50 border border-olive/12 rounded-full p-1 backlog-blur-sm shadow-sm">
            {(['day', 'month', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "flex-1 md:flex-none px-4 md:px-6 py-2 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all",
                  period === p 
                    ? "bg-olive text-white shadow-md" 
                    : "text-olive/40 hover:text-olive/60"
                )}
              >
                {p}
              </button>
            ))}
          </div>

          {user.role !== 'employee' && (
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="bg-white border border-olive/12 text-olive px-6 py-3 rounded-full text-xs md:text-sm font-bold tracking-tight hover:bg-olive/5 transition-all shadow-sm outline-none cursor-pointer"
            >
              <option value="">Studio Revenue</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          )}
        </div>
      </header>

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-10 rounded-[32px] border border-olive/12 shadow-[0_10px_30px_-10px_rgba(90,90,64,0.08)]"
            >
              <div className="flex items-center gap-6 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-olive/5 flex items-center justify-center text-olive">
                  <TrendingUp size={28} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-ink/40">Gross Revenue</p>
                  <h3 className="text-3xl font-semibold serif text-ink">₹{data.metrics.totalRevenue.toLocaleString()}</h3>
                </div>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50 w-fit px-3 py-1.5 rounded-full">
                <ArrowUpRight size={14} />
                <span>Active Period</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-10 rounded-[32px] border border-olive/12 shadow-[0_10px_30px_-10px_rgba(90,90,64,0.08)]"
            >
              <div className="flex items-center gap-6 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-terracotta">
                  <CreditCard size={28} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-ink/40">Net Profit</p>
                  <h3 className="text-3xl font-semibold serif text-ink">₹{data.metrics.salonProfit.toLocaleString()}</h3>
                </div>
              </div>
              <p className="text-xs text-olive/40 italic font-medium">After artist commissions deduction</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-olive text-white p-10 rounded-[32px] shadow-2xl shadow-olive/20"
            >
              <div className="flex items-center gap-6 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                  <Calendar size={28} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-white/50">Activity</p>
                  <h3 className="text-3xl font-semibold serif">{data.metrics.appointments} Sessions</h3>
                </div>
              </div>
              <div className="text-xs text-white/40 font-medium">Total finalized transactions in this period</div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
            <div className="bg-white p-12 rounded-[40px] border border-olive/12 shadow-[0_20px_50px_-20px_rgba(90,90,64,0.1)]">
              <div className="flex justify-between items-center mb-12">
                <div>
                  <h3 className="serif text-3xl text-ink">Revenue Progression</h3>
                  <p className="text-sm text-olive/40 italic font-medium mt-1">Comparing financial flow across the selected {period}s</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-olive"></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Revenue Flow</span>
                  </div>
                </div>
              </div>
              
              <div className="h-[450px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.recentRevenue}>
                    <defs>
                      <linearGradient id="reportGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5A5A40" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#5A5A40" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#F0EBE6" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#5A5A40', fontWeight: 600, opacity: 0.6 }} 
                      dy={20}
                      padding={{ left: 20, right: 20 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#5A5A40', fontWeight: 600, opacity: 0.6 }} 
                      dx={-10}
                    />
                    <Tooltip 
                      cursor={{ stroke: '#5A5A40', strokeWidth: 1, strokeDasharray: '4 4' }}
                      contentStyle={{ 
                        borderRadius: '24px', 
                        border: 'none', 
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                        padding: '20px',
                        backgroundColor: '#FFF'
                      }}
                      itemStyle={{ fontWeight: 'bold', color: '#1A1A1A' }}
                      labelStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#A19B95', marginBottom: '8px' }}
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#5A5A40" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#reportGradient)"
                      activeDot={{ r: 8, fill: '#5A5A40', stroke: '#FFF', strokeWidth: 4 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-10 rounded-[32px] border border-olive/12">
              <h3 className="serif text-2xl text-ink mb-2">Service Breakdown</h3>
              <p className="text-xs text-olive/40 italic font-medium mb-10">Popularity and demand distribution</p>
              
              <div className="space-y-6">
                {data.topServices.map((s, i) => (
                  <div key={s.name}>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-bold text-ink">{s.name}</span>
                      <span className="text-[10px] font-bold text-olive/40 uppercase">{s.count} Bookings</span>
                    </div>
                    <div className="h-2 w-full bg-olive/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(s.count / (data.topServices[0]?.count || 1)) * 100}%` }}
                        className="h-full bg-olive rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1A1A1A] text-white p-10 rounded-[32px] shadow-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/40">
                  <TrendingDown size={20} />
                </div>
                <h3 className="serif text-2xl">Financial Note</h3>
              </div>
              <p className="text-sm text-white/60 leading-relaxed italic mb-8">
                The revenue shown reflects gross income from services before any material costs or operational expenses are deducted. Net profit shown is after artist commissions only.
              </p>
              <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/30 mb-2">Summary</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-white/70">Efficiency Index</span>
                  <span className="text-emerald-400 font-bold">Good</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
