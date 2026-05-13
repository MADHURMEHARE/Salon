import { useState, useEffect, FormEvent } from 'react';
import api from '../services/api';
import { Customer } from '../types';
import { 
  Search, 
  Plus, 
  UserPlus, 
  Phone, 
  Mail, 
  Calendar,
  Trash2,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import Swal from 'sweetalert2';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data } = await api.get('/customers');
      setCustomers(data);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to fetch customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/customers', newCustomer);
      setIsAdding(false);
      setNewCustomer({ name: '', phone: '', email: '' });
      fetchCustomers();
      Swal.fire({
        icon: 'success',
        title: 'Registered',
        text: 'Client added successfully',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to register client. Phone number might already exist.', 'error');
    }
  };

  const handleUpdateCustomer = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    try {
      await api.put(`/customers/${editingCustomer.id}`, editingCustomer);
      setEditingCustomer(null);
      fetchCustomers();
      Swal.fire({
        icon: 'success',
        title: 'Updated',
        text: 'Client profile updated',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to update client profile', 'error');
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This will permanently delete the customer record.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1A1A1A',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/customers/${id}`);
        fetchCustomers();
        Swal.fire('Deleted!', 'Customer record has been deleted.', 'success');
      } catch (err) {
        console.error(err);
        Swal.fire('Error!', 'Failed to delete customer record.', 'error');
      }
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl md:text-5xl font-serif text-ink tracking-tight">Clients</h2>
          <p className="text-sm text-olive/60 mt-2 font-medium italic">Manage your relationship with your customers.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full md:w-auto bg-olive text-white px-8 py-4 rounded-full flex items-center justify-center gap-2 hover:bg-ink shadow-lg shadow-olive/10 transition-all active:scale-95 text-xs md:text-sm font-bold tracking-tight"
        >
          <UserPlus size={18} />
          <span>New Client</span>
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-[20px] border border-olive/12 shadow-sm focus-within:border-olive/30 transition-all">
        <Search size={20} className="text-olive/40" />
        <input 
          type="text" 
          placeholder="Search by name, phone or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder:text-olive/20 font-medium"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-24">
          <Loader2 className="animate-spin text-olive/20" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredCustomers.map((customer, i) => (
            <motion.div
              key={customer.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white p-8 rounded-[32px] border border-olive/12 shadow-[0_10px_30px_-10px_rgba(90,90,64,0.08)] group hover:shadow-xl transition-all flex flex-col"
            >
              <div className="flex justify-between items-start mb-6">
                <div 
                  onClick={() => setEditingCustomer(customer)}
                  className="w-14 h-14 rounded-[20px] bg-olive/5 border border-olive/12 flex items-center justify-center text-olive text-2xl font-serif font-bold group-hover:bg-olive group-hover:text-white transition-all shadow-sm cursor-pointer"
                >
                  {customer.name.charAt(0)}
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleDeleteCustomer(customer.id)}
                    className="p-2 text-red-300 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold text-ink mb-6 group-hover:text-olive transition-colors">{customer.name}</h3>

              <div className="space-y-4 mb-8 flex-1">
                <div className="flex items-center gap-3 text-xs text-olive/60 font-medium">
                  <Phone size={14} className="text-olive/30" />
                  <span>{customer.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-olive/60 font-medium">
                  <Mail size={14} className="text-olive/30" />
                  <span className="truncate">{customer.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-olive/60 font-medium">
                  <Calendar size={14} className="text-olive/30" />
                  <div>
                    <span className="block">Last Visit: {customer.last_visit ? format(new Date(customer.last_visit), 'MMM d, yyyy') : 'New Guest'}</span>
                    {customer.last_service && (
                      <span className="text-[10px] text-olive/40 italic font-bold">
                        Ended with {customer.last_service} {customer.last_bill_amount ? `(₹${customer.last_bill_amount})` : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-olive/5 flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-widest text-olive/30 font-bold">Registered {format(new Date(customer.created_at!), 'yyyy')}</span>
                <button className="text-xs font-bold text-olive/60 hover:text-olive uppercase tracking-widest bg-olive/5 px-4 py-2 rounded-full transition-all">
                  Book Session
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-[2rem] p-10 shadow-2xl"
          >
            <h3 className="text-2xl font-serif mb-6">Registration</h3>
            <form onSubmit={handleAddCustomer} className="space-y-6">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Full Name</label>
                <input 
                  type="text" 
                  value={newCustomer.name}
                  onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                  className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={newCustomer.phone}
                  onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                  className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all"
                  placeholder="+91 00000 00000"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Email Address</label>
                <input 
                  type="email" 
                  value={newCustomer.email}
                  onChange={e => setNewCustomer({...newCustomer, email: e.target.value})}
                  className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all"
                  placeholder="john@example.com"
                />
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
                  Register Client
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {/* Edit Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-[2rem] p-10 shadow-2xl"
          >
            <h3 className="text-2xl font-serif mb-6">Update Profile</h3>
            <form onSubmit={handleUpdateCustomer} className="space-y-6">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Full Name</label>
                <input 
                  type="text" 
                  value={editingCustomer.name}
                  onChange={e => setEditingCustomer({...editingCustomer, name: e.target.value})}
                  className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all font-bold"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={editingCustomer.phone || ''}
                  onChange={e => setEditingCustomer({...editingCustomer, phone: e.target.value})}
                  className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Email Address</label>
                <input 
                  type="email" 
                  value={editingCustomer.email || ''}
                  onChange={e => setEditingCustomer({...editingCustomer, email: e.target.value})}
                  className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all font-bold"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setEditingCustomer(null)}
                  className="flex-1 px-6 py-3 rounded-xl border border-[#F0EBE6] text-sm font-medium hover:bg-[#FDFCFB] transition-all"
                >
                  Discard
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-olive text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-ink shadow-lg shadow-olive/20 transition-all"
                >
                  Update
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
