import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Scissors, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { label: 'Services', href: '#services' },
    { label: 'Shop', href: '#shop' },
    { label: 'Book Now', href: '#book' },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#FDFCF9]/80 backdrop-blur-md border-b border-olive/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-olive rounded-full flex items-center justify-center shrink-0">
            <Scissors className="text-white" size={20} />
          </div>
          <span className="serif text-xl font-semibold tracking-tight">Sai Krupa Salon</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-bold uppercase tracking-widest text-olive/60 hover:text-olive transition-colors"
            >
              {link.label}
            </a>
          ))}
          <Link
            to="/login"
            className="px-6 py-2 border border-olive/20 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-olive hover:text-white transition-all"
          >
            Staff Login
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden w-10 h-10 rounded-full border border-olive/15 flex items-center justify-center text-olive hover:bg-olive/5 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="md:hidden bg-[#FDFCF9]/95 backdrop-blur-md border-t border-olive/5 px-6 pb-6 pt-4 flex flex-col gap-1"
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="py-3.5 text-sm font-bold uppercase tracking-widest text-olive/60 hover:text-olive transition-colors border-b border-olive/5 last:border-0"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="mt-3 w-full py-3 border border-olive/20 rounded-full text-xs font-bold uppercase tracking-widest text-center hover:bg-olive hover:text-white transition-all"
            >
              Staff Login
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}