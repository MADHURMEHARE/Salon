import { useState, useEffect, FormEvent } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../services/api';
import { Service, User } from '../types';
import { 
  Plus, 
  Scissors, 
  Clock, 
  IndianRupee,
  Percent,
  Loader2,
  Trash2
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import Swal from 'sweetalert2';

export default function Services() {
  const { user } = useOutletContext<{ user: User }>();
  // ... (existing state)
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newService, setNewService] = useState({ 
    name: '', 
    price: '', 
    commission_pct: '30', 
    duration_mins: '45' 
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data } = await api.get('/services');
      setServices(data);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to fetch services', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/services', {
        ...newService,
        price: parseFloat(newService.price),
        commission_pct: parseFloat(newService.commission_pct),
        duration_mins: parseInt(newService.duration_mins)
      });
      setIsAdding(false);
      setNewService({ name: '', price: '', commission_pct: '30', duration_mins: '45' });
      fetchServices();
      Swal.fire({
        icon: 'success',
        title: 'Service Added',
        text: 'New service created successfully',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to create service', 'error');
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    try {
      await api.put(`/services/${editingService.id}`, {
        name: editingService.name,
        price: parseFloat(editingService.price.toString()),
        commission_pct: parseFloat(editingService.commission_pct.toString()),
        duration_mins: parseInt(editingService.duration_mins.toString())
      });
      setEditingService(null);
      fetchServices();
      Swal.fire({
        icon: 'success',
        title: 'Updated',
        text: 'Service updated successfully',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to update service', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This will remove the service from the menu.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1A1A1A',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/services/${id}`);
        fetchServices();
        Swal.fire('Deleted!', 'Service has been removed.', 'success');
      } catch (err) {
        console.error(err);
        Swal.fire('Error!', 'Failed to remove service.', 'error');
      }
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
          <h2 className="text-4xl md:text-5xl font-serif text-ink tracking-tight">Service Menu</h2>
          <p className="text-sm text-olive/60 mt-2 font-medium italic">Define the art and expertise you offer.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full md:w-auto bg-olive text-white px-8 py-4 rounded-full flex items-center justify-center gap-2 hover:bg-ink shadow-lg shadow-olive/10 transition-all active:scale-95 text-xs md:text-sm font-bold tracking-tight"
        >
          <Plus size={18} />
          <span>Add Service</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {services.map((service, i) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-8 rounded-[32px] border border-olive/12 shadow-[0_10px_30px_-10px_rgba(90,90,64,0.08)] group hover:shadow-xl transition-all"
          >
            <div className="flex justify-between items-start mb-8">
              <div 
                onClick={() => user.role !== 'employee' && setEditingService(service)}
                className={cn(
                  "w-14 h-14 rounded-[20px] bg-olive/5 border border-olive/12 flex items-center justify-center text-olive transition-all shadow-sm",
                  user.role !== 'employee' ? "group-hover:bg-olive group-hover:text-white cursor-pointer" : ""
                )}
              >
                <Scissors size={24} />
              </div>
              <div className="flex gap-2">
                {user.role !== 'employee' && (
                  <button 
                    onClick={() => handleDelete(service.id)}
                    className="text-red-300 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>

            <h3 className="text-xl font-bold text-ink mb-6 group-hover:text-olive transition-colors">{service.name}</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-warm-bg/50 border border-olive/5 p-4 rounded-3xl">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-olive/40 mb-1 font-bold">
                  <IndianRupee size={10} />
                  <span>Price</span>
                </div>
                <p className="text-2xl font-serif font-semibold text-ink">₹{service.price}</p>
              </div>
              <div className="bg-warm-bg/50 border border-olive/5 p-4 rounded-3xl">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-olive/40 mb-1 font-bold">
                  <Percent size={10} />
                  <span>Comm.</span>
                </div>
                <p className="text-2xl font-serif font-semibold text-ink">{service.commission_pct}%</p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs text-olive/40 px-1 font-medium italic">
              <Clock size={14} className="text-olive/20" />
              <span>Standard Session: {service.duration_mins} mins</span>
            </div>
          </motion.div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-[2rem] p-10 shadow-2xl"
          >
            <h3 className="text-2xl font-serif mb-6">Create Service</h3>
            <form onSubmit={handleAdd} className="space-y-6">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Service Name</label>
                <input 
                  type="text" 
                  value={newService.name}
                  onChange={e => setNewService({...newService, name: e.target.value})}
                  className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all"
                  placeholder="Royal Beard Trim"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Price (₹)</label>
                  <input 
                    type="number" 
                    value={newService.price}
                    onChange={e => setNewService({...newService, price: e.target.value})}
                    className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all"
                    placeholder="999"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Comm. %</label>
                  <input 
                    type="number" 
                    value={newService.commission_pct}
                    onChange={e => setNewService({...newService, commission_pct: e.target.value})}
                    className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all"
                    placeholder="30"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Duration (Mins)</label>
                <input 
                  type="number" 
                  value={newService.duration_mins}
                  onChange={e => setNewService({...newService, duration_mins: e.target.value})}
                  className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all"
                  placeholder="45"
                  required
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
                  Save Service
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {/* Edit Modal */}
      {editingService && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-[2rem] p-10 shadow-2xl"
          >
            <h3 className="text-2xl font-serif mb-6">Update Service</h3>
            <form onSubmit={handleUpdate} className="space-y-6">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Service Name</label>
                <input 
                  type="text" 
                  value={editingService.name}
                  onChange={e => setEditingService({...editingService, name: e.target.value})}
                  className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all font-bold"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Price (₹)</label>
                  <input 
                    type="number" 
                    value={editingService.price}
                    onChange={e => setEditingService({...editingService, price: parseFloat(e.target.value)})}
                    className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Comm. %</label>
                  <input 
                    type="number" 
                    value={editingService.commission_pct}
                    onChange={e => setEditingService({...editingService, commission_pct: parseFloat(e.target.value)})}
                    className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all font-bold"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Duration (Mins)</label>
                <input 
                  type="number" 
                  value={editingService.duration_mins}
                  onChange={e => setEditingService({...editingService, duration_mins: parseInt(e.target.value)})}
                  className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all font-bold"
                  required
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setEditingService(null)}
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
