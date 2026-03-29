'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Bike, Search, Phone, MapPin, Building2 } from 'lucide-react';
import DeliveryManForm from '@/components/delivery-man-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DeliveryMan {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  vehicle_type: string | null;
  vehicle_number: string | null;
  is_active: boolean;
  canteen_count: number;
  joined_date: string;
}

export default function DeliveryManPage() {
  const [deliveryMen, setDeliveryMen] = useState<DeliveryMan[]>([]);
  const [filteredDeliveryMen, setFilteredDeliveryMen] = useState<DeliveryMan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDeliveryMan, setEditingDeliveryMan] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchDeliveryMen();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDeliveryMen(deliveryMen);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = deliveryMen.filter(
        (dm) =>
          dm.name.toLowerCase().includes(query) ||
          dm.phone.includes(query) ||
          dm.vehicle_number?.toLowerCase().includes(query)
      );
      setFilteredDeliveryMen(filtered);
    }
  }, [searchQuery, deliveryMen]);

  const fetchDeliveryMen = async () => {
    try {
      const response = await fetch('/api/delivery-man');
      if (!response.ok) throw new Error('Failed to fetch delivery men');
      const data = await response.json();
      setDeliveryMen(data);
      setFilteredDeliveryMen(data);
    } catch (error) {
      console.error('Error fetching delivery men:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const deliveryMan = deliveryMen.find((dm) => dm.id === id);
    if (
      !confirm(
        `Are you sure you want to delete "${deliveryMan?.name}"?\n\nThis will:\n• Remove their account access\n• Remove all kitchen assignments\n\nThis action cannot be undone!`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/delivery-man?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete delivery person');
      }

      setDeliveryMen(deliveryMen.filter((dm) => dm.id !== id));
      alert('✓ Delivery person deleted successfully');
    } catch (error) {
      console.error('Error deleting delivery person:', error);
      alert(
        'Failed to delete delivery person: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  };

  const handleEdit = async (id: string) => {
    setLoadingDetails(true);
    setIsFormOpen(true);
    setEditingDeliveryMan(null); // Clear previous data
    
    try {
      // Fetch full details including canteen assignments
      const response = await fetch(`/api/delivery-man?id=${id}`);
      if (!response.ok) throw new Error('Failed to fetch delivery person details');
      const data = await response.json();
      setEditingDeliveryMan(data);
    } catch (error) {
      console.error('Error fetching delivery person details:', error);
      alert('Failed to load delivery person details');
      setIsFormOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAdd = () => {
    setEditingDeliveryMan(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingDeliveryMan(null);
    fetchDeliveryMen();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading delivery personnel...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bike className="h-8 w-8" />
              Delivery Personnel Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage delivery personnel and their kitchen assignments
            </p>
          </div>
          <Button onClick={handleAdd} size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Add Delivery Person
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, phone, or vehicle number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Personnel</CardDescription>
            <CardTitle className="text-3xl">{deliveryMen.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {deliveryMen.filter((dm) => dm.is_active).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Inactive</CardDescription>
            <CardTitle className="text-3xl text-slate-500">
              {deliveryMen.filter((dm) => !dm.is_active).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Delivery Men List */}
      {filteredDeliveryMen.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Bike className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'No delivery personnel found matching your search'
                  : 'No delivery personnel added yet'}
              </p>
              {!searchQuery && (
                <Button onClick={handleAdd} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Delivery Person
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDeliveryMen.map((dm) => (
            <Card key={dm.id} className="relative hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Bike className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{dm.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 text-sm mt-1">
                        <Phone className="h-3 w-3" />
                        {dm.phone}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={dm.is_active ? 'default' : 'secondary'}>
                    {dm.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Vehicle Info */}
                {dm.vehicle_type && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Bike className="h-4 w-4" />
                    <span className="capitalize">{dm.vehicle_type}</span>
                    {dm.vehicle_number && (
                      <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {dm.vehicle_number}
                      </span>
                    )}
                  </div>
                )}

                {/* Address */}
                {dm.address && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{dm.address}</span>
                  </div>
                )}

                {/* Canteen Count */}
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{dm.canteen_count}</span>
                  <span className="text-muted-foreground">
                    {dm.canteen_count === 1 ? 'kitchen assigned' : 'kitchens assigned'}
                  </span>
                </div>

                {/* Joined Date */}
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Joined: {new Date(dm.joined_date).toLocaleDateString()}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(dm.id)}
                    className="flex-1"
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(dm.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDeliveryMan ? 'Edit Delivery Person' : 'Add New Delivery Person'}
            </DialogTitle>
            <DialogDescription>
              {editingDeliveryMan
                ? 'Update delivery person information and kitchen assignments'
                : 'Enter delivery person details and assign kitchens'}
            </DialogDescription>
          </DialogHeader>
          {loadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Loading details...</p>
              </div>
            </div>
          ) : (
            <DeliveryManForm
              key={editingDeliveryMan?.id || 'new'}
              deliveryMan={editingDeliveryMan}
              onSuccess={handleFormClose}
              onCancel={() => setIsFormOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
