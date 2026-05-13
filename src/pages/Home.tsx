import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Scissors, 
  Clock, 
  User as UserIcon, 
  Calendar, 
  ChevronRight, 
  Phone, 
  Mail, 
  ArrowRight,
  Sparkles,
  MapPin,
  Globe,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';
import Swal from 'sweetalert2';
import Navbar from '../components/Navbar';

interface Service {
  id: number;
  name: string;
  price: number;
  duration_mins: number;
}

interface Employee {
  id: number;
  name: string;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string | null;
}

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [authData, setAuthData] = useState({ name: '', phone: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availability, setAvailability] = useState<{start: string, end: string}[]>([]);
  const [bookingData, setBookingData] = useState({
    name: '',
    phone: '',
    email: '',
    service_id: '',
    employee_id: '',
    start_time: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/public/services').then(res => res.json()).then(setServices);
    fetch('/api/public/employees').then(res => res.json()).then(setEmployees);
    fetch('/api/public/inventory').then(res => res.json()).then(setInventory);
    
    const token = localStorage.getItem('customer_token');
    if (token) {
      fetch('/api/public/customer/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => {
        if (res.ok) return res.json();
        throw new Error();
      }).then(setCurrentCustomer)
      .catch(() => localStorage.removeItem('customer_token'));
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = isLogin ? '/api/public/customer/login' : '/api/public/customer/register';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('customer_token', data.token);
        setCurrentCustomer(data.customer);
        setShowAuth(false);
        setBookingData(prev => ({
          ...prev,
          name: data.customer.name,
          phone: data.customer.phone,
          email: data.customer.email || ''
        }));
        Swal.fire({
          icon: 'success',
          title: isLogin ? 'Welcome Back!' : 'Account Created!',
          text: isLogin ? 'You are now logged in.' : 'Your account has been successfully created.',
          confirmButtonColor: '#5A5A40'
        });
      } else {
        setAuthError(data.message);
        Swal.fire({
          icon: 'error',
          title: 'Authentication Failed',
          text: data.message,
          confirmButtonColor: '#5A5A40'
        });
      }
    } catch (err) {
      setAuthError('An error occurred');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An unexpected error occurred.',
        confirmButtonColor: '#5A5A40'
      });
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out of your account.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#5A5A40',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('customer_token');
        setCurrentCustomer(null);
        setBookingData(prev => ({ ...prev, name: '', phone: '', email: '' }));
        Swal.fire({
          icon: 'success',
          title: 'Logged Out',
          text: 'You have been successfully logged out.',
          confirmButtonColor: '#5A5A40'
        });
      }
    });
  };

  useEffect(() => {
    if (bookingData.employee_id && selectedDate) {
      fetch(`/api/public/availability?date=${selectedDate}&employee_id=${bookingData.employee_id}`)
        .then(res => res.json())
        .then(setAvailability);
    }
  }, [bookingData.employee_id, selectedDate]);

  const generateTimeSlots = () => {
    const slots = [];
    const start = 9; // 9 AM
    const end = 18; // 6 PM
    
    for (let hour = start; hour < end; hour++) {
      for (let min of [0, 30]) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        const fullDate = `${selectedDate}T${timeStr}:00`;
        
        // Check if busy
        const isBusy = availability.some(busy => {
          const busyStart = new Date(busy.start).getTime();
          const busyEnd = new Date(busy.end).getTime();
          const slotTime = new Date(fullDate).getTime();
          return slotTime >= busyStart && slotTime < busyEnd;
        });

        if (!isBusy) {
          slots.push({
            time: timeStr,
            full: fullDate
          });
        }
      }
    }
    return slots;
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side phone validation
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!currentCustomer && !phoneRegex.test(bookingData.phone.replace(/\s/g, ''))) {
      setError('Please enter a valid phone number (at least 10 digits)');
      Swal.fire({
        icon: 'error',
        title: 'Invalid Phone Number',
        text: 'Please enter a valid phone number (10-15 digits).',
        confirmButtonColor: '#5A5A40'
      });
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      const res = await fetch('/api/public/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bookingData,
          customer_id: currentCustomer?.id
        })
      });
      const data = await res.json();
      if (res.ok) {
        setIsSuccess(true);
        Swal.fire({
          icon: 'success',
          title: 'Booking Confirmed!',
          text: 'We look forward to seeing you at Sai Krupa Salon.',
          confirmButtonColor: '#5A5A40'
        });
        setTimeout(() => {
          setBookingStep(1);
          setIsSuccess(false);
          setBookingData({
            name: currentCustomer?.name || '',
            phone: currentCustomer?.phone || '',
            email: currentCustomer?.email || '',
            service_id: '',
            employee_id: '',
            start_time: '',
            notes: ''
          });
        }, 5000);
      } else {
        if (data.message.includes('registered account')) {
          setError(data.message);
          Swal.fire({
            icon: 'info',
            title: 'Account Found',
            text: data.message,
            confirmButtonColor: '#5A5A40'
          });
          // Suggest login
          setTimeout(() => {
            setShowAuth(true);
            setIsLogin(true);
            setAuthData(prev => ({ ...prev, phone: bookingData.phone }));
          }, 2000);
        } else {
          setError(data.message || 'Something went wrong');
          Swal.fire({
            icon: 'error',
            title: 'Booking Failed',
            text: data.message || 'Something went wrong. Please try again.',
            confirmButtonColor: '#5A5A40'
          });
        }
      }
    } catch (err) {
      setError('Failed to connect to server');
      Swal.fire({
        icon: 'error',
        title: 'Connection Error',
        text: 'Failed to connect to the server. Please check your internet connection.',
        confirmButtonColor: '#5A5A40'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBuy = async (item: any) => {
    if (!currentCustomer) {
      const { value: formValues } = await Swal.fire({
        title: 'Complete your purchase',
        html:
          '<input id="swal-input1" class="swal2-input" placeholder="Name">' +
          '<input id="swal-input2" class="swal2-input" placeholder="Phone Number">',
        focusConfirm: false,
        confirmButtonColor: '#5A5A40',
        preConfirm: () => {
          const name = (document.getElementById('swal-input1') as HTMLInputElement).value;
          const phone = (document.getElementById('swal-input2') as HTMLInputElement).value;
          if (!name || !phone) {
            Swal.showValidationMessage('Please enter name and phone');
          }
          return { name, phone };
        }
      });

      if (!formValues) return;

      try {
        const res = await fetch('/api/public/inventory/buy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_id: item.id,
            quantity: 1,
            name: formValues.name,
            phone: formValues.phone
          })
        });
        const data = await res.json();
        if (res.ok) {
          Swal.fire('Success!', 'Your purchase is complete.', 'success');
          // Refresh inventory
          fetch('/api/public/inventory').then(res => res.json()).then(setInventory);
        } else {
          Swal.fire('Failed', data.message, 'error');
        }
      } catch (err) {
        Swal.fire('Error', 'Something went wrong', 'error');
      }
    } else {
      // Logged in user
      const result = await Swal.fire({
        title: `Buy ${item.name}?`,
        text: `Price: ₹${item.price}`,
        showCancelButton: true,
        confirmButtonColor: '#5A5A40',
        confirmButtonText: 'Buy Now'
      });

      if (result.isConfirmed) {
        try {
          const res = await fetch('/api/public/inventory/buy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              item_id: item.id,
              quantity: 1,
              customer_id: currentCustomer.id
            })
          });
          const data = await res.json();
          if (res.ok) {
            Swal.fire('Success!', 'Thank you for your purchase.', 'success');
            fetch('/api/public/inventory').then(res => res.json()).then(setInventory);
          } else {
            Swal.fire('Failed', data.message, 'error');
          }
        } catch (err) {
          Swal.fire('Error', 'Something went wrong', 'error');
        }
      }
    }
  };

  const selectedService = services.find(s => s.id.toString() === bookingData.service_id);
  const selectedStylist = employees.find(e => e.id.toString() === bookingData.employee_id);
  const timeSlots = generateTimeSlots();

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-ink font-sans selection:bg-olive/10">
      {/* Navigation */}
     <Navbar/>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center overflow-hidden pt-20">
        <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-olive/5 border border-olive/12 mb-8">
              <Sparkles size={14} className="text-olive" />
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-olive">The Art of the Cut</span>
            </div>
            
            <h1 className="serif text-7xl md:text-[112px] leading-[0.88] tracking-tighter mb-8 text-ink">
              Refined <br />
              <span className="italic text-olive/60 font-medium">Style.</span>
            </h1>
            
            <p className="text-lg text-olive/60 max-w-md leading-relaxed mb-10 font-medium italic">
              Experience the master touch of Sai Krupa Salon. Crafting distinctive looks for every personality.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="#book"
                className="group relative px-10 py-5 bg-olive text-white rounded-full font-bold tracking-tight shadow-xl shadow-olive/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                Book Your Experience
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <a 
                href="#services"
                className="px-10 py-5 border border-olive/12 text-olive rounded-full font-bold tracking-tight hover:bg-olive/5 transition-all text-center"
              >
                View Menu
              </a>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block relative"
          >
            <div className="aspect-[4/5] rounded-[48px] overflow-hidden shadow-2xl relative z-10">
              <img 
                src="https://images.unsplash.com/photo-1560869713-7d0a29430803?q=80&w=1926&auto=format&fit=crop" 
                alt="Salon Interior" 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000 scale-105 hover:scale-100"
              />
              <div className="absolute inset-0 bg-ink/10 mix-blend-overlay"></div>
            </div>
            
            {/* Decal Elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 border border-olive/12 rounded-full flex items-center justify-center backdrop-blur-sm z-20 animate-spin-slow">
              <div className="text-[10px] font-bold uppercase tracking-widest text-olive text-center">
                EST <br /> 2024
              </div>
            </div>
            
            <div className="absolute -bottom-10 -left-10 bg-white p-8 rounded-[32px] shadow-xl border border-olive/5 z-20 max-w-[240px]">
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map(i => <Sparkles key={i} size={12} className="text-olive" />)}
              </div>
              <p className="text-sm font-medium italic text-olive/80">
                "The most attentive studio experience I've had in a decade."
              </p>
              <div className="mt-4 flex items-center gap-2">
                <div className="w-6 h-px bg-olive/20"></div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-olive/40">Sarah J.</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-32 bg-olive/5" id="services">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="serif text-5xl text-ink mb-6 italic font-medium">The Menu</h2>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-olive/40">Excellence in every strand</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, i) => (
              <motion.div 
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-10 rounded-[40px] border border-olive/12 hover:border-olive/30 shadow-sm transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-olive/5 flex items-center justify-center text-olive mb-6 group-hover:bg-olive group-hover:text-white transition-all">
                  <Scissors size={20} />
                </div>
                <h3 className="text-2xl font-semibold text-ink mb-2">{service.name}</h3>
                <p className="text-sm text-olive/60 mb-8 font-medium italic">{service.duration_mins} Minutes</p>
                <div className="flex items-center justify-between pt-6 border-t border-olive/5">
                  <span className="text-2xl serif font-semibold">${service.price}</span>
                  <a href="#book" onClick={() => {
                    setBookingData({...bookingData, service_id: service.id.toString()});
                    setBookingStep(2);
                  }} className="text-xs font-bold uppercase tracking-widest text-olive hover:translate-x-1 transition-transform flex items-center gap-2">
                    Book <ArrowRight size={14} />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section className="py-40 bg-[#FDFCF9]" id="book">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-[48px] border border-olive/12 shadow-[0_40px_100px_-20px_rgba(90,90,64,0.08)] overflow-hidden relative">
            
            {/* Success Overlay */}
            <AnimatePresence>
              {isSuccess && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center p-10 text-center"
                >
                  <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-8">
                    <CheckCircle2 size={48} />
                  </div>
                  <h3 className="serif text-4xl text-ink mb-4 italic">Experience Booked</h3>
                  <p className="text-olive/60 max-w-sm font-medium leading-relaxed">
                    We've received your request. A confirmation will be sent via SMS shortly. We look forward to seeing you.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-3">
              {/* Left Sidebar */}
              <div className="bg-olive p-12 text-white">
                <h3 className="serif text-3xl mb-8">Schedule <br />Your Visit</h3>
                
                <div className="space-y-8">
                  {[
                    { step: 1, label: 'Selection', active: bookingStep === 1 },
                    { step: 2, label: 'Stylist', active: bookingStep === 2 },
                    { step: 3, label: 'Time', active: bookingStep === 3 },
                    { step: 4, label: 'Details', active: bookingStep === 4 },
                  ].map((s) => (
                    <div key={s.step} className="flex items-center gap-4 group cursor-pointer" onClick={() => bookingStep > s.step && setBookingStep(s.step)}>
                      <div className={cn(
                        "w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-bold transition-all",
                        s.active ? "bg-white text-olive border-white" : "text-white/40 group-hover:border-white/40"
                      )}>
                        0{s.step}
                      </div>
                      <span className={cn(
                        "text-[10px] uppercase font-bold tracking-widest transition-all",
                        s.active ? "text-white" : "text-white/40 group-hover:text-white/60"
                      )}>{s.label}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-20 pt-10 border-t border-white/10">
                  <div className="flex items-center gap-3 text-xs text-white/60 mb-4">
                    <MapPin size={14} />
                    <span>123 Artistry Lane, Central</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/60">
                    <Globe size={14} />
                    <span>@studio.noir</span>
                  </div>
                </div>
              </div>

              {/* Form Area */}
              <div className="md:col-span-2 p-12 relative">
                {/* Auth Toolbar */}
                <div className="flex justify-end mb-6">
                  {currentCustomer ? (
                    <div className="flex items-center gap-4 bg-olive/5 px-4 py-2 rounded-full border border-olive/10">
                      <span className="text-xs font-bold text-olive">Hi, {currentCustomer.name}</span>
                      <button 
                        onClick={handleLogout}
                        className="text-[10px] uppercase font-bold tracking-widest text-ink/40 hover:text-ink transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowAuth(true)}
                      className="text-xs font-bold uppercase tracking-widest text-olive hover:underline"
                    >
                      Login for faster booking
                    </button>
                  )}
                </div>

                {/* Auth Modal Overlay */}
                <AnimatePresence>
                  {showAuth && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-x-0 top-0 bottom-0 bg-white z-40 p-12 overflow-y-auto"
                    >
                      <button 
                        onClick={() => setShowAuth(false)}
                        className="absolute top-8 right-8 text-ink/40 hover:text-ink transition-colors"
                      >
                        <Globe size={24} className="rotate-45" /> {/* Close icon substitute */}
                      </button>
                      
                      <h4 className="serif text-3xl mb-2 text-ink">{isLogin ? 'Welcome Back' : 'Create Account'}</h4>
                      <p className="text-sm text-olive/60 mb-8 font-medium italic">
                        {isLogin ? 'Login to manage your bookings and book faster.' : 'Create an account to track your salon visits.'}
                      </p>

                      <form onSubmit={handleAuth} className="space-y-4">
                        {!isLogin && (
                          <input 
                            placeholder="Full Name"
                            required
                            value={authData.name}
                            onChange={(e) => setAuthData({...authData, name: e.target.value})}
                            className="w-full px-6 py-4 rounded-2xl border border-olive/12 outline-none focus:border-olive font-sans text-sm"
                          />
                        )}
                        <input 
                          placeholder="Phone Number"
                          type="tel"
                          required
                          value={authData.phone}
                          onChange={(e) => setAuthData({...authData, phone: e.target.value})}
                          className="w-full px-6 py-4 rounded-2xl border border-olive/12 outline-none focus:border-olive font-sans text-sm"
                        />
                        {!isLogin && (
                          <input 
                            placeholder="Email (Optional)"
                            type="email"
                            value={authData.email}
                            onChange={(e) => setAuthData({...authData, email: e.target.value})}
                            className="w-full px-6 py-4 rounded-2xl border border-olive/12 outline-none focus:border-olive font-sans text-sm"
                          />
                        )}
                        <input 
                          placeholder="Password"
                          type="password"
                          required
                          value={authData.password}
                          onChange={(e) => setAuthData({...authData, password: e.target.value})}
                          className="w-full px-6 py-4 rounded-2xl border border-olive/12 outline-none focus:border-olive font-sans text-sm"
                        />

                        {authError && <p className="text-xs font-bold text-red-500 italic">{authError}</p>}

                        <button 
                          type="submit"
                          className="w-full py-5 bg-olive text-white rounded-full font-bold tracking-tight shadow-xl shadow-olive/20"
                        >
                          {isLogin ? 'Login' : 'Register'}
                        </button>

                        <button 
                          type="button" 
                          onClick={() => { setIsLogin(!isLogin); setAuthError(''); }}
                          className="w-full text-xs font-bold uppercase tracking-widest text-olive/40 hover:text-olive transition-colors mt-4"
                        >
                          {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleBooking}>
                  {/* Step 1: Service */}
                  {bookingStep === 1 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                      <h4 className="text-xl font-semibold mb-8 text-ink">Choose your service</h4>
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                        {services.map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setBookingData({...bookingData, service_id: s.id.toString()});
                              setBookingStep(2);
                            }}
                            className={cn(
                              "w-full p-6 rounded-3xl border border-olive/12 flex items-center justify-between hover:bg-olive/5 transition-all text-left",
                              bookingData.service_id === s.id.toString() && "bg-olive/5 border-olive"
                            )}
                          >
                            <span className="font-semibold">{s.name}</span>
                            <span className="text-sm serif font-bold text-olive">${s.price}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Stylist */}
                  {bookingStep === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                      <h4 className="text-xl font-semibold mb-8 text-ink">Your Stylist</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {employees.map(e => (
                          <button
                            key={e.id}
                            type="button"
                            onClick={() => {
                              setBookingData({...bookingData, employee_id: e.id.toString()});
                              setBookingStep(3);
                            }}
                            className={cn(
                              "p-6 rounded-3xl border border-olive/12 flex flex-col items-center gap-4 hover:bg-olive/5 transition-all",
                              bookingData.employee_id === e.id.toString() && "bg-olive/5 border-olive"
                            )}
                          >
                            <div className="w-16 h-16 rounded-full bg-olive/10 flex items-center justify-center text-olive">
                              <UserIcon size={24} />
                            </div>
                            <span className="font-bold text-sm tracking-tight">{e.name}</span>
                          </button>
                        ))}
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setBookingStep(1)}
                        className="mt-8 text-xs font-bold uppercase tracking-widest text-olive/40 hover:text-olive transition-colors"
                      >
                        ← Back to services
                      </button>
                    </motion.div>
                  )}

                  {/* Step 3: Date & Time */}
                  {bookingStep === 3 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                      <h4 className="text-xl font-semibold mb-6 text-ink">Select a date</h4>
                      <input 
                        type="date" 
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full p-4 bg-warm-bg rounded-2xl border border-olive/12 focus:border-olive outline-none font-sans mb-8"
                      />

                      <h4 className="text-xl font-semibold mb-6 text-ink">Available Slots</h4>
                      {timeSlots.length > 0 ? (
                        <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                          {timeSlots.map(slot => (
                            <button
                              key={slot.full}
                              type="button"
                              onClick={() => {
                                setBookingData({...bookingData, start_time: slot.full});
                                setBookingStep(4);
                              }}
                              className={cn(
                                "py-3 rounded-xl border border-olive/12 text-sm font-bold hover:bg-olive hover:text-white transition-all",
                                bookingData.start_time === slot.full && "bg-olive text-white border-olive"
                              )}
                            >
                              {slot.time}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-olive/5 rounded-3xl border border-dashed border-olive/20">
                          <p className="text-xs font-bold text-olive/40 uppercase tracking-widest">No availability on this date</p>
                        </div>
                      )}
                      
                      <button 
                        type="button" 
                        onClick={() => setBookingStep(2)}
                        className="mt-10 w-full text-xs font-bold uppercase tracking-widest text-olive/40 hover:text-olive transition-colors"
                      >
                        ← Back to stylists
                      </button>
                    </motion.div>
                  )}

                  {/* Step 4: Final Info */}
                  {bookingStep === 4 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                      <h4 className="text-xl font-semibold mb-8 text-ink">Personal Details</h4>
                      <div className="space-y-4">
                        <input 
                          placeholder="Your Name"
                          required
                          value={bookingData.name}
                          onChange={(e) => setBookingData({...bookingData, name: e.target.value})}
                          disabled={!!currentCustomer}
                          className="w-full px-6 py-4 rounded-2xl border border-olive/12 outline-none focus:border-olive font-sans text-sm disabled:opacity-50"
                        />
                        <input 
                          placeholder="Phone Number"
                          type="tel"
                          required
                          value={bookingData.phone}
                          onChange={(e) => setBookingData({...bookingData, phone: e.target.value})}
                          disabled={!!currentCustomer}
                          className="w-full px-6 py-4 rounded-2xl border border-olive/12 outline-none focus:border-olive font-sans text-sm disabled:opacity-50"
                        />
                        <input 
                          placeholder="Email Address (Optional)"
                          type="email"
                          value={bookingData.email}
                          onChange={(e) => setBookingData({...bookingData, email: e.target.value})}
                          disabled={!!currentCustomer}
                          className="w-full px-6 py-4 rounded-2xl border border-olive/12 outline-none focus:border-olive font-sans text-sm disabled:opacity-50"
                        />
                        <textarea 
                          placeholder="Any special notes?"
                          value={bookingData.notes}
                          onChange={(e) => setBookingData({...bookingData, notes: e.target.value})}
                          rows={3}
                          className="w-full px-6 py-4 rounded-2xl border border-olive/12 outline-none focus:border-olive font-sans text-sm resize-none"
                        />
                      </div>

                      {error && <p className="text-xs font-bold text-red-500 italic mt-4">{error}</p>}
                      
                      <div className="p-6 bg-olive/5 rounded-3xl mt-8 border border-olive/10">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-olive/60 mb-4 italic">Confirmation</p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm font-medium">
                            <span className="text-ink/60">Service</span>
                            <span>{selectedService?.name}</span>
                          </div>
                          <div className="flex justify-between text-sm font-medium">
                            <span className="text-ink/60">Stylist</span>
                            <span>{selectedStylist?.name}</span>
                          </div>
                          <div className="flex justify-between text-sm font-medium">
                            <span className="text-ink/60">Date & Time</span>
                            <span>{bookingData.start_time ? new Date(bookingData.start_time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not selected'}</span>
                          </div>
                        </div>
                      </div>

                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full mt-8 py-5 bg-olive text-white rounded-full font-bold tracking-tight shadow-xl shadow-olive/20 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? 'Processing...' : 'Confirm Appointment'}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setBookingStep(3)}
                        className="mt-6 w-full text-xs font-bold uppercase tracking-widest text-olive/40 hover:text-olive transition-colors"
                      >
                        ← Back to time
                      </button>
                    </motion.div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shop Section */}
      <section className="py-32 bg-white" id="shop">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
            <div className="max-w-2xl">
              <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-olive mb-4 block">Store</span>
              <h2 className="serif text-5xl md:text-6xl text-ink leading-[1.1] mb-6">
                Premium Grooming Essentials
              </h2>
              <p className="text-olive/60 font-medium italic">
                Take the salon experience home with our curated collection of professional products.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {inventory.map((item) => (
              <motion.div 
                key={item.id}
                whileHover={{ y: -10 }}
                className="group bg-neutral-50 rounded-[40px] overflow-hidden border border-neutral-100"
              >
                <div className="aspect-[4/5] relative overflow-hidden">
                  <img 
                    src={item.image_url || "https://images.unsplash.com/photo-1590159763121-7c9ff6189605?auto=format&fit=crop&w=400&q=80"} 
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-ink/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <button 
                       onClick={() => handleBuy(item)}
                       className="bg-white text-ink px-8 py-4 rounded-full font-bold text-sm shadow-xl"
                     >
                       Buy Now
                     </button>
                  </div>
                  {item.stock < 10 && (
                    <div className="absolute top-6 left-6 bg-red-500 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full">
                      Low Stock
                    </div>
                  )}
                </div>
                <div className="p-8">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-ink text-lg">{item.name}</h3>
                    <span className="text-olive font-bold">₹{item.price}</span>
                  </div>
                  <p className="text-xs text-olive/60 font-medium uppercase tracking-widest">{item.unit}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink text-white/40 py-32 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-4 gap-16">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 text-white mb-8">
              <div className="w-10 h-10 bg-olive rounded-full flex items-center justify-center">
                <Scissors className="text-white" size={20} />
              </div>
              <span className="serif text-2xl font-bold tracking-tight">Sai Krupa Salon</span>
            </div>
            <p className="max-w-md leading-relaxed text-sm italic">
              Your neighborhood's favorite premium salon. Professional grooming and styling since 2024.
            </p>
          </div>
          
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-white mb-6">Contact</h5>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Phone size={14} className="text-olive" />
                <span>+1 (555) 012-3456</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail size={14} className="text-olive" />
                <span>concierge@studionoir.com</span>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-white mb-6">Social</h5>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 cursor-pointer">
                <Globe size={18} />
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 mt-32 pt-8 border-t border-white/5 text-[10px] uppercase font-bold tracking-[0.2em] flex justify-between">
          <span>&copy; 2024 Sai Krupa Salon</span>
          <Link to="/login" className="hover:text-white transition-colors">Staff Access</Link>
        </div>
      </footer>
    </div>
  );
}
