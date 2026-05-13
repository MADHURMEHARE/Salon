import { useState, useEffect, FormEvent } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../services/api';
import { Appointment, Customer, User, Service } from '../types';
import { 
  Calendar, 
  Plus, 
  Clock, 
  Phone,
  Trash2,
  User as UserIcon, 
  Scissors, 
  CheckCircle2, 
  XCircle,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import QuickBillModal from '../components/QuickBillModal';
import Swal from 'sweetalert2';

export default function Appointments() {
  const { user: currentUser } = useOutletContext<{ user: User }>();
  // ... (existing state)
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isQuickBillOpen, setIsQuickBillOpen] = useState(false);
  const [lastPaidAppt, setLastPaidAppt] = useState<Appointment | null>(null);
  
  const [newBooking, setNewBooking] = useState({
    customer_id: '',
    employee_id: '',
    service_id: '',
    start_time: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appts, custs, emps, servs] = await Promise.all([
        api.get('/appointments'),
        api.get('/customers'),
        api.get('/employees'),
        api.get('/services')
      ]);
      setAppointments(appts.data);
      setCustomers(custs.data);
      setEmployees(emps.data);
      setServices(servs.data);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch data'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/appointments', newBooking);
      setIsBooking(false);
      setNewBooking({ customer_id: '', employee_id: '', service_id: '', start_time: '', notes: '' });
      fetchData();
      Swal.fire({
        icon: 'success',
        title: 'Booked',
        text: 'Appointment scheduled successfully',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Booking Failed',
        text: 'Could not schedule appointment'
      });
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingAppointment) return;
    try {
      await api.put(`/appointments/${editingAppointment.id}`, editingAppointment);
      setEditingAppointment(null);
      fetchData();
      Swal.fire({
        icon: 'success',
        title: 'Updated',
        text: 'Appointment updated successfully',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'Could not update appointment'
      });
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1A1A1A',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/appointments/${id}`);
        fetchData();
        Swal.fire('Deleted!', 'Appointment has been deleted.', 'success');
      } catch (err) {
        console.error(err);
        Swal.fire('Error!', 'Failed to delete appointment.', 'error');
      }
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      fetchData();
      Swal.fire({
        icon: 'success',
        title: 'Status Updated',
        text: `Appointment set to ${status}`,
        timer: 1000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to update status', 'error');
    }
  };

  const handleCheckout = async (appt: Appointment) => {
    try {
      await api.post('/billing/checkout', {
        appointment_id: appt.id,
        customer_id: appt.customer_id,
        employee_id: appt.employee_id,
        service_id: appt.service_id,
        payment_method: 'Cash'
      });
      fetchData();
      setLastPaidAppt(appt);
    } catch (err) {
      console.error(err);
      Swal.fire('Checkout Failed', 'Transaction could not be processed', 'error');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <Loader2 className="animate-spin text-[#1A1A1A]/20" size={40} />
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl md:text-5xl font-serif text-ink tracking-tight">Schedule</h2>
          <p className="text-sm text-olive/60 mt-2 font-medium italic">Plan and manage your salon's daily visits.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setIsQuickBillOpen(true)}
            className="flex-1 md:flex-none bg-white border border-olive/12 text-olive px-6 md:px-8 py-3 md:py-4 rounded-full text-xs md:text-sm font-bold tracking-tight hover:bg-olive/5 transition-all shadow-sm active:scale-95"
          >
            Quick Bill
          </button>
          <button 
            onClick={() => setIsBooking(true)}
            className="flex-1 md:flex-none bg-olive text-white px-6 md:px-8 py-3 md:py-4 rounded-full flex items-center justify-center gap-2 hover:bg-ink shadow-lg shadow-olive/10 transition-all active:scale-95 text-xs md:text-sm font-bold tracking-tight"
          >
            <Plus size={18} />
            <span>Book Session</span>
          </button>
        </div>
      </div>

      {isQuickBillOpen && (
        <QuickBillModal 
          currentUser={currentUser}
          onClose={() => setIsQuickBillOpen(false)} 
          onSuccess={() => {
            setIsQuickBillOpen(false);
            fetchData();
          }} 
        />
      )}

      <div className="bg-white rounded-[32px] border border-olive/12 shadow-[0_10px_30px_-10px_rgba(90,90,64,0.08)] overflow-hidden">
        <div className="grid grid-cols-1 divide-y divide-olive/5">
          {appointments.length === 0 ? (
            <div className="p-24 text-center text-olive/40">
              <Calendar size={48} className="mx-auto mb-6 opacity-20" />
              <p className="font-medium italic text-lg">No appointments scheduled for today.</p>
            </div>
          ) : (
            appointments.map((appt, i) => (
              <motion.div 
                key={appt.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-8 hover:bg-olive/5 transition-colors group"
              >
                <div className="flex items-center gap-4 md:gap-8 flex-1 w-full">
                  <div className="flex flex-col items-center justify-center min-w-[64px] h-16 md:w-18 md:h-18 rounded-[20px] md:rounded-[24px] bg-warm-bg border border-olive/10 group-hover:bg-olive group-hover:text-white transition-all shadow-sm">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-olive group-hover:text-white/60 mb-0.5">
                      {format(new Date(appt.start_time), 'MMM')}
                    </span>
                    <span className="text-xl md:text-2xl font-serif font-semibold">{format(new Date(appt.start_time), 'd')}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                      <h4 className="text-lg md:text-xl font-semibold text-ink group-hover:text-olive transition-colors truncate">{appt.customer_name}</h4>
                      <span className={cn(
                        "text-[8px] md:text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 md:py-1 rounded-full border font-bold shadow-sm whitespace-nowrap",
                        appt.status === 'completed' ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                        appt.status === 'confirmed' ? "bg-blue-50 border-blue-100 text-blue-600" :
                        appt.status === 'cancelled' ? "bg-red-50 border-red-100 text-red-600" :
                        "bg-white border-olive/10 text-olive/40"
                      )}>
                        {appt.status === 'completed' ? 'PAID' : appt.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 md:gap-x-6">
                      <div className="flex items-center gap-1.5 text-xs text-olive/60 font-medium">
                        <Phone size={12} className="text-olive/40" />
                        <span>{appt.customer_phone || 'No Phone'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-olive/60 font-medium">
                        <Clock size={12} className="text-olive/40" />
                        <span>{format(new Date(appt.start_time), 'h:mm a')}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-olive/60 font-medium">
                        <Scissors size={12} className="text-olive/40" />
                        <span>{appt.service_name}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto pt-4 md:pt-0 border-t border-olive/5 md:border-t-0">
                  <div className="flex items-center gap-2 md:gap-4">
                    {appt.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => updateStatus(appt.id, 'confirmed')}
                        className="p-3 text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all border border-transparent hover:border-emerald-100"
                        title="Confirm"
                      >
                        <CheckCircle2 size={22} />
                      </button>
                      <button 
                        onClick={() => updateStatus(appt.id, 'cancelled')}
                        className="p-3 text-red-400 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100"
                        title="Cancel"
                      >
                        <XCircle size={22} />
                      </button>
                    </>
                  )}
                  {appt.status === 'confirmed' && (
                    <button 
                      onClick={() => handleCheckout(appt)}
                      className="bg-olive text-white px-6 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-ink shadow-lg shadow-olive/10 transition-all transition-transform active:scale-95"
                    >
                      Checkout
                    </button>
                  )}
                  {appt.status === 'completed' && (
                    <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full">
                      <CheckCircle2 size={14} /> PAID
                    </span>
                  )}
                  <div className="flex gap-1 ml-2">
                    <button 
                      onClick={() => setEditingAppointment(appt)}
                      className="p-3 text-olive/30 hover:text-olive hover:bg-olive/5 rounded-xl transition-all"
                      title="Edit"
                    >
                      <ChevronRight size={22} />
                    </button>
                    {currentUser.role !== 'employee' && (
                      <button 
                        onClick={() => handleDelete(appt.id)}
                        className="p-3 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {isBooking && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-xl rounded-[2rem] p-10 shadow-2xl"
          >
            <h3 className="text-2xl font-serif mb-8">New Appointment</h3>
            <form onSubmit={handleBooking} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Select Client</label>
                  <select 
                    value={newBooking.customer_id}
                    onChange={e => setNewBooking({...newBooking, customer_id: e.target.value})}
                    className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all appearance-none"
                    required
                  >
                    <option value="">Choose one...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Select Service</label>
                  <select 
                    value={newBooking.service_id}
                    onChange={e => setNewBooking({...newBooking, service_id: e.target.value})}
                    className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all appearance-none"
                    required
                  >
                    <option value="">Choose one...</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name} (₹{s.price})</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Select Artist</label>
                  <select 
                    value={newBooking.employee_id}
                    onChange={e => setNewBooking({...newBooking, employee_id: e.target.value})}
                    className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all appearance-none"
                    required
                  >
                    <option value="">Choose one...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Date & Time</label>
                  <input 
                    type="datetime-local" 
                    value={newBooking.start_time}
                    onChange={e => setNewBooking({...newBooking, start_time: e.target.value})}
                    className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Special Notes</label>
                <textarea 
                  value={newBooking.notes}
                  onChange={e => setNewBooking({...newBooking, notes: e.target.value})}
                  className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all min-h-[100px]"
                  placeholder="Any preferences or requirements..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsBooking(false)}
                  className="flex-1 px-6 py-4 rounded-xl border border-[#F0EBE6] text-sm font-medium hover:bg-[#FDFCFB] transition-all"
                >
                  Discard
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-[#1A1A1A] text-white px-6 py-4 rounded-xl text-sm font-medium hover:bg-black transition-all"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* PAID / Receipt Modal */}
      {lastPaidAppt && (
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-white w-full max-w-md rounded-[40px] overflow-hidden shadow-[0_30px_100px_-20px_rgba(0,0,0,0.5)] relative"
          >
            {/* Top Pattern */}
            <div className="h-3 bg-emerald-500 w-full" />
            
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                <CheckCircle2 size={40} />
              </div>
              
              <h2 className="text-3xl font-serif text-ink mb-2">Transaction Paid</h2>
              <p className="text-olive/60 font-medium italic text-sm mb-8">Receipt summary for your records</p>
              
              <div className="bg-warm-bg/50 rounded-3xl p-6 mb-8 text-left border border-olive/5 space-y-4 relative overflow-hidden">
                {/* Visual "PAID" Stamp */}
                <div className="absolute -right-4 -top-4 opacity-[0.08] pointer-events-none select-none">
                  <span className="text-[120px] font-black border-[12px] border-emerald-600 text-emerald-600 px-6 rounded-[40px] rotate-[24deg] inline-block">PAID</span>
                </div>

                <div className="flex justify-between items-end border-b border-olive/5 pb-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-olive/40 font-bold block mb-1">Customer</span>
                    <span className="text-lg font-bold text-ink">{lastPaidAppt.customer_name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-widest text-olive/40 font-bold block mb-1">Date</span>
                    <span className="text-xs font-bold text-olive">{format(new Date(), 'MMM d, h:mm a')}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-olive/60 font-medium">{lastPaidAppt.service_name}</span>
                    <span className="font-bold text-ink">₹{services.find(s => s.id === lastPaidAppt.service_id)?.price || '0.00'}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-olive/10">
                    <span className="text-base font-serif text-olive">Total Amount</span>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-2xl font-bold text-ink">₹{services.find(s => s.id === lastPaidAppt.service_id)?.price || '0.00'}</span>
                      <span className="text-[9px] uppercase tracking-widest font-black text-emerald-600 mt-1 bg-emerald-50 px-2 rounded">CASH RECEIVED</span>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setLastPaidAppt(null)}
                className="w-full bg-ink text-white py-5 rounded-2xl font-bold tracking-tight hover:bg-black transition-all shadow-xl active:scale-95"
              >
                Close Receipt
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Appointment Edit Modal */}
      {editingAppointment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-xl rounded-[2rem] p-10 shadow-2xl"
          >
            <h3 className="text-2xl font-serif mb-8">Update Appointment</h3>
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Select Client</label>
                  <select 
                    value={editingAppointment.customer_id}
                    onChange={e => setEditingAppointment({...editingAppointment, customer_id: parseInt(e.target.value)})}
                    className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all font-bold appearance-none"
                    required
                  >
                    <option value="">Choose one...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Select Service</label>
                  <select 
                    value={editingAppointment.service_id}
                    onChange={e => setEditingAppointment({...editingAppointment, service_id: parseInt(e.target.value)})}
                    className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all font-bold appearance-none"
                    required
                  >
                    <option value="">Choose one...</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name} (₹{s.price})</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Select Artist</label>
                  <select 
                    value={editingAppointment.employee_id}
                    onChange={e => setEditingAppointment({...editingAppointment, employee_id: parseInt(e.target.value)})}
                    className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all font-bold appearance-none"
                    required
                  >
                    <option value="">Choose one...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Date & Time</label>
                  <input 
                    type="datetime-local" 
                    value={editingAppointment.start_time.split('.')[0]} 
                    onChange={e => setEditingAppointment({...editingAppointment, start_time: e.target.value})}
                    className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Special Notes</label>
                <textarea 
                  value={editingAppointment.notes || ''}
                  onChange={e => setEditingAppointment({...editingAppointment, notes: e.target.value})}
                  className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all min-h-[80px] font-medium"
                  placeholder="Any preferences..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setEditingAppointment(null)}
                  className="flex-1 px-6 py-4 rounded-xl border border-[#F0EBE6] text-sm font-medium hover:bg-[#FDFCFB] transition-all"
                >
                  Discard
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-olive text-white px-6 py-4 rounded-xl text-sm font-bold hover:bg-ink shadow-lg shadow-olive/20 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
