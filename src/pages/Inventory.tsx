import { useState, useEffect, FormEvent } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../services/api';
import { InventoryItem, User } from '../types';
import { 
  Plus, 
  Package, 
  AlertTriangle, 
  Search,
  History,
  TrendingDown,
  Loader2,
  Trash2
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import Swal from 'sweetalert2';

export default function Inventory() {
  const { user } = useOutletContext<{ user: User }>();
  // ... (existing state)
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [newItem, setNewItem] = useState({ 
    name: '', 
    stock: '', 
    min_stock: '5', 
    unit: 'Bottle', 
    price: '',
    image_url: ''
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const { data } = await api.get('/inventory');
      setItems(data);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to fetch inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/inventory', {
        ...newItem,
        stock: parseInt(newItem.stock),
        min_stock: parseInt(newItem.min_stock),
        price: parseFloat(newItem.price)
      });
      setIsAdding(false);
      setNewItem({ name: '', stock: '', min_stock: '5', unit: 'Bottle', price: '', image_url: '' });
      fetchInventory();
      Swal.fire({
        icon: 'success',
        title: 'Stock Added',
        text: 'Item added to inventory successfully',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to add item to inventory', 'error');
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      await api.put(`/inventory/${editingItem.id}`, {
        name: editingItem.name,
        stock: parseInt(editingItem.stock.toString()),
        min_stock: parseInt(editingItem.min_stock.toString()),
        unit: editingItem.unit,
        price: parseFloat(editingItem.price?.toString() || '0'),
        image_url: editingItem.image_url
      });
      setEditingItem(null);
      fetchInventory();
      Swal.fire({
        icon: 'success',
        title: 'Updated',
        text: 'Inventory item updated successfully',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to update inventory item', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This will remove the item from the inventory permanently.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1A1A1A',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/inventory/${id}`);
        fetchInventory();
        Swal.fire('Deleted!', 'Item has been removed from stock.', 'success');
      } catch (err) {
        console.error(err);
        Swal.fire('Error!', 'Failed to remove inventory item.', 'error');
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
          <h2 className="text-4xl md:text-5xl font-serif text-ink tracking-tight">Inventory</h2>
          <p className="text-sm text-olive/60 mt-2 font-medium italic">Track your professional supplies and stock levels.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full md:w-auto bg-olive text-white px-8 py-4 rounded-full flex items-center justify-center gap-2 hover:bg-ink shadow-lg shadow-olive/10 transition-all active:scale-95 text-xs md:text-sm font-bold tracking-tight"
        >
          <Plus size={18} />
          <span>Add Stock</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[32px] border border-olive/12 shadow-[0_10px_30px_-10px_rgba(90,90,64,0.08)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px] md:min-w-0">
              <thead>
                <tr className="border-b border-olive/5 bg-warm-bg/30">
                  <th className="px-10 py-6 text-[10px] uppercase tracking-widest text-olive/40 font-bold">Product</th>
                  <th className="px-10 py-6 text-[10px] uppercase tracking-widest text-olive/40 font-bold">Stock</th>
                  <th className="px-10 py-6 text-[10px] uppercase tracking-widest text-olive/40 font-bold">Unit</th>
                  <th className="px-10 py-6 text-[10px] uppercase tracking-widest text-olive/40 font-bold text-right">Status</th>
                  <th className="px-10 py-6 text-[10px] uppercase tracking-widest text-olive/40 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-olive/5">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-10 py-24 text-center text-olive/40 italic font-medium">No inventory data available.</td>
                  </tr>
                ) : (
                  items.map((item, i) => (
                    <motion.tr 
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-olive/5 transition-colors group"
                    >
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div 
                            onClick={() => user.role !== 'employee' && setEditingItem(item)}
                            className={cn(
                              "w-12 h-12 rounded-xl border border-olive/10 flex items-center justify-center overflow-hidden transition-all",
                              user.role !== 'employee' ? "hover:scale-105 cursor-pointer" : ""
                            )}
                          >
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="bg-olive/5 w-full h-full flex items-center justify-center text-olive">
                                <Package size={18} />
                              </div>
                            )}
                          </div>
                          <span className="font-bold text-ink group-hover:text-olive transition-colors">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-sm text-ink font-semibold">{item.stock}</td>
                      <td className="px-10 py-6 text-sm text-olive/60 font-medium">{item.unit}</td>
                      <td className="px-10 py-6 text-right">
                        <span className={cn(
                          "text-[9px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border font-bold shadow-sm",
                          item.stock <= item.min_stock ? "bg-red-50 border-red-100 text-red-600" : "bg-emerald-50 border-emerald-100 text-emerald-600"
                        )}>
                          {item.stock <= item.min_stock ? 'Low Stock' : 'Optimal'}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex justify-end items-center gap-1">
                          {user.role !== 'employee' && (
                            <button 
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-red-300 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

        <div className="space-y-6">
          <div className="bg-olive text-white p-10 rounded-[32px] shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-white/10 rounded-[20px] shadow-inner">
                <AlertTriangle size={24} className="text-orange-300" />
              </div>
              <h3 className="serif text-2xl">Restock Alerts</h3>
            </div>
            <div className="space-y-6">
              {items.filter(i => i.stock <= i.min_stock).length === 0 ? (
                <p className="text-white/40 text-sm italic font-light">All stock levels are optimal at this moment.</p>
              ) : (
                items.filter(i => i.stock <= i.min_stock).map(item => (
                  <div key={item.id} className="flex justify-between items-center bg-white/10 p-5 rounded-3xl border border-white/5 group hover:bg-white/15 transition-all">
                    <div>
                      <p className="text-[13px] font-bold tracking-tight">{item.name}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] mt-1 font-bold">{item.stock} {item.unit} remaining</p>
                    </div>
                    <button className="text-[10px] uppercase font-bold tracking-widest bg-white text-olive px-4 py-2.5 rounded-xl active:scale-95 transition-all shadow-lg hover:shadow-white/20">
                      Restock
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-[2rem] p-10 shadow-2xl"
          >
            <h3 className="text-2xl font-serif mb-6">Inventory Entry</h3>
            <form onSubmit={handleAdd} className="space-y-6">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Product Name</label>
                <input 
                  type="text" 
                  value={newItem.name}
                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                  className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all"
                  placeholder="Shampoo Bottle 500ml"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Current Stock</label>
                  <input 
                    type="number" 
                    value={newItem.stock}
                    onChange={e => setNewItem({...newItem, stock: e.target.value})}
                    className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all"
                    placeholder="10"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Min Stock Alert</label>
                  <input 
                    type="number" 
                    value={newItem.min_stock}
                    onChange={e => setNewItem({...newItem, min_stock: e.target.value})}
                    className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all"
                    placeholder="5"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Unit</label>
                  <input 
                    type="text" 
                    value={newItem.unit}
                    onChange={e => setNewItem({...newItem, unit: e.target.value})}
                    className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all"
                    placeholder="Bottle/Box"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Cost Price (₹)</label>
                  <input 
                    type="number" 
                    value={newItem.price}
                    onChange={e => setNewItem({...newItem, price: e.target.value})}
                    className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all"
                    placeholder="450"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Image URL</label>
                <input 
                  type="text" 
                  value={newItem.image_url}
                  onChange={e => setNewItem({...newItem, image_url: e.target.value})}
                  className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all text-xs"
                  placeholder="https://images.unsplash.com/..."
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
                  Confirm Addition
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-[2rem] p-10 shadow-2xl"
          >
            <h3 className="text-2xl font-serif mb-6">Inventory Update</h3>
            <form onSubmit={handleUpdate} className="space-y-6">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Product Name</label>
                <input 
                  type="text" 
                  value={editingItem.name}
                  onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                  className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all font-bold"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Current Stock</label>
                  <input 
                    type="number" 
                    value={editingItem.stock}
                    onChange={e => setEditingItem({...editingItem, stock: parseInt(e.target.value)})}
                    className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Min Stock Alert</label>
                  <input 
                    type="number" 
                    value={editingItem.min_stock}
                    onChange={e => setEditingItem({...editingItem, min_stock: parseInt(e.target.value)})}
                    className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all font-bold"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Unit</label>
                  <input 
                    type="text" 
                    value={editingItem.unit || ''}
                    onChange={e => setEditingItem({...editingItem, unit: e.target.value})}
                    className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Cost Price (₹)</label>
                  <input 
                    type="number" 
                    value={editingItem.price || ''}
                    onChange={e => setEditingItem({...editingItem, price: parseFloat(e.target.value)})}
                    className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#A19B95] mb-2 block px-1">Image URL</label>
                <input 
                  type="text" 
                  value={editingItem.image_url || ''}
                  onChange={e => setEditingItem({...editingItem, image_url: e.target.value})}
                  className="w-full bg-[#FDFCFB] border border-[#F0EBE6] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1A1A1A]/30 transition-all text-xs"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setEditingItem(null)}
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
