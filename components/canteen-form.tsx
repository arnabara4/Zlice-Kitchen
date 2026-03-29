'use client';

import { useState, useRef, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Upload, X, Eye, EyeOff, Navigation, MapPin } from 'lucide-react';

const LocationPicker = lazy(() => import('@/components/location-picker'));

interface Canteen {
  id: string;
  name: string;
  email: string;
  logo_url: string | null;
  phone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  delivery_fee: number | null;
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
}

interface CanteenFormProps {
  canteen?: Canteen | null;
  onClose: () => void;
}

export default function CanteenForm({ canteen, onClose }: CanteenFormProps) {
  const [formData, setFormData] = useState({
    name: canteen?.name || '',
    email: canteen?.email || '',
    phone: canteen?.phone || '',
    address: canteen?.address || '',
    latitude: canteen?.latitude?.toString() || '',
    longitude: canteen?.longitude?.toString() || '',
    delivery_fee: canteen?.delivery_fee?.toString() || '20.00',
    password: '',
    is_active: canteen?.is_active ?? true,
    is_delivery_enabled: canteen?.is_delivery_enabled ?? false,
    is_takeaway_enabled: canteen?.is_takeaway_enabled ?? false,
    is_dine_in_enabled: canteen?.is_dine_in_enabled ?? false,
    is_gst_enabled: canteen?.is_gst_enabled ?? false,
    gst_number: canteen?.gst_number || '',
    home_cook: canteen?.home_cook || null,
    supports_instant_orders: canteen?.supports_instant_orders ?? true,
    supports_scheduled_orders: canteen?.supports_scheduled_orders ?? false,
    increment_percentage: canteen?.increment_percentage?.toString() || '5.00',
    is_fitness: canteen?.is_fitness ?? false,
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(
    kitchen?.logo_url || null
  );
  const [logoFile, setLogoFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should not exceed 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoFile(base64String);
        setLogoPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
    setLoading(true);

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        delivery_fee: formData.delivery_fee ? parseFloat(formData.delivery_fee) : 20.00,
        is_active: formData.is_active,
        is_delivery_enabled: formData.is_delivery_enabled,
        is_takeaway_enabled: formData.is_takeaway_enabled,
        is_dine_in_enabled: formData.is_dine_in_enabled,
        is_gst_enabled: formData.is_gst_enabled,
        gst_number: formData.gst_number || null,
        home_cook: formData.home_cook,
        supports_instant_orders: formData.supports_instant_orders,
        supports_scheduled_orders: formData.supports_scheduled_orders,
        increment_percentage: formData.increment_percentage ? parseFloat(formData.increment_percentage) : 5.00,
        is_fitness: formData.is_fitness,
      };

      // Include password only if provided
      if (formData.password) {
        payload.password = formData.password;
      } else if (!canteen) {
        // Password is required for new canteens
        alert('Password is required for new kitchen');
        setLoading(false);
        return;
      }

      // Include logo if changed
      if (logoFile !== null) {
        payload.logo = logoFile;
      }

      const url = canteen ? '/api/canteens' : '/api/canteens';
      const method = canteen ? 'PUT' : 'POST';

      if (canteen) {
        payload.id = canteen.id;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save kitchen');
      }

      onClose();
    } catch (error) {
      console.error('Error saving kitchen:', error);
      alert(error instanceof Error ? error.message : 'Failed to save kitchen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Logo Upload */}
      <div className="space-y-2">
        <Label>Kitchen Logo</Label>
        <Card className="p-4">
          {logoPreview ? (
            <div className="relative">
              <img
                src={logoPreview}
                alt="Logo preview"
                className="w-32 h-32 object-cover rounded-lg mx-auto"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-0 right-0"
                onClick={handleRemoveLogo}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg">
              <Upload className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Click to upload logo
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG up to 5MB
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="logo-upload"
          />
          <Button
            type="button"
            variant="outline"
            className="w-full mt-2"
            onClick={() => fileInputRef.current?.click()}
          >
            {logoPreview ? 'Change Logo' : 'Upload Logo'}
          </Button>
        </Card>
      </div>

      {/* Canteen Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Kitchen Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Enter kitchen name"
          required
        />
      </div>

      {/* Emails */}
      <div className="space-y-2">
        <Label htmlFor="email">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="canteen@example.com"
          required
        />
      </div>

      {/* Phone Number */}
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleInputChange}
          placeholder="9876543210"
        />
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          placeholder="Enter kitchen address"
        />
      </div>

      {/* Delivery Fee */}
      <div className="space-y-2">
        <Label htmlFor="delivery_fee">Delivery Fee (₹)</Label>
        <Input
          id="delivery_fee"
          name="delivery_fee"
          type="number"
          step="0.01"
          min="0"
          value={formData.delivery_fee}
          onChange={handleInputChange}
          placeholder="20.00"
        />
        <p className="text-xs text-muted-foreground">
          Default delivery fee for this kitchen
        </p>
      </div>

      {/* Coordinates */}
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
          <div className="w-full h-[400px] bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
            <p className="text-slate-500">Loading map...</p>
          </div>
        }>
          <div className="h-[400px]">
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
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              name="latitude"
              type="number"
              step="any"
              value={formData.latitude}
              onChange={handleInputChange}
              placeholder="25.262111"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              name="longitude"
              type="number"
              step="any"
              value={formData.longitude}
              onChange={handleInputChange}
              placeholder="82.990937"
            />
          </div>
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">
          Password {!canteen && <span className="text-destructive">*</span>}
        </Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleInputChange}
            placeholder={canteen ? 'Leave blank to keep current' : 'Enter password'}
            required={!canteen}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {canteen && (
          <p className="text-xs text-muted-foreground">
            Leave blank to keep the current password
          </p>
        )}
      </div>

      {/* GST Settings */}
      <div className="space-y-4">
        <Label>GST Settings</Label>
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_gst_enabled" className="font-normal">Enable GST</Label>
              <p className="text-xs text-muted-foreground">
                Charge 5% GST on online orders
              </p>
            </div>
            <Switch
              id="is_gst_enabled"
              checked={formData.is_gst_enabled}
              onCheckedChange={(checked: boolean) =>
                setFormData((prev) => ({ ...prev, is_gst_enabled: checked }))
              }
            />
          </div>
          
          {formData.is_gst_enabled && (
            <div className="space-y-2 pt-2">
              <Label htmlFor="gst_number">GST Number</Label>
              <Input
                id="gst_number"
                name="gst_number"
                value={formData.gst_number}
                onChange={handleInputChange}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
              />
              <p className="text-xs text-muted-foreground">
                15-character GSTIN (optional)
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Order Type Settings */}
      <div className="space-y-4">
        <Label>Order Types</Label>
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_delivery_enabled" className="font-normal">Delivery Orders</Label>
              <p className="text-xs text-muted-foreground">
                Enable delivery orders for this kitchen
              </p>
            </div>
            <Switch
              id="is_delivery_enabled"
              checked={formData.is_delivery_enabled}
              onCheckedChange={(checked: boolean) =>
                setFormData((prev) => ({ ...prev, is_delivery_enabled: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_takeaway_enabled" className="font-normal">Takeaway Orders</Label>
              <p className="text-xs text-muted-foreground">
                Enable takeaway orders for this kitchen
              </p>
            </div>
            <Switch
              id="is_takeaway_enabled"
              checked={formData.is_takeaway_enabled}
              onCheckedChange={(checked: boolean) =>
                setFormData((prev) => ({ ...prev, is_takeaway_enabled: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_dine_in_enabled" className="font-normal">Dine-In Orders</Label>
              <p className="text-xs text-muted-foreground">
                Enable dine-in orders for this kitchen
              </p>
            </div>
            <Switch
              id="is_dine_in_enabled"
              checked={formData.is_dine_in_enabled}
              onCheckedChange={(checked: boolean) =>
                setFormData((prev) => ({ ...prev, is_dine_in_enabled: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="supports_instant_orders" className="font-normal">Instant Orders (On-Demand)</Label>
              <p className="text-xs text-muted-foreground">
                Can this kitchen accept standard instant orders?
              </p>
            </div>
            <Switch
              id="supports_instant_orders"
              checked={formData.supports_instant_orders}
              onCheckedChange={(checked: boolean) =>
                setFormData((prev) => ({ ...prev, supports_instant_orders: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="supports_scheduled_orders" className="font-normal">Scheduled Orders</Label>
              <p className="text-xs text-muted-foreground">
                Can this kitchen accept scheduled orders? (Kitchen mode)
              </p>
            </div>
            <Switch
              id="supports_scheduled_orders"
              checked={formData.supports_scheduled_orders}
              onCheckedChange={(checked: boolean) =>
                setFormData((prev) => ({ ...prev, supports_scheduled_orders: checked }))
              }
            />
          </div>
        </Card>
      </div>

      {/* General Settings */}
      <div className="space-y-4">
        <Label>General Settings</Label>
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_active" className="font-normal">Active Status</Label>
              <p className="text-xs text-muted-foreground">
                Inactive kitchens cannot be accessed
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked: boolean) =>
                setFormData((prev) => ({ ...prev, is_active: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="home_cook" className="font-normal">Kitchen Type</Label>
              <p className="text-xs text-muted-foreground">
                Classify this kitchen's home cook capabilities
              </p>
            </div>
            <select
              id="home_cook"
              value={formData.home_cook || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, home_cook: (e.target.value as any) || null }))}
              className="border border-input bg-background px-3 py-1.5 rounded-md text-sm"
            >
              <option value="">Standard Kitchen</option>
              <option value="on-demand">Home Cook (On-Demand)</option>
              <option value="scheduling">Home Cook (Scheduling)</option>
              <option value="both">Home Cook (Both)</option>
            </select>
          </div>
        </Card>
      </div>

      {/* Pricing & Classification */}
      <div className="space-y-4">
        <Label>Pricing & Classification</Label>
        <Card className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="increment_percentage">Price Increment (%)</Label>
            <Input
              id="increment_percentage"
              name="increment_percentage"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.increment_percentage}
              onChange={handleInputChange}
              placeholder="5.00"
            />
            <p className="text-xs text-muted-foreground">
              Markup percentage applied to menu item base prices. Default is 5%.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_fitness" className="font-normal">Fitness Kitchen</Label>
              <p className="text-xs text-muted-foreground">
                Classify this kitchen as a fitness kitchen
              </p>
            </div>
            <Switch
              id="is_fitness"
              checked={formData.is_fitness}
              onCheckedChange={(checked: boolean) =>
                setFormData((prev) => ({ ...prev, is_fitness: checked }))
              }
            />
          </div>
        </Card>
      </div>

      {/* Form Actions */}
      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading
            ? 'Saving...'
            : canteen
            ? 'Update Kitchen'
            : 'Create Kitchen'}
        </Button>
      </div>
    </form>
  );
}
