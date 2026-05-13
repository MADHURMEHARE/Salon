import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { User } from '../types';
import { motion } from 'motion/react';
import { LogIn, Loader2, ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';

interface LoginProps {
  onLogin: (user: User, token: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('admin@salon.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      onLogin(data.user, data.token);
      Swal.fire({
        icon: 'success',
        title: 'Login Successful',
        text: 'Welcome back to the dashboard.',
        confirmButtonColor: '#6B705C',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: message,
        confirmButtonColor: '#6B705C'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-bg flex items-center justify-center p-6 bg-[url('https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=2669&auto=format&fit=crop')] bg-cover bg-center">
      <div className="absolute inset-0 bg-warm-bg/90 backdrop-blur-sm" />

      {/* Back to Home */}
      <Link
        to="/"
        className="absolute top-6 left-6 z-10 flex items-center gap-2 text-olive/50 hover:text-olive transition-colors text-xs font-bold uppercase tracking-widest group"
      >
        <span className="w-8 h-8 rounded-full border border-olive/20 flex items-center justify-center group-hover:border-olive/50 group-hover:bg-olive/5 transition-all">
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        </span>
        <span className="hidden sm:inline">Back to Home</span>
      </Link>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative"
      >
        <div className="bg-white border border-olive/12 rounded-[40px] p-10 shadow-[0_20px_50px_rgba(90,90,64,0.15)]">
          <div className="text-center mb-10">
            <h1 className="text-5xl font-serif text-olive tracking-tight mb-2 font-semibold italic">Élégance</h1>
            <p className="text-olive/40 text-[10px] uppercase tracking-[0.4em] font-bold">Salon Management</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-olive/60 mb-2 px-1 font-bold">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-warm-bg/50 border border-olive/10 rounded-2xl px-4 py-3.5 text-ink placeholder:text-olive/30 focus:outline-none focus:border-olive/30 transition-all font-medium"
                placeholder="salon@example.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-olive/60 mb-2 px-1 font-bold">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-warm-bg/50 border border-olive/10 rounded-2xl px-4 py-3.5 text-ink placeholder:text-olive/30 focus:outline-none focus:border-olive/30 transition-all font-medium"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-red-500 text-[11px] font-medium px-1 italic">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-olive text-white font-bold text-sm py-4 rounded-2xl shadow-lg shadow-olive/20 hover:shadow-olive/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Enter Studio
                  <LogIn size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-olive/5 text-center">
            <p className="text-olive/20 text-[9px] uppercase tracking-[0.3em] font-bold">Lumière Ecosystem © 2026</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}