import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Service, User } from '../types';
import { X, Loader2, User as UserIcon, Phone, Scissors, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';
import Swal from 'sweetalert2';

interface QuickBillModalProps {
  currentUser: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function QuickBillModal({ currentUser, onClose, onSuccess }: QuickBillModalProps) {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    employeeId: currentUser?.id?.toString() || '',
  });

  const [showReceipt, setShowReceipt] = useState(false);
  
  const totalAmount = selectedServices.reduce((sum, s) => sum + s.price, 0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, employeesRes] = await Promise.all([
          api.get('/services'),
          api.get('/employees')
        ]);
        setServices(servicesRes.data);
        setEmployees(employeesRes.data);
      } catch (err) {
        console.error('Failed to fetch data', err);
        Swal.fire('Error', 'Failed to fetch catalog data', 'error');
      }
    };
    fetchData();
  }, []);

  const addService = (serviceId: string) => {
    const service = services.find(s => s.id.toString() === serviceId);
    if (service) {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const removeService = (index: number) => {
    setSelectedServices(selectedServices.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServices.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Empty Cart',
        text: 'Please add at least one service to the cart.'
      });
      return;
    }

    const confirmResult = await Swal.fire({
      title: 'Finalize Transaction?',
      text: `Process ₹${totalAmount.toLocaleString()} for ${formData.customerName}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#6B705C',
      confirmButtonText: 'Yes, checkout'
    });

    if (!confirmResult.isConfirmed) return;

    setLoading(true);
    try {
      const customerResult = await api.post('/customers', {
        name: formData.customerName,
        phone: formData.customerPhone,
      });
      const customerId = customerResult.data.id;

      await api.post('/billing/checkout', {
        customer_id: customerId,
        service_ids: selectedServices.map(s => s.id),
        employee_id: formData.employeeId,
      });

      setShowReceipt(true);
    } catch (err) {
      console.error('Failed to process quick bill', err);
      Swal.fire({
        icon: 'error',
        title: 'Checkout Failed',
        text: 'Could not process billing. Check if all fields are valid.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (showReceipt) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-ink/60 backdrop-blur-md" 
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative bg-white w-full max-w-sm rounded-[40px] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          <div className="h-2 bg-emerald-500 w-full" />
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
              <UserCheck size={32} />
            </div>
            
            <h2 className="text-2xl font-serif text-ink mb-1">Payment Success</h2>
            <p className="text-olive/60 font-medium italic text-xs mb-6">Bill generated & artist credited</p>
            
            <div className="bg-warm-bg/50 rounded-2xl p-5 mb-6 text-left border border-olive/5 relative overflow-hidden">
               <div className="absolute -right-2 -top-2 opacity-[0.06] rotate-[15deg] pointer-events-none">
                <span className="text-6xl font-black border-4 border-emerald-600 text-emerald-600 px-3 rounded-2xl">PAID</span>
              </div>

              <div className="flex justify-between items-center border-b border-olive/5 pb-3 mb-3">
                <span className="text-[10px] uppercase tracking-widest text-olive/40 font-bold">Client</span>
                <span className="text-sm font-bold text-ink">{formData.customerName}</span>
              </div>

              <div className="space-y-2 mb-4">
                {selectedServices.map((s, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-olive/60">{s.name}</span>
                    <span className="font-bold text-ink">₹{s.price}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-olive/10">
                <span className="text-sm font-serif text-olive">Total Paid</span>
                <div className="text-right">
                  <span className="text-xl font-bold text-ink">₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => {
                onSuccess();
              }}
              className="w-full bg-olive text-white py-4 rounded-xl font-bold text-sm hover:bg-ink transition-all active:scale-95 shadow-lg shadow-olive/10"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm" 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border border-olive/12"
      >
        <div className="p-8 pb-4 flex justify-between items-center text-ink">
          <div>
            <h2 className="serif text-3xl text-olive">Quick Checkout</h2>
            <p className="text-xs text-olive/60 font-medium italic mt-1">Multi-service billing & commission</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-olive/5 rounded-full transition-colors text-olive/40 hover:text-olive">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 pt-2">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-olive/60 font-bold mb-2 px-1">
                  <UserIcon size={12} />
                  Customer
                </label>
                <input
                  required
                  type="text"
                  value={formData.customerName}
                  onChange={e => setFormData({...formData, customerName: e.target.value})}
                  className="w-full bg-warm-bg/50 border border-olive/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-olive/30 transition-all font-medium text-ink"
                  placeholder="Name"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-olive/60 font-bold mb-2 px-1">
                  <Phone size={12} />
                  Phone
                </label>
                <input
                  required
                  type="tel"
                  value={formData.customerPhone}
                  onChange={e => setFormData({...formData, customerPhone: e.target.value})}
                  className="w-full bg-warm-bg/50 border border-olive/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-olive/30 transition-all font-medium text-ink"
                  placeholder="Number"
                />
              </div>
            </div>

            <div className="bg-olive/5 p-6 rounded-3xl border border-olive/10">
              <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-olive/60 font-bold mb-3 px-1">
                <Scissors size={12} />
                Service Cart
              </label>
              
              <div className="space-y-2 mb-4 max-h-[150px] overflow-y-auto">
                {selectedServices.map((s, index) => (
                  <div key={`${s.id}-${index}`} className="flex justify-between items-center bg-white p-3 rounded-xl border border-olive/5 shadow-sm">
                    <span className="text-sm font-bold text-ink">{s.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-olive">₹{s.price}</span>
                      <button 
                        type="button" 
                        onClick={() => removeService(index)}
                        className="p-1 hover:bg-terracotta/10 text-terracotta rounded-lg transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {selectedServices.length === 0 && (
                  <p className="text-xs text-olive/40 italic py-2">No services selected yet</p>
                )}
              </div>

              <select
                onChange={e => {
                  if (e.target.value) {
                    addService(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full bg-white border border-olive/10 rounded-xl px-4 py-3 focus:outline-none focus:border-olive/30 transition-all font-medium text-ink text-sm appearance-none cursor-pointer"
              >
                <option value="">+ Add Service to Cart</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name} (₹{s.price})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-olive/60 font-bold mb-2 px-1">
                <UserCheck size={12} />
                Stylist Responsible
              </label>
              <select
                required
                value={formData.employeeId}
                onChange={e => setFormData({...formData, employeeId: e.target.value})}
                className="w-full bg-warm-bg/50 border border-olive/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-olive/30 transition-all font-medium text-ink appearance-none cursor-pointer"
              >
                <option value="">Select Stylist</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex justify-between items-center mb-6 px-2">
              <span className="serif text-xl text-olive">Final Amount</span>
              <span className="text-3xl font-bold text-ink">₹{totalAmount.toLocaleString()}</span>
            </div>

            <button
              type="submit"
              disabled={loading || selectedServices.length === 0}
              className="w-full bg-olive text-white font-bold text-sm py-5 rounded-2xl shadow-xl shadow-olive/20 hover:shadow-olive/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Checkout {selectedServices.length > 0 && `(${selectedServices.length} ${selectedServices.length === 1 ? 'Service' : 'Services'})`}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
