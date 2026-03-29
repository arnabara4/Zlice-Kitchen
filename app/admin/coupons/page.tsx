'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Tag, Search, Calendar, Percent, Gift, AlertCircle, Building2, Bike } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Canteen {
  id: string;
  name: string;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
}


interface Coupon {
  id: string;
  canteen_id: string;
  code: string;
  name: string;
  type: 'PERCENTAGE' | 'FLAT' | 'BOGO' | 'FREE_DELIVERY' | 'FREE_ITEM';
  description: string;
  tagline: string;
  aura_cost: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
  conditions: any[];
  rewards: any[];
}

export default function SuperAdminCouponsPage() {
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [selectedCanteenId, setSelectedCanteenId] = useState<string>('');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all canteens on mount
  useEffect(() => {
    const fetchCanteens = async () => {
        try {
            const response = await fetch('/api/canteens');
            if (!response.ok) throw new Error('Failed to fetch kitchens');
            const data = await response.json();
            
            setCanteens(data || []);
            if (data && data.length > 0) {
                setSelectedCanteenId(data[0].id);
            }
        } catch (error) {
            console.error('Error fetching kitchens:', error);
            toast.error('Failed to load kitchens');
        }
    };
    fetchCanteens();
  }, []);

  // Fetch coupons when canteen selection changes
  useEffect(() => {
    if (selectedCanteenId) {
      fetchCoupons();
      fetchMenuItems();
    }
  }, [selectedCanteenId]);

  const fetchMenuItems = async () => {
    if (!selectedCanteenId) return;
    try {
        const response = await fetch('/api/menu');
        if (!response.ok) throw new Error('Failed to fetch menu items');
        const data = await response.json();
        setMenuItems(data || []);
    } catch (error) {
        console.error('Error fetching menu items:', error);
        toast.error('Failed to load menu items');
    }
  };

  const fetchCoupons = async () => {
    if (!selectedCanteenId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/coupons?canteen_id=${selectedCanteenId}`);
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);
      
      setCoupons(data.coupons || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultDates = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 7);
    
    const toLocalISO = (date: Date) => {
        const offset = date.getTimezoneOffset() * 60000;
        return (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
    };

    return {
      valid_from: toLocalISO(now),
      valid_until: toLocalISO(tomorrow),
    };
  };

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'PERCENTAGE',
    description: '',
    tagline: '',
    aura_cost: '0',
    discount_value: '',
    selected_item_id: '',
    min_order_value: '',
    ...getDefaultDates(),
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.type !== 'FREE_DELIVERY' && formData.type !== 'FREE_ITEM' && !formData.discount_value) {
        toast.error('Please fill in required fields');
        return;
    }

    let rewards = [];
    let dbType = 'percentage';

    if (formData.type === 'PERCENTAGE') {
        rewards.push({ type: 'PERCENTAGE_DISCOUNT', value: parseFloat(formData.discount_value) });
        dbType = 'percentage';
    } else if (formData.type === 'FLAT') {
        rewards.push({ type: 'FLAT_DISCOUNT', value: parseFloat(formData.discount_value) });
        dbType = 'flat';
    } else if (formData.type === 'FREE_DELIVERY') {
        rewards.push({ type: 'FREE_DELIVERY' });
        dbType = 'free_delivery';
    } else {
        if (!formData.selected_item_id) {
            toast.error('Please select a free item');
            return;
        }
        rewards.push({ type: 'FREE_ITEM', item_id: formData.selected_item_id }); 
        dbType = 'free_item';
    }

    let conditions = [];
    if (formData.min_order_value) {
        conditions.push({ type: 'MIN_ORDER_VALUE', value: parseFloat(formData.min_order_value) });
    }

    const payload = {
        canteen_id: selectedCanteenId,
        code: formData.code.toUpperCase(),
        name: formData.name,
        type: dbType,
        description: formData.description,
        tagline: formData.tagline,
        aura_cost: parseInt(formData.aura_cost) || 0,
        valid_from: new Date(formData.valid_from).toISOString(),
        valid_until: new Date(formData.valid_until).toISOString(),
        is_active: formData.is_active,
        rewards,
        conditions
    };

    try {
      const url = editingCoupon ? `/api/coupons?id=${editingCoupon.id}` : '/api/coupons';
      const method = editingCoupon ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save coupon');
      }

      toast.success(editingCoupon ? 'Coupon updated' : 'Coupon created');
      setShowDialog(false);
      resetForm();
      fetchCoupons();
    } catch (error: any) {
      console.error('Error saving coupon:', error);
      toast.error(error.message || 'Failed to save coupon');
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    
    // Map DB type to UI type
    let uiType = 'PERCENTAGE';
    const typeStr = coupon.type as string; // Cast to string to handle DB lowercase values
    if (typeStr === 'flat' || typeStr === 'FLAT') uiType = 'FLAT';
    else if (typeStr === 'percentage' || typeStr === 'PERCENTAGE') uiType = 'PERCENTAGE';
    else if (typeStr === 'free_delivery' || typeStr === 'FREE_DELIVERY') uiType = 'FREE_DELIVERY';
    else if (typeStr === 'free_item' || typeStr === 'FREE_ITEM') uiType = 'FREE_ITEM';
    
    // Extract discount value from rewards
    let discountVal = '';
    const outputReward = coupon.rewards?.[0];
    if (outputReward && uiType !== 'FREE_DELIVERY') {
        const val = outputReward.value;
        if (typeof val === 'object' && val !== null && 'amount' in val) {
            discountVal = val.amount.toString();
        } else {
            discountVal = val?.toString() || '';
        }
    }

    // Extract selected item for FREE_ITEM
    let selectedItem = '';
    if (uiType === 'FREE_ITEM' && coupon.rewards?.[0]) {
        selectedItem = coupon.rewards[0].item_id || '';
    }

    // Extract min order from conditions
    let minOrderVal = '';
    const minOrderCond = coupon.conditions?.find((c: any) => c.type === 'MIN_ORDER_VALUE');
    if (minOrderCond) {
        const val = minOrderCond.value;
        if (typeof val === 'object' && val !== null && 'amount' in val) {
            minOrderVal = val.amount.toString();
        } else {
            minOrderVal = val?.toString() || '';
        }
    }

    const toLocalInput = (dateStr: string) => {
        const date = new Date(dateStr);
        const offset = date.getTimezoneOffset() * 60000;
        return (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
    }

    setFormData({
      code: coupon.code,
      name: coupon.name,
      type: uiType as any,
      description: coupon.description || '',
      tagline: coupon.tagline || '',
      aura_cost: coupon.aura_cost.toString(),
      discount_value: discountVal,
      selected_item_id: selectedItem,
      min_order_value: minOrderVal,
      valid_from: toLocalInput(coupon.valid_from),
      valid_until: toLocalInput(coupon.valid_until),
      is_active: coupon.is_active,
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const response = await fetch(`/api/coupons?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete coupon');

      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Failed to delete coupon');
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    try {
      const response = await fetch(`/api/coupons?id=${coupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: !coupon.is_active,
        }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast.success(`Coupon ${!coupon.is_active ? 'activated' : 'deactivated'}`);
      fetchCoupons();
    } catch (error) {
        toast.error('Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      type: 'PERCENTAGE',
      description: '',
      tagline: '',
      aura_cost: '0',
      discount_value: '',
      selected_item_id: '',
      min_order_value: '',
      ...getDefaultDates(),
      is_active: true,
    });
    setEditingCoupon(null);
  };

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kitchen Coupons Management</h1>
          <p className="text-muted-foreground mt-1">Super Admin control for all kitchen coupons.</p>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="min-w-[200px]">
                <Select value={selectedCanteenId} onValueChange={setSelectedCanteenId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Kitchen" />
                    </SelectTrigger>
                    <SelectContent>
                        {canteens.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Dialog open={showDialog} onOpenChange={(open) => {
                setShowDialog(open);
                if(!open) resetForm();
            }}>
                <DialogTrigger asChild>
                    <Button className="gap-2" disabled={!selectedCanteenId}>
                    <Plus className="w-5 h-5" />
                    Create Coupon
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                    <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</DialogTitle>
                    </DialogHeader>
                    
                    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                        {/* Identical form to offers page */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="code">Coupon Code *</Label>
                            <div className="relative">
                                <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    id="code" 
                                    className="pl-9 font-mono uppercase" 
                                    placeholder="SAVE20" 
                                    value={formData.code}
                                    onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                    maxLength={15}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Internal Name *</Label>
                            <Input 
                                id="name" 
                                placeholder="Summer Sale 2024"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Details</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <Input 
                                placeholder="Public Tagline (e.g. 'Get 20% off!')"
                                value={formData.tagline}
                                onChange={e => setFormData({...formData, tagline: e.target.value})}
                            />
                            <Input 
                                placeholder="Internal Description"
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select 
                                value={formData.type} 
                                onValueChange={(val: any) => setFormData({...formData, type: val})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                                    <SelectItem value="FLAT">Flat Amount (₹)</SelectItem>
                                    <SelectItem value="FREE_DELIVERY">Free Delivery</SelectItem>
                                    <SelectItem value="FREE_ITEM">Free Item</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {formData.type === 'FREE_ITEM' ? (
                            <div className="space-y-2">
                                <Label>Select Free Item *</Label>
                                <Select 
                                    value={formData.selected_item_id} 
                                    onValueChange={(val) => setFormData({...formData, selected_item_id: val})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an item" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {menuItems.map(item => (
                                            <SelectItem key={item.id} value={item.id}>
                                                {item.name} (₹{item.price})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : formData.type !== 'FREE_DELIVERY' && (
                        <div className="space-y-2">
                            <Label>{formData.type === 'PERCENTAGE' ? 'Discount %' : 'Amount ₹'} *</Label>
                            <Input 
                                type="number"
                                placeholder="0"
                                value={formData.discount_value}
                                onChange={e => setFormData({...formData, discount_value: e.target.value})}
                            />
                        </div>
                        )}
                        <div className="space-y-2">
                            <Label>Min. Order Value (₹)</Label>
                            <Input 
                                type="number"
                                placeholder="Optional"
                                value={formData.min_order_value}
                                onChange={e => setFormData({...formData, min_order_value: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Aura Cost (Points to redeem)</Label>
                        <Input 
                            type="number"
                            value={formData.aura_cost}
                            onChange={e => setFormData({...formData, aura_cost: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Valid From</Label>
                            <Input 
                                type="datetime-local"
                                value={formData.valid_from}
                                onChange={e => setFormData({...formData, valid_from: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Valid Until</Label>
                            <Input 
                                type="datetime-local"
                                value={formData.valid_until}
                                onChange={e => setFormData({...formData, valid_until: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="active" 
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={formData.is_active}
                            onChange={e => setFormData({...formData, is_active: e.target.checked})}
                        />
                        <Label htmlFor="active" className="cursor-pointer">Enable this coupon immediately</Label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" type="button" onClick={() => setShowDialog(false)}>Cancel</Button>
                        <Button type="submit">{editingCoupon ? 'Save Changes' : 'Create Coupon'}</Button>
                    </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
      </div>

      {!selectedCanteenId ? (
          <div className="flex items-center justify-center h-[50vh] border-2 border-dashed rounded-xl bg-muted/20">
              <div className="text-center">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground font-medium">Select a kitchen to manage coupons</p>
              </div>
          </div>
      ) : (
          <>
            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                    className="pl-9 max-w-sm" 
                    placeholder="Search coupons..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="text-center py-20 text-muted-foreground">Loading coupons...</div>
            ) : filteredCoupons.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed rounded-xl">
                    <Gift className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No coupons found for this kitchen</h3>
                    <p className="text-muted-foreground mb-4">Create the first one now!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCoupons.map((coupon) => (
                        <CouponCard 
                            key={coupon.id} 
                            coupon={coupon} 
                            onEdit={handleEdit} 
                            onDelete={handleDelete}
                            onToggle={toggleActive}
                        />
                    ))}
                </div>
            )}
          </>
      )}
    </div>
  );
}

function CouponCard({ coupon, onEdit, onDelete, onToggle }: { 
    coupon: Coupon, 
    onEdit: (c: Coupon) => void, 
    onDelete: (id: string) => void,
    onToggle: (c: Coupon) => void
}) {
    const isExpired = new Date(coupon.valid_until) < new Date();
    const isActive = coupon.is_active && !isExpired;
    
    // Find discount details
    const reward = coupon.rewards?.[0] || {};
    const condition = coupon.conditions?.find(c => c.type === 'MIN_ORDER_VALUE');

    // Helper to safely get value
    const getValue = (val: any) => {
        if (typeof val === 'object' && val !== null) {
            if ('amount' in val) return val.amount;
            // unexpected object, return stringified or first value to avoid crash
            return JSON.stringify(val); 
        }
        return val;
    };

    const rewardValue = getValue(reward.value);
    const conditionValue = condition ? getValue(condition.value) : null;

    return (
        <Card className={`relative overflow-hidden transition-all hover:shadow-md ${!isActive ? 'opacity-75 grayscale-[0.5]' : ''}`}>
             <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-xl ${
                isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
                {isActive ? 'ACTIVE' : isExpired ? 'EXPIRED' : 'INACTIVE'}
            </div>
            
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <Badge variant="outline" className="mb-2 font-mono tracking-wider">{coupon.code}</Badge>
                        <CardTitle className="text-lg leading-tight">{coupon.name}</CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pb-2">
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        {reward.type === 'PERCENTAGE_DISCOUNT' ? <Percent className="h-5 w-5" /> : reward.type === 'FREE_DELIVERY' ? <Bike className="h-5 w-5" /> : reward.type === 'FREE_ITEM' ? <Gift className="h-5 w-5" /> : '₹'}
                    </div>
                    <div>
                        <p className="font-bold text-2xl">
                            {reward.type === 'FREE_DELIVERY' ? 'FREE DELIVERY' : reward.type === 'FREE_ITEM' ? 'FREE ITEM' : <>{rewardValue}{reward.type === 'PERCENTAGE_DISCOUNT' ? '%' : ''} OFF</>}
                        </p>
                        {condition && <p className="text-xs text-muted-foreground">Min. Order: ₹{conditionValue}</p>}
                    </div>
                </div>
                
                <div className="space-y-1 text-sm bg-muted/50 p-3 rounded-lg">
                    {coupon.tagline && (
                        <p className="italic text-muted-foreground">"{coupon.tagline}"</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                        <Calendar className="h-3 w-3" />
                        <span>Valid until {format(new Date(coupon.valid_until), 'PP')}</span>
                    </div>
                     <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <AlertCircle className="h-3 w-3" />
                         <span>Cost: {coupon.aura_cost} Aura</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="pt-2 flex justify-end gap-2 border-t mt-2">
                 <Button size="sm" variant="ghost" onClick={() => onToggle(coupon)}>
                    {coupon.is_active ? 'Disable' : 'Enable'}
                 </Button>
                 <Button size="icon" variant="ghost" onClick={() => onEdit(coupon)}>
                    <Edit2 className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => onDelete(coupon.id)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}
