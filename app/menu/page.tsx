'use client';

import { useEffect, useState, useMemo } from 'react';
import { useCanteen } from '@/lib/canteen-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Trash2, Edit2, Plus, X, Save, UtensilsCrossed, Home, Search, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  canteen_id: string;
  created_at: string;
  is_available: boolean;
  category?: string | null;
}

export default function MenuPage() {
  const { selectedCanteen } = useCanteen();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [categories, setCategories] = useState<{name: string}[]>([]);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCategories = async () => {
    if (!selectedCanteen) {
      setCategories([]);
      return;
    }

    try {
      const response = await fetch(`/api/categories?canteen_id=${selectedCanteen.id}`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchItems = async () => {
    if (!selectedCanteen) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/menu?canteenId=${selectedCanteen.id}`);
      if (!response.ok) throw new Error('Failed to fetch menu items');
      const data = await response.json();
      setItems(data || []);
    } catch (err) {
      console.error('Error fetching items:', err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, [selectedCanteen?.id]); // Use stable ID

    const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`/api/menu?id=${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete item');

      toast.success('Item deleted successfully');
      setItems(items.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting item:', err);
      toast.error('Failed to delete item');
    }
  };

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/menu/update', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            id,
            menuData: { is_available: !currentStatus }
         })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update status');

      setItems(items.map(item => 
        item.id === id ? { ...item, is_available: !currentStatus } : item
      ));
      toast.success('Item status updated');
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status');
    }
  };

  const startEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormPrice(item.price.toString());
    setFormCategory(item.category || '');
    setFormError('');
    setShowAddForm(false);
  };

  const startAdd = () => {
    setShowAddForm(true);
    setEditingId(null);
    setFormName('');
    setFormPrice('');
    setFormCategory('');
    setFormError('');
  };

  const cancelForm = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormName('');
    setFormPrice('');
    setFormCategory('');
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    if (!selectedCanteen) {
      setFormError('Please select a canteen first');
      setFormLoading(false);
      return;
    }

    try {
      const numPrice = parseFloat(formPrice);

      // Enhanced validation
      if (!formName.trim()) {
        setFormError('Item name is required');
        setFormLoading(false);
        return;
      }

      if (!formPrice || numPrice <= 0) {
        setFormError('Please enter a valid price greater than 0');
        setFormLoading(false);
        return;
      }

      const itemData = { 
        name: formName.trim(), 
        price: numPrice,
        category: formCategory || null
      };

      const response = await fetch('/api/menu/update', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            id: editingId || undefined,
            menuData: itemData
         })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save item');

      cancelForm();
      await fetchItems();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [items, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-[#020617]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#020617] pb-12">
      <div className="container mx-auto max-w-7xl p-4 lg:p-6 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Menu Management
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Manage your canteen's offerings and prices
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="gap-2 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              <Home className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
            {showAddForm ? (
              <Card className="border border-slate-200 dark:border-slate-800/50 shadow-lg dark:bg-[#1e293b] sticky top-6">
                <CardHeader className="bg-slate-50 dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-700/50">
                  <CardTitle className="text-slate-800 dark:text-slate-200">
                    {editingId ? 'Edit Item' : 'Add New Item'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Item Name
                      </Label>
                      <Input
                        id="name"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Masala Dosa"
                        className="dark:bg-slate-800/50 dark:border-slate-700"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Price (₹)
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        placeholder="0.00"
                        className="dark:bg-slate-800/50 dark:border-slate-700"
                      />
                    </div>

                    {formError && (
                      <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-900/30 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {formError}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Category
                      </Label>
                      <select
                        id="category"
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:bg-slate-800/50"
                      >
                        <option value="" className="bg-white dark:bg-slate-800">Select a category (Optional)</option>
                        {categories.map((cat) => (
                          <option key={cat.name} value={cat.name} className="bg-white dark:bg-slate-800">
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Button 
                        type="submit" 
                        disabled={formLoading} 
                        className="flex-1 h-10 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white shadow-sm disabled:opacity-50"
                      >
                        {formLoading ? (
                          <>
                            <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            {editingId ? 'Update Item' : 'Add Item'}
                          </>
                        )}
                      </Button>
                      <Button 
                        type="button"
                        onClick={cancelForm}
                        variant="outline"
                        className="flex-1 h-10 dark:border-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-800/50"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Button
                onClick={startAdd}
                className="w-full h-32 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all rounded-lg"
              >
                <div className="flex flex-col items-center gap-3">
                  <Plus className="w-8 h-8" />
                  <span className="text-lg font-semibold">Add New Item</span>
                </div>
              </Button>
            )}

            {/* Stats Card */}
            <Card className="mt-6 border border-slate-200 dark:border-slate-800/50 shadow-md dark:bg-[#1e293b]">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <UtensilsCrossed className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-3xl font-bold text-red-600 dark:text-red-500">{items.length}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Menu Items</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Items List Section */}
          <div className="lg:col-span-8">
            {/* Sticky Search Bar */}
            <div className="sticky top-0 z-20 bg-slate-50 dark:bg-[#0a0f1e] pb-4 -mt-2">
              <Card className="border border-slate-200 dark:border-slate-800/50 shadow-md dark:bg-[#1e293b]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="Search menu items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11 h-11 text-base dark:bg-slate-800/50 dark:border-slate-700 focus:border-red-500 dark:focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30"
                      />
                    </div>
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchQuery('')}
                        className="h-11 px-4 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Items List */}
            <Card className="border border-slate-200 dark:border-slate-800/50 shadow-lg dark:bg-[#1e293b] mt-4">
              <CardHeader className="bg-slate-50 dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-700/50">
                <CardTitle className="text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-red-500" />
                  Menu Items ({filteredItems.length}{filteredItems.length !== items.length && ` of ${items.length}`})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {items.length === 0 ? (
                  <div className="text-center py-16">
                    <UtensilsCrossed className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                    <p className="text-slate-600 dark:text-slate-400 text-lg mb-2">No menu items yet</p>
                    <p className="text-slate-500 dark:text-slate-500 text-sm">Click "Add New Item" to get started!</p>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-16">
                    <Search className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                    <p className="text-slate-600 dark:text-slate-400 text-lg mb-2">No items found</p>
                    <p className="text-slate-500 dark:text-slate-500 text-sm">Try adjusting your search</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchQuery('')}
                      className="mt-4"
                    >
                      Clear search
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className={`group relative bg-white dark:bg-[#0f172a] border rounded-lg p-4 hover:shadow-lg transition-all duration-300 ${
                          item.is_available 
                            ? 'border-slate-200 dark:border-slate-700/50 hover:border-red-400 dark:hover:border-red-500' 
                            : 'border-slate-300 dark:border-slate-600 opacity-60 hover:border-slate-400 dark:hover:border-slate-500'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <p className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-1">{item.name}</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-500">₹{item.price.toFixed(2)}</p>
                          </div>
                          <div className="flex gap-1 opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEdit(item)}
                              className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 active:bg-red-100 dark:active:bg-red-900/30"
                              aria-label={`Edit ${item.name}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(item.id)}
                              className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 active:bg-red-100 dark:active:bg-red-900/30"
                              aria-label={`Delete ${item.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Availability Status - Interactive Badge */}
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                          <button
                            onClick={() => toggleAvailability(item.id, item.is_available)}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95 ${
                              item.is_available
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40 border border-green-300 dark:border-green-700'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600'
                            }`}
                            title={`Click to mark as ${item.is_available ? 'unavailable' : 'available'}`}
                          >
                            {item.is_available ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Available</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Unavailable</span>
                              </>
                            )}
                          </button>
                        </div>
                        
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                          Added {new Date(item.created_at).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
