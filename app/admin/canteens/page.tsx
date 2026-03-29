'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Building2, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CanteenForm from '@/components/canteen-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Canteen {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  delivery_fee: number | null;
  logo_url: string | null;
  is_active: boolean;
  is_delivery_enabled: boolean;
  is_takeaway_enabled: boolean;
  is_dine_in_enabled: boolean;
  is_gst_enabled: boolean;
  gst_number: string | null;
  home_cook: 'on-demand' | 'scheduling' | 'both' | null;
  supports_instant_orders: boolean;
  supports_scheduled_orders: boolean;
  increment_percentage: number | null;
  is_fitness: boolean;
  is_verified: boolean;
  verification_status: string | null;
  verification_video_url: string | null;
  submitted_at: string | null;
  created_at: string;
}

export default function CanteensPage() {
  const router = useRouter();
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCanteen, setEditingCanteen] = useState<Canteen | null>(null);

  useEffect(() => {
    fetchCanteens();
  }, []);

  const fetchCanteens = async () => {
    try {
      const response = await fetch('/api/canteens');
      if (!response.ok) throw new Error('Failed to fetch kitchens');
      const data = await response.json();
      setCanteens(data);
    } catch (error) {
      console.error('Error fetching kitchens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const canteen = canteens.find(c => c.id === id);
    if (!confirm(`Are you sure you want to delete "${canteen?.name}"?\n\n⚠️ WARNING: This will permanently delete:\n• All menu items\n• All orders and order history\n• All khata students and transactions\n• All related data\n\nThis action cannot be undone!`)) {
      return;
    }

    try {
      const response = await fetch(`/api/canteens?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete kitchen');
      }

      setCanteens(canteens.filter((c) => c.id !== id));
      alert('✓ Kitchen deleted successfully');
    } catch (error) {
      console.error('Error deleting kitchen:', error);
      alert('Failed to delete kitchen: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleEdit = (canteen: Canteen) => {
    setEditingCanteen(canteen);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingCanteen(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingCanteen(null);
    fetchCanteens();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <p className="text-muted-foreground">Loading kitchens...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Kitchen Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your kitchens and their settings
          </p>
        </div>
        <Button onClick={handleAdd} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Add Kitchen
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {canteens.map((canteen) => (
          <Card key={canteen.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {canteen.logo_url ? (
                    <img
                      src={canteen.logo_url}
                      alt={canteen.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg">{canteen.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {canteen.email}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={canteen.is_active ? 'default' : 'secondary'}>
                    {canteen.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  {canteen.verification_status === 'under_review' && (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                      UNDER REVIEW
                    </Badge>
                  )}
                  {canteen.verification_status === 'verified' ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      VERIFIED
                    </Badge>
                  ) : kitchen.verification_status === 'rejected' ? (
                    <Badge variant="destructive">
                      REJECTED
                    </Badge>
                  ) : null}
                </div>
              </div>
              
              {/* Order Type Badges */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {canteen.is_delivery_enabled && (
                  <Badge variant="outline" className="text-xs">
                    🚚 Delivery
                  </Badge>
                )}
                {canteen.is_takeaway_enabled && (
                  <Badge variant="outline" className="text-xs">
                    🛍️ Takeaway
                  </Badge>
                )}
                {canteen.is_dine_in_enabled && (
                  <Badge variant="outline" className="text-xs">
                    🍽️ Dine-In
                  </Badge>
                )}
                {canteen.is_gst_enabled && (
                  <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                    📋 GST Enabled
                  </Badge>
                )}
                {canteen.home_cook && (
                  <Badge variant="outline" className="text-xs bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800">
                    👨‍🍳 Kitchen ({canteen.home_cook})
                  </Badge>
                )}
                {canteen.supports_scheduled_orders && (
                  <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                    🗓️ Scheduled
                  </Badge>
                )}
                {canteen.supports_instant_orders && (
                  <Badge variant="outline" className="text-xs bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800">
                    ⚡ Instant
                  </Badge>
                )}
                {canteen.is_fitness && (
                  <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                    💪 Fitness
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                  📊 {canteen.increment_percentage ?? 5}% Markup
                </Badge>
                {!canteen.is_delivery_enabled && !canteen.is_takeaway_enabled && !canteen.is_dine_in_enabled && (
                  <Badge variant="secondary" className="text-xs">
                    No order types enabled
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(canteen)}
                    className="flex-1"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(canteen.id)}
                    className="flex-1"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
                {canteen.verification_status === 'under_review' && (
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => router.push(`/admin/verification-review?id=${canteen.id}`)}
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Review Verification
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {canteens.length === 0 && (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">No kitchens yet</p>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first kitchen
            </p>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Kitchen
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCanteen ? 'Edit Kitchen' : 'Add New Kitchen'}
            </DialogTitle>
            <DialogDescription>
              {editingCanteen
                ? 'Update the kitchen information below'
                : 'Fill in the details to create a new kitchen'}
            </DialogDescription>
          </DialogHeader>
          <CanteenForm canteen={editingCanteen} onClose={handleFormClose} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
