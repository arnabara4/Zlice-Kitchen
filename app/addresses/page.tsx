'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, MapPin, Navigation } from 'lucide-react';

const LocationPicker = lazy(() => import('@/components/location-picker'));

interface Address {
  id: string;
  address_slug: string;
  name: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

interface AddressFormData {
  address_slug: string;
  name: string;
  description: string;
  latitude: string;
  longitude: string;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const [formData, setFormData] = useState<AddressFormData>({
    address_slug: '',
    name: '',
    description: '',
    latitude: '',
    longitude: '',
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/admin/addresses');
      if (!response.ok) throw new Error('Failed to fetch addresses');
      const data = await response.json();
      setAddresses(data);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      alert('Failed to fetch addresses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setFormData({
        address_slug: address.address_slug,
        name: address.name,
        description: address.description || '',
        latitude: address.latitude?.toString() || '',
        longitude: address.longitude?.toString() || '',
      });
    } else {
      setEditingAddress(null);
      setFormData({
        address_slug: '',
        name: '',
        description: '',
        latitude: '',
        longitude: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAddress(null);
    setFormData({
      address_slug: '',
      name: '',
      description: '',
      latitude: '',
      longitude: '',
    });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude.toFixed(8),
          longitude: position.coords.longitude.toFixed(8),
        });
        setIsGettingLocation(false);
        alert('✓ Location captured successfully');
      },
      (error) => {
        setIsGettingLocation(false);
        let errorMessage = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const body = {
        address_slug: formData.address_slug,
        name: formData.name,
        description: formData.description || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };

      const url = editingAddress
        ? '/api/admin/addresses'
        : '/api/admin/addresses';

      const method = editingAddress ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingAddress ? { ...body, id: editingAddress.id } : body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save address');
      }

      alert(`✓ Address ${editingAddress ? 'updated' : 'created'} successfully`);

      handleCloseDialog();
      fetchAddresses();
    } catch (error: any) {
      console.error('Error saving address:', error);
      alert(error.message || 'Failed to save address');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address? This will also delete all associated distances.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/addresses', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete address');
      }

      alert('✓ Address deleted successfully');

      fetchAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Failed to delete address');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Delivery Addresses</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage delivery locations and distances
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Address
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Addresses</CardTitle>
          <CardDescription>
            List of all delivery addresses with their coordinates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Loading addresses...</div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No addresses found. Click "Add Address" to create one.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Slug</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Coordinates</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {addresses.map((address) => (
                    <TableRow key={address.id}>
                      <TableCell className="font-mono text-sm">{address.address_slug}</TableCell>
                      <TableCell className="font-medium">{address.name}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {address.description || '-'}
                      </TableCell>
                      <TableCell>
                        {address.latitude && address.longitude ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-slate-500" />
                            <span className="font-mono">
                              {address.latitude.toFixed(6)}, {address.longitude.toFixed(6)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(address)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(address.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </DialogTitle>
              <DialogDescription>
                {editingAddress
                  ? 'Update the address details below.'
                  : 'Fill in the details to add a new delivery address.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="address_slug">
                  Address Slug <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address_slug"
                  value={formData.address_slug}
                  onChange={(e) =>
                    setFormData({ ...formData, address_slug: e.target.value })
                  }
                  placeholder="e.g., iit-main-gate"
                  required
                  disabled={!!editingAddress}
                  className="font-mono"
                />
                <p className="text-xs text-slate-500">
                  Unique identifier (lowercase, use hyphens)
                  {editingAddress && ' - Cannot be changed'}
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., IIT Main Gate"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Additional details about this location"
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location (Click on map or enter coordinates)
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="gap-2"
                  >
                    <Navigation className="h-4 w-4" />
                    {isGettingLocation ? 'Getting location...' : 'Use My Location'}
                  </Button>
                </div>

                {/* Interactive Map */}
                <Suspense fallback={
                  <div className="w-full h-[300px] bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                    <p className="text-slate-500">Loading map...</p>
                  </div>
                }>
                  <div className="h-[300px]">
                    <LocationPicker
                      latitude={parseFloat(formData.latitude) || 25.2621}
                      longitude={parseFloat(formData.longitude) || 82.9910}
                      onLocationChange={(lat, lng) => {
                        setFormData({
                          ...formData,
                          latitude: lat.toFixed(8),
                          longitude: lng.toFixed(8),
                        });
                      }}
                    />
                  </div>
                </Suspense>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) =>
                        setFormData({ ...formData, latitude: e.target.value })
                      }
                      placeholder="25.262111"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) =>
                        setFormData({ ...formData, longitude: e.target.value })
                      }
                      placeholder="82.990937"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Saving...'
                  : editingAddress
                  ? 'Update Address'
                  : 'Create Address'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
