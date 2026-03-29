'use client';

import { useEffect, useState } from 'react';
import { useCanteen } from '@/lib/canteen-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Edit2, Plus, X, Save, Tags, Home, Search, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Category {
  id: string;
  name: string;
  image_url?: string | null;
  canteen_id: string;
  created_at: string;
}

export default function CategoriesPage() {
  const { selectedCanteen, selectedCanteenId } = useCanteen();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchCategories = async () => {
    if (!selectedCanteen) {
      setCategories([]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/categories?canteen_id=${selectedCanteen.id}`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      
      const data = await response.json();
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [selectedCanteenId]); // Use stable ID

  const openAddDialog = () => {
    setEditingCategory(null);
    setFormName('');
    setFormImageUrl('');
    setFormError('');
    setDialogOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormName(category.name);
    setFormImageUrl(category.image_url || '');
    setFormError('');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    setFormName('');
    setFormImageUrl('');
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    if (!formName.trim()) {
      setFormError('Category name is required');
      setFormLoading(false);
      return;
    }

    if (!selectedCanteen) {
      setFormError('Please select a kitchen first');
      setFormLoading(false);
      return;
    }

    try {
      const categoryData = {
        name: formName.trim(),
        image_url: formImageUrl.trim() || undefined,
        canteen_id: selectedCanteen.id,
      };

      if (editingCategory) {
        // Update existing category
        const response = await fetch('/api/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingCategory.id, ...categoryData }),
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to update category');
        
        toast.success('Category updated successfully');
      } else {
        // Create new category
        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryData),
        });
        
        const data = await response.json();
        if (!response.ok) {
           if (response.status === 409) {
              setFormError('A category with this name already exists');
              return;
           }
           throw new Error(data.error || 'Failed to add category');
        }

        toast.success('Category added successfully');
      }

      closeDialog();
      await fetchCategories();
    } catch (err: any) {
      console.error('Error saving category:', err);
      setFormError(err.message || 'An error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/categories?id=${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
           throw { code: '23503' };
        }
        throw new Error(data.error || 'Failed to delete category');
      }

      toast.success('Category deleted successfully');
      setCategories(categories.filter(cat => cat.id !== id));
    } catch (err: any) {
      console.error('Error deleting category:', err);
      if (err.code === '23503') {
        toast.error('Cannot delete category - it is being used by menu items or kitchens');
      } else {
        toast.error('Failed to delete category');
      }
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Category Management
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Manage menu item categories
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
          {/* Left Section - Add/Stats */}
          <div className="lg:col-span-4 space-y-6">
            {/* Add Button Card */}
            <Card className="border border-slate-200 dark:border-slate-800/50 shadow-lg dark:bg-[#1e293b]">
              <CardContent className="p-6">
                <Button
                  onClick={openAddDialog}
                  className="w-full h-32 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all rounded-lg"
                >
                  <div className="flex flex-col items-center gap-3">
                    <Plus className="w-8 h-8" />
                    <span className="text-lg font-semibold">Add New Category</span>
                  </div>
                </Button>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="border border-slate-200 dark:border-slate-800/50 shadow-md dark:bg-[#1e293b]">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <Tags className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-3xl font-bold text-red-600 dark:text-red-500">{categories.length}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Categories</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Section - Categories List */}
          <div className="lg:col-span-8">
            {/* Search Bar */}
            <div className="sticky top-0 z-20 bg-slate-50 dark:bg-[#0a0f1e] pb-4 -mt-2">
              <Card className="border border-slate-200 dark:border-slate-800/50 shadow-md dark:bg-[#1e293b]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="Search categories..."
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

            {/* Categories Grid */}
            <Card className="border border-slate-200 dark:border-slate-800/50 shadow-lg dark:bg-[#1e293b] mt-4">
              <CardHeader className="bg-slate-50 dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-700/50">
                <CardTitle className="text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Tags className="w-5 h-5 text-red-500" />
                  Categories ({filteredCategories.length}{filteredCategories.length !== categories.length && ` of ${categories.length}`})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {categories.length === 0 ? (
                  <div className="text-center py-16">
                    <Tags className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                    <p className="text-slate-600 dark:text-slate-400 text-lg mb-2">No categories yet</p>
                    <p className="text-slate-500 dark:text-slate-500 text-sm">Click "Add New Category" to get started!</p>
                  </div>
                ) : filteredCategories.length === 0 ? (
                  <div className="text-center py-16">
                    <Search className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                    <p className="text-slate-600 dark:text-slate-400 text-lg mb-2">No categories found</p>
                    <p className="text-slate-500 dark:text-slate-500 text-sm">Try a different search term</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredCategories.map((category) => (
                      <Card 
                        key={category.id}
                        className="overflow-hidden border border-slate-200 dark:border-slate-700/50 hover:shadow-lg transition-all bg-white dark:bg-slate-800/50"
                      >
                        <CardContent className="p-0">
                          <div className="flex items-center gap-4 p-4">
                            {category.image_url ? (
                              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-700">
                                <img 
                                  src={category.image_url} 
                                  alt={category.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    if (target.nextElementSibling) {
                                      (target.nextElementSibling as HTMLElement).style.display = 'flex';
                                    }
                                  }}
                                />
                                <div className="w-full h-full hidden items-center justify-center">
                                  <ImageIcon className="w-8 h-8 text-slate-400" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-20 h-20 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                <ImageIcon className="w-8 h-8 text-slate-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 truncate">
                                {category.name}
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Added {new Date(category.created_at).toLocaleDateString('en-IN')}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openEditDialog(category)}
                                className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(category.id, category.name)}
                                className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] dark:bg-[#1e293b] dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              {editingCategory ? 'Update the category details below.' : 'Create a new category for menu items.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">
                Category Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Biryani, Drinks, Desserts"
                className="dark:bg-slate-800/50 dark:border-slate-700"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url" className="text-slate-700 dark:text-slate-300">
                Image URL (Optional)
              </Label>
              <Input
                id="image_url"
                type="url"
                value={formImageUrl}
                onChange={(e) => setFormImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="dark:bg-slate-800/50 dark:border-slate-700"
              />
              {formImageUrl && (
                <div className="mt-2 p-2 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Preview:</p>
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700">
                    <img 
                      src={formImageUrl} 
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        if (target.nextElementSibling) {
                          (target.nextElementSibling as HTMLElement).style.display = 'flex';
                        }
                      }}
                    />
                    <div className="w-full h-full hidden items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {formError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-2 rounded-md text-sm flex items-center gap-2">
                <X className="w-4 h-4" />
                {formError}
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={formLoading}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
              >
                {formLoading ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {editingCategory ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingCategory ? 'Update Category' : 'Add Category'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
