'use client';

import { useState, useEffect, useRef } from 'react';
import { useCanteen } from '@/lib/canteen-context';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Building2, Upload, Save, Loader2, Trash2, Plus, Image as ImageIcon, Youtube, Bell, Volume2, CalendarClock } from 'lucide-react';
import Image from 'next/image';
import { getSoundEnabled, setSoundEnabled } from '@/lib/hooks/use-order-notification';
import { PrinterSettings } from '@/components/printer-settings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScheduleManagement } from '@/components/schedule-management';

interface SlideshowItem {
  type: 'image' | 'youtube' | 'youtube-playlist';
  url: string;
  title?: string;
  duration?: number;
}

export default function SettingsPage() {
  const { selectedCanteen, refreshCanteens } = useCanteen();
  const { isKitchen } = useAuth();
  const [canteenName, setCanteenName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isGstEnabled, setIsGstEnabled] = useState(false);
  const [openingTime, setOpeningTime] = useState('08:00');
  const [closingTime, setClosingTime] = useState('22:00');
  const [supportsScheduledOrders, setSupportsScheduledOrders] = useState(false);
  const [scheduleCategories, setScheduleCategories] = useState<any[]>([]);
  const [totalPackagingFee, setTotalPackagingFee] = useState('10.00');
  const [packagingFeePerItem, setPackagingFeePerItem] = useState('2.00');
  const [packagingFeeType, setPackagingFeeType] = useState<'fixed' | 'per-item'>('fixed');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Notification sound state
  const [orderSoundEnabled, setOrderSoundEnabled] = useState(true);
  
  // Slideshow state
  const [slideshowEnabled, setSlideshowEnabled] = useState(false);
  const [slideshowInterval, setSlideshowInterval] = useState(5000);
  const [slideshowItems, setSlideshowItems] = useState<SlideshowItem[]>([]);
  const [newItemType, setNewItemType] = useState<'image' | 'youtube' | 'youtube-playlist'>('image');
  const [newItemUrl, setNewItemUrl] = useState('');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDuration, setNewItemDuration] = useState<number | ''>('');
  const [ordersDisplayInterval, setOrdersDisplayInterval] = useState(10000);
  const [ordersDisplayDuration, setOrdersDisplayDuration] = useState(15000);
  const [uploadingSlideshow, setUploadingSlideshow] = useState(false);
  const slideshowFileInputRef = useRef<HTMLInputElement>(null);

  // Load notification sound setting on mount
  useEffect(() => {
    setOrderSoundEnabled(getSoundEnabled());
  }, []);

  // Helper functions for IST/UTC conversion
  const utcToIst = (utcTime: string): string => {
    if (!utcTime) return '08:00';
    const [hours, minutes] = utcTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + 330; // Add 5:30 (330 minutes)
    const istHours = Math.floor(totalMinutes / 60) % 24;
    const istMinutes = totalMinutes % 60;
    return `${String(istHours).padStart(2, '0')}:${String(istMinutes).padStart(2, '0')}`;
  };

  const istToUtc = (istTime: string): string => {
    if (!istTime) return '02:30';
    const [hours, minutes] = istTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes - 330; // Subtract 5:30 (330 minutes)
    const utcHours = (Math.floor(totalMinutes / 60) + 24) % 24;
    const utcMinutes = (totalMinutes % 60 + 60) % 60;
    return `${String(utcHours).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')}:00`;
  };

  useEffect(() => {
    if (selectedCanteen) {
      setCanteenName(selectedCanteen.name || '');
      setLogoUrl(selectedCanteen.logo_url || '');
      setIsOnline((selectedCanteen as any).is_online || false);
      setIsActive((selectedCanteen as any).is_active || false);
      setIsGstEnabled((selectedCanteen as any).is_gst_enabled || false);
      setSlideshowEnabled((selectedCanteen as any).slideshow_enabled || false);
      setSlideshowInterval((selectedCanteen as any).slideshow_interval || 5000);
      setSlideshowItems((selectedCanteen as any).slideshow_items || []);
      setOrdersDisplayInterval((selectedCanteen as any).orders_display_interval || 10000);
      setOrdersDisplayDuration((selectedCanteen as any).orders_display_duration || 15000);
      
      // Convert UTC times to IST for display
      const openTime = (selectedCanteen as any).opening_time;
      const closeTime = (selectedCanteen as any).closing_time;
      setOpeningTime(openTime ? utcToIst(openTime) : '08:00');
      setClosingTime(closeTime ? utcToIst(closeTime) : '22:00');
      setSupportsScheduledOrders((selectedCanteen as any).supports_scheduled_orders || false);

      if (isKitchen) {
        fetch(`/api/categories?canteen_id=${selectedCanteen.id}`, { credentials: "include" })
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              setScheduleCategories(data.map(c => ({
                ...c,
                order_start_time: c.order_start_time ? utcToIst(c.order_start_time) : '',
                order_cutoff_time: c.order_cutoff_time ? utcToIst(c.order_cutoff_time) : ''
              })));
            }
          })
          .catch(console.error);
      }
      
      // Set packaging fee values
      setTotalPackagingFee(((selectedCanteen as any).total_packaging_fee ?? 10.00).toString());
      setPackagingFeePerItem(((selectedCanteen as any).packaging_fee_per_item ?? 2.00).toString());
      setPackagingFeeType((selectedCanteen as any).packaging_fee_type || 'fixed');
    }
  }, [selectedCanteen]);

  // Handle notification sound toggle
  const handleSoundToggle = (enabled: boolean) => {
    setOrderSoundEnabled(enabled);
    setSoundEnabled(enabled);
  };

  // Handle online status toggle - updates DB immediately
  const handleOnlineToggle = async (enabled: boolean) => {
    if (!selectedCanteen) return;

    setIsOnline(enabled);
    
    try {
      const res = await fetch('/api/canteen/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canteenId: selectedCanteen.id, is_online: enabled })
      });

      if (!res.ok) throw new Error('Failed to update status');

      setMessage({ 
        type: 'success', 
        text: `Canteen is now ${enabled ? 'online' : 'offline'}` 
      });
      
      await refreshCanteens();
    } catch (error) {
      console.error('Error updating online status:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to update online status' 
      });
      setIsOnline(!enabled);
    }
  };

  // Handle active status toggle - updates DB immediately
  const handleActiveToggle = async (enabled: boolean) => {
    if (!selectedCanteen) return;

    setIsActive(enabled);
    
    try {
      const res = await fetch('/api/canteen/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canteenId: selectedCanteen.id, is_active: enabled })
      });

      if (!res.ok) throw new Error('Failed to update status');

      setMessage({ 
        type: 'success', 
        text: `Canteen is now ${enabled ? 'active' : 'inactive'}` 
      });
      
      await refreshCanteens();
    } catch (error) {
      console.error('Error updating active status:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to update active status' 
      });
      setIsActive(!enabled);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please upload an image file' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size should be less than 5MB' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      setLogoUrl(data.url);
      setMessage({ type: 'success', text: 'Logo uploaded successfully' });
    } catch (error) {
      console.error('Error uploading logo:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to upload logo' });
    } finally {
      setUploading(false);
    }
  };

  const handleSlideshowImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please upload an image file' });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size should be less than 10MB' });
      return;
    }

    setUploadingSlideshow(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      setNewItemUrl(data.url);
      setMessage({ type: 'success', text: 'Image uploaded successfully. You can now add it to slideshow.' });
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to upload image' });
    } finally {
      setUploadingSlideshow(false);
    }
  };

  const handleAddSlideshowItem = () => {
    if (!newItemUrl.trim()) {
      setMessage({ type: 'error', text: 'URL is required' });
      return;
    }

    const newItem: SlideshowItem = {
      type: newItemType,
      url: newItemUrl.trim(),
      title: newItemTitle.trim() || undefined,
      duration: newItemDuration ? Number(newItemDuration) : undefined,
    };

    setSlideshowItems([...slideshowItems, newItem]);
    setNewItemUrl('');
    setNewItemTitle('');
    setNewItemDuration('');
    setMessage(null);
  };

  const handleRemoveSlideshowItem = (index: number) => {
    setSlideshowItems(slideshowItems.filter((_, i) => i !== index));
  };

  const extractYouTubeEmbedUrl = (url: string): string => {
    // Extract video ID from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&loop=1&playlist=${match[1]}`;
      }
    }

    // If already an embed URL, return as is
    if (url.includes('youtube.com/embed/')) {
      return url;
    }

    return url;
  };

  const handleSave = async () => {
    if (!selectedCanteen) return;

    if (!canteenName.trim()) {
      setMessage({ type: 'error', text: 'Kitchen name is required' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canteenId: selectedCanteen.id,
          settings: {
            name: canteenName.trim(),
            logo_url: logoUrl,
            is_gst_enabled: isGstEnabled,
            supports_scheduled_orders: supportsScheduledOrders,
            opening_time: istToUtc(openingTime),
            closing_time: istToUtc(closingTime),
            total_packaging_fee: parseFloat(totalPackagingFee),
            packaging_fee_per_item: parseFloat(packagingFeePerItem),
            packaging_fee_type: packagingFeeType,
            slideshow_enabled: slideshowEnabled,
            slideshow_interval: slideshowInterval,
            slideshow_items: slideshowItems,
            orders_display_interval: ordersDisplayInterval,
            orders_display_duration: ordersDisplayDuration,
          }
        })
      });

      if (!res.ok) throw new Error('Failed to save settings');

      if (isKitchen && scheduleCategories.length > 0) {
        await Promise.all(scheduleCategories.map(cat => 
          fetch('/api/categories', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: cat.id,
              name: cat.name,
              canteen_id: selectedCanteen.id,
              order_start_time: cat.order_start_time ? istToUtc(cat.order_start_time) : null,
              order_cutoff_time: cat.order_cutoff_time ? istToUtc(cat.order_cutoff_time) : null,
            })
          })
        ));
      }

      setMessage({ type: 'success', text: 'Settings saved successfully' });
      
      await refreshCanteens();
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setLoading(false);
    }
  };

  if (!selectedCanteen) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <Building2 className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 mb-4" />
              <p className="text-slate-600 dark:text-slate-400">
                Please select a kitchen to manage settings
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Manage your kitchen information, schedules and hardware
            </p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-4 rounded-lg shadow-sm border ${
              message.type === 'success'
                ? 'bg-green-500/10 text-green-600 border-green-500/20'
                : 'bg-red-500/10 text-red-600 border-red-500/20'
            }`}
          >
            {message.text}
          </div>
        )}

        <Tabs defaultValue="general" className="w-full space-y-6">
          <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl h-12 w-full sm:w-auto grid grid-cols-3 sm:flex sm:gap-1">
            <TabsTrigger value="general" className="rounded-lg px-6 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-[#1e1b2e] data-[state=active]:shadow-sm transition-all text-sm font-semibold">General</TabsTrigger>
            {isKitchen && (
              <TabsTrigger value="schedules" className="rounded-lg px-6 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-[#1e1b2e] data-[state=active]:shadow-sm transition-all text-sm font-semibold">Schedules</TabsTrigger>
            )}
            <TabsTrigger value="printer" className="rounded-lg px-6 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-[#1e1b2e] data-[state=active]:shadow-sm transition-all text-sm font-semibold">Printer</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 animate-in fade-in-50 duration-300">

        {/* Canteen Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              Kitchen Information
            </CardTitle>
            <CardDescription>
              Update your kitchen name and logo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Canteen Name */}
            <div className="space-y-2">
              <Label htmlFor="canteen-name">Kitchen Name</Label>
              <Input
                id="canteen-name"
                type="text"
                placeholder="Enter kitchen name"
                value={canteenName}
                onChange={(e) => setCanteenName(e.target.value)}
                className="max-w-md"
              />
            </div>

            {/* Active Status Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="space-y-0.5">
                <Label htmlFor="is-active" className="text-base">Kitchen Active Status</Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Toggle if the kitchen is active and accessible
                </p>
              </div>
              <Switch
                id="is-active"
                checked={isActive}
                onCheckedChange={handleActiveToggle}
              />
            </div>

            {/* Online Status Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="space-y-0.5">
                <Label htmlFor="is-online" className="text-base">Kitchen Online Status</Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Toggle if the kitchen is currently accepting orders
                </p>
              </div>
              <Switch
                id="is-online"
                checked={isOnline}
                onCheckedChange={handleOnlineToggle}
              />
            </div>

            {/* Operating Hours */}
            <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
              <div>
                <Label className="text-base">Operating Hours</Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Set your kitchen opening and closing times (displayed in IST)
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="opening-time">Opening Time</Label>
                  <Input
                    id="opening-time"
                    type="time"
                    value={openingTime}
                    onChange={(e) => setOpeningTime(e.target.value)}
                    className="max-w-md"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closing-time">Closing Time</Label>
                  <Input
                    id="closing-time"
                    type="time"
                    value={closingTime}
                    onChange={(e) => setClosingTime(e.target.value)}
                    className="max-w-md"
                  />
                </div>
              </div>
            </div>

            {/* GST Settings */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
               <div className="space-y-0.5">
                <Label htmlFor="is-gst" className="text-base">Enable GST (5%)</Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Automatically calculate and add 5% tax to orders
                </p>
              </div>
              <Switch
                id="is-gst"
                checked={isGstEnabled}
                onCheckedChange={setIsGstEnabled}
              />
            </div>

            {/* Packaging Fee Settings */}
            <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
              <div>
                <Label className="text-base">Packaging Fee</Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Configure packaging charges for orders
                </p>
              </div>
              
              {/* Packaging Fee Type */}
              <div className="space-y-2">
                <Label htmlFor="packaging-fee-type">Packaging Fee Type</Label>
                <select
                  id="packaging-fee-type"
                  value={packagingFeeType}
                  onChange={(e) => setPackagingFeeType(e.target.value as 'fixed' | 'per-item')}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300 max-w-md"
                >
                  <option value="fixed">Fixed Amount</option>
                  <option value="per-item">Per Item</option>
                </select>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {packagingFeeType === 'fixed' 
                    ? 'Charge a fixed packaging fee per order'
                    : 'Charge packaging fee based on number of items'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Fixed Packaging Fee */}
                <div className="space-y-2">
                  <Label htmlFor="total-packaging-fee">
                    Fixed Packaging Fee (₹)
                  </Label>
                  <Input
                    id="total-packaging-fee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={totalPackagingFee}
                    onChange={(e) => setTotalPackagingFee(e.target.value)}
                    className="max-w-md"
                    disabled={packagingFeeType !== 'fixed'}
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Used when type is "Fixed Amount"
                  </p>
                </div>

                {/* Per Item Packaging Fee */}
                <div className="space-y-2">
                  <Label htmlFor="packaging-fee-per-item">
                    Per Item Fee (₹)
                  </Label>
                  <Input
                    id="packaging-fee-per-item"
                    type="number"
                    step="0.01"
                    min="0"
                    value={packagingFeePerItem}
                    onChange={(e) => setPackagingFeePerItem(e.target.value)}
                    className="max-w-md"
                    disabled={packagingFeeType !== 'per-item'}
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Used when type is "Per Item"
                  </p>
                </div>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="space-y-4">
              <Label>Kitchen Logo</Label>
              
              {/* Logo Preview */}
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 overflow-hidden">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt="Kitchen Logo"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-10 h-10 text-slate-400 dark:text-slate-600" />
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full sm:w-auto"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Logo
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    PNG, JPG or WEBP (max 5MB)
                  </p>
                </div>
              </div>

              {/* Logo URL Input (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="logo-url" className="text-sm">
                  Or enter logo URL
                </Label>
                <Input
                  id="logo-url"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="max-w-md"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                onClick={handleSave}
                disabled={loading || uploading}
                className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save General Settings
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-red-600 dark:text-red-400" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Configure sound and notification preferences for new orders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sound Notification Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sound-enabled" className="text-base flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Order Sound Notifications
                </Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Play a chime sound when new orders arrive
                </p>
              </div>
              <Switch
                id="sound-enabled"
                checked={orderSoundEnabled}
                onCheckedChange={handleSoundToggle}
              />
            </div>
            
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                <strong>Note:</strong> Sound notifications help kitchen staff know when new orders arrive. 
                Make sure your browser allows audio playback. Click anywhere on the page first to enable audio.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Slideshow Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
              Display Slideshow
            </CardTitle>
            <CardDescription>
              Configure slideshow to display on the order board when there are no active orders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable Slideshow Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="slideshow-enabled" className="text-base">Enable Slideshow</Label>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Show slideshow when no orders are active
                </p>
              </div>
              <Switch
                id="slideshow-enabled"
                checked={slideshowEnabled}
                onCheckedChange={setSlideshowEnabled}
              />
            </div>

            {slideshowEnabled && (
              <>
                {/* Slideshow Interval */}
                <div className="space-y-2">
                  <Label htmlFor="slideshow-interval">Default Slide Duration (milliseconds)</Label>
                  <Input
                    id="slideshow-interval"
                    type="number"
                    min="1000"
                    step="1000"
                    placeholder="5000"
                    value={slideshowInterval}
                    onChange={(e) => setSlideshowInterval(parseInt(e.target.value) || 5000)}
                    className="max-w-md"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Current: {slideshowInterval / 1000} seconds per slide (can be overridden per item)
                  </p>
                </div>

                {/* Orders Display Settings */}
                <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                  <Label className="text-base">Orders Display Settings</Label>
                  
                  <div className="space-y-2">
                    <Label htmlFor="orders-display-interval">Show Orders After (milliseconds)</Label>
                    <Input
                      id="orders-display-interval"
                      type="number"
                      min="1000"
                      step="1000"
                      placeholder="10000"
                      value={ordersDisplayInterval}
                      onChange={(e) => setOrdersDisplayInterval(parseInt(e.target.value) || 10000)}
                      className="max-w-md"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      After {ordersDisplayInterval / 1000} seconds of slideshow, orders will be displayed
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orders-display-duration">Orders Display Duration (milliseconds)</Label>
                    <Input
                      id="orders-display-duration"
                      type="number"
                      min="1000"
                      step="1000"
                      placeholder="15000"
                      value={ordersDisplayDuration}
                      onChange={(e) => setOrdersDisplayDuration(parseInt(e.target.value) || 15000)}
                      className="max-w-md"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Orders will be shown for {ordersDisplayDuration / 1000} seconds before returning to slideshow
                    </p>
                  </div>
                </div>

                {/* Slideshow Items List */}
                <div className="space-y-4">
                  <Label>Slideshow Items</Label>
                  
                  {slideshowItems.length > 0 && (
                    <div className="space-y-2">
                      {slideshowItems.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800"
                        >
                          <div className="flex-shrink-0">
                            {item.type === 'image' ? (
                              <ImageIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            ) : (
                              <Youtube className="w-5 h-5 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              {item.title || `${item.type === 'image' ? 'Image' : item.type === 'youtube-playlist' ? 'YouTube Playlist' : 'YouTube Video'} ${index + 1}`}
                              {item.duration && (
                                <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                                  ({item.duration / 1000}s)
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {item.url}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSlideshowItem(index)}
                            className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New Item Form */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 space-y-4">
                    <Label className="text-base">Add New Slide</Label>
                    
                    {/* Type Selection */}
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        type="button"
                        variant={newItemType === 'image' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNewItemType('image')}
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Image
                      </Button>
                      <Button
                        type="button"
                        variant={newItemType === 'youtube' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNewItemType('youtube')}
                      >
                        <Youtube className="w-4 h-4 mr-2" />
                        Video
                      </Button>
                      <Button
                        type="button"
                        variant={newItemType === 'youtube-playlist' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNewItemType('youtube-playlist')}
                      >
                        <Youtube className="w-4 h-4 mr-2" />
                        Playlist
                      </Button>
                    </div>

                    {/* Title Input */}
                    <div className="space-y-2">
                      <Label htmlFor="new-item-title" className="text-sm">
                        Title (optional)
                      </Label>
                      <Input
                        id="new-item-title"
                        type="text"
                        placeholder="e.g., Welcome Banner, Promo Video"
                        value={newItemTitle}
                        onChange={(e) => setNewItemTitle(e.target.value)}
                      />
                    </div>

                    {/* Image Upload or URL Input */}
                    {newItemType === 'image' && (
                      <div className="space-y-3">
                        <Label className="text-sm">Upload Image</Label>
                        <input
                          ref={slideshowFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleSlideshowImageUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => slideshowFileInputRef.current?.click()}
                          disabled={uploadingSlideshow}
                          className="w-full"
                        >
                          {uploadingSlideshow ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Image File
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                          Or enter image URL below
                        </p>
                      </div>
                    )}

                    {/* URL Input */}
                    <div className="space-y-2">
                      <Label htmlFor="new-item-url" className="text-sm">
                        {newItemType === 'image' ? 'Image URL' : newItemType === 'youtube-playlist' ? 'YouTube Playlist URL' : 'YouTube Video URL'}
                      </Label>
                      <Input
                        id="new-item-url"
                        type="url"
                        placeholder={
                          newItemType === 'image'
                            ? 'https://example.com/image.jpg'
                            : newItemType === 'youtube-playlist'
                            ? 'https://www.youtube.com/playlist?list=PLAYLIST_ID'
                            : 'https://www.youtube.com/watch?v=VIDEO_ID'
                        }
                        value={newItemUrl}
                        onChange={(e) => setNewItemUrl(e.target.value)}
                      />
                      {newItemType === 'youtube' && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Paste any YouTube video URL - it will be automatically converted to embed format
                        </p>
                      )}
                      {newItemType === 'youtube-playlist' && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Paste a YouTube playlist URL - videos will play endlessly one after another in loop
                        </p>
                      )}
                    </div>

                    {/* Duration Input - Hidden for playlists */}
                    {newItemType !== 'youtube-playlist' && (
                      <div className="space-y-2">
                        <Label htmlFor="new-item-duration" className="text-sm">
                          Custom Duration (optional, milliseconds)
                        </Label>
                        <Input
                          id="new-item-duration"
                          type="number"
                          min="1000"
                          step="1000"
                          placeholder="Use default duration"
                          value={newItemDuration}
                          onChange={(e) => setNewItemDuration(e.target.value ? parseInt(e.target.value) : '')}
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Leave empty to use default slide duration. Useful for videos with specific length.
                        </p>
                      </div>
                    )}
                    {newItemType === 'youtube-playlist' && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-400">
                          <strong>Note:</strong> Playlists will play continuously and loop endlessly. Videos will play one after another automatically.
                        </p>
                      </div>
                    )}

                    {/* Add Button */}
                    <Button
                      type="button"
                      onClick={handleAddSlideshowItem}
                      className="w-full"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Slideshow
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

          </TabsContent>

          {isKitchen && (
            <TabsContent value="schedules" className="animate-in fade-in-50 duration-300">
              <ScheduleManagement />
            </TabsContent>
          )}

          <TabsContent value="printer" className="animate-in fade-in-50 duration-300">
            <PrinterSettings />
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}
