import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { User } from '../types';
import { 
  Plus, 
  Users, 
  Mail, 
  Shield, 
  Key,
  Trash2,
  Loader2,
  Award,
  BarChart3,
  Banknote
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import Swal from 'sweetalert2';

export default function Employees() {
  const navigate = useNavigate();
  // ... (existing state)
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [activeEmployee, setActiveEmployee] = useState<User | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [newEmployee, setNewEmployee] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'employee' 
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data } = await api.get('/employees');
      setEmployees(data);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to fetch artists', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePayout = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeEmployee) return;
    try {
      await api.post(`/employees/${activeEmployee.id}/payouts`, {
        amount: parseFloat(payoutAmount),
        notes: `Monthly payout - ${new Date().toLocaleDateString()}`
      });
      setIsPaying(false);
      setActiveEmployee(null);
      setPayoutAmount('');
      Swal.fire({
        icon: 'success',
        title: 'Payout Recorded',
        text: 'Payout successfully settled. Artist dashboard has been reset.',
        confirmButtonColor: '#6B705C'
      });
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to record payout', 'error');
    }
  };

  const openPayoutModal = (emp: User) => {
    setActiveEmployee(emp);
    setIsPaying(true);
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/employees', newEmployee);
      setIsAdding(false);
      setNewEmployee({ name: '', email: '', password: '', role: 'employee' });
      fetchEmployees();
      Swal.fire({
        icon: 'success',
        title: 'Artist Added',
        text: 'New team member identity created.',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to add employee. Email might already exist.',
        confirmButtonColor: '#6B705C'
      });
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This will permanently deactivate this artist's access.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1A1A1A',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, deactivate'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/employees/${id}`);
        fetchEmployees();
        Swal.fire('Deactivated!', 'Artist access has been revoked.', 'success');
      } catch (err) {
        console.error(err);
        Swal.fire('Error!', 'Failed to deactivate artist.', 'error');
      }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <Loader2 className="animate-spin text-[#1A1A1A]/20" size={40} />
    </div>
  );

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl md:text-5xl font-serif text-ink tracking-tight">Studio Artists</h2>
          <p className="text-sm text-olive/60 mt-2 font-medium italic">Manage your team of professionals and their access.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full md:w-auto bg-olive text-white px-8 py-4 rounded-full flex items-center justify-center gap-2 hover:bg-ink shadow-lg shadow-olive/10 transition-all active:scale-95 text-xs md:text-sm font-bold tracking-tight"
        >
          <Award size={18} />
          <span>Add Artist</span>
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-olive/12 shadow-[0_10px_30px_-10px_rgba(90,90,64,0.08)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans min-w-[600px] md:min-w-0">
          <thead>
            <tr className="border-b border-olive/5 bg-warm-bg/30">
              <th className="px-10 py-6 text-[10px] uppercase tracking-widest text-olive/40 font-bold">Artist</th>
              <th className="px-10 py-6 text-[10px] uppercase tracking-widest text-olive/40 font-bold">Email</th>
              <th className="px-10 py-6 text-[10px] uppercase tracking-widest text-olive/40 font-bold">Role</th>
              <th className="px-10 py-6 text-[10px] uppercase tracking-widest text-olive/40 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-olive/5">
            {employees.map((emp, i) => (
              <motion.tr 
                key={emp.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="hover:bg-olive/5 transition-colors group"
              >
                <td className="px-10 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[16px] bg-olive/5 border border-olive/12 flex items-center justify-center text-olive text-sm font-serif font-bold group-hover:bg-olive group-hover:text-white transition-all shadow-sm">
                      {emp.name.charAt(0)}
                    </div>
                    <span className="font-bold text-ink group-hover:text-olive transition-colors">{emp.name}</span>
                  </div>
                </td>
                <td className="px-10 py-6 text-sm text-olive/60 font-medium italic">{emp.email}</td>
                <td className="px-10 py-6">
                  <span className={cn(
                    "text-[9px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border font-bold shadow-sm",
                    emp.role === 'master_admin' ? "bg-amber-50 border-amber-100 text-amber-700" :
                    emp.role === 'admin' ? "bg-blue-50 border-blue-100 text-blue-700" :
                    "bg-warm-bg/50 border-olive/10 text-olive/40"
                  )}>
                    {emp.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-10 py-6 text-right">
                  <div className="flex justify-end items-center gap-2">
                    <button 
                      onClick={() => openPayoutModal(emp)}
                      className="p-3 text-emerald-400 hover:text-emerald-600 transition-colors rounded-xl hover:bg-emerald-50"
                      title="Settle Payout"
                    >
                      <Banknote size={20} />
                    </button>
                    <button 
                      onClick={() => navigate('/', { state: { employeeId: emp.id } })}
                      className="p-3 text-olive/40 hover:text-olive transition-colors rounded-xl hover:bg-olive/5"
                      title="View Performance"
                    >
                      <BarChart3 size={20} />
                    </button>
                    <button 
                      onClick={() => handleDelete(emp.id)}
                      className="p-3 text-red-300 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-[2rem] p-10 shadow-2xl"
          >
            <h3 className="text-2xl font-serif mb-6">Internal Access</h3>
            <form onSubmit={handleAdd} className="space-y-6">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Full Name</label>
                <input 
                  type="text" 
                  value={newEmployee.name}
                  onChange={e => setNewEmployee({...newEmployee, name: e.target.value})}
                  className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all"
                  placeholder="Artist Name"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Email Address</label>
                <input 
                  type="email" 
                  value={newEmployee.email}
                  onChange={e => setNewEmployee({...newEmployee, email: e.target.value})}
                  className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all"
                  placeholder="artist@salon.com"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Password</label>
                  <input 
                    type="password" 
                    value={newEmployee.password}
                    onChange={e => setNewEmployee({...newEmployee, password: e.target.value})}
                    className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Role</label>
                  <select 
                    value={newEmployee.role}
                    onChange={e => setNewEmployee({...newEmployee, role: e.target.value})}
                    className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all appearance-none"
                    required
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 px-6 py-3 rounded-xl border border-[#F0EBE6] text-sm font-medium hover:bg-[#FDFCFB] transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-[#1A1A1A] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-black transition-all"
                >
                  Create Identity
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {isPaying && activeEmployee && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-[2rem] p-10 shadow-2xl"
          >
            <h3 className="text-2xl font-serif mb-2 text-ink">Artist Payout</h3>
            <p className="text-sm text-olive/60 mb-8 italic">Review and settle earnings for {activeEmployee.name}.</p>
            
            <form onSubmit={handlePayout} className="space-y-6">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Payout Amount (₹)</label>
                <input 
                  type="number" 
                  value={payoutAmount}
                  onChange={e => setPayoutAmount(e.target.value)}
                  className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-4 focus:outline-none focus:border-olive/30 transition-all font-bold text-xl"
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div className="bg-olive/5 p-4 rounded-2xl border border-olive/10">
                <p className="text-[10px] uppercase font-bold text-olive/40 mb-1">Impact</p>
                <p className="text-xs text-olive/60 font-medium">Recording this payout will reset the "Pending Payout" metric on the artist's dashboard to zero.</p>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsPaying(false)}
                  className="flex-1 px-6 py-4 rounded-xl border border-[#F0EBE6] text-sm font-medium hover:bg-[#FDFCFB] transition-all"
                >
                  Discard
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-emerald-600 text-white px-6 py-4 rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all"
                >
                  Settle Payment
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
