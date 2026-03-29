'use client';

import { useEffect, useState } from 'react';
import { useCanteen } from '@/lib/canteen-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Tag, Search, Calendar, CheckCircle, XCircle, Percent, Gift, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Coupon {
  id: string;
  canteen_id: string;
  code: string;
  name: string;
  type: 'PERCENTAGE' | 'FLAT' | 'BOGO';
  description: string;
  tagline: string;
  aura_cost: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
  conditions: any[]; // You can refine this if needed
  rewards: any[];    // You can refine this if needed
}

export default function OffersPage() {
  const { selectedCanteen } = useCanteen();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (selectedCanteen) {
      fetchCoupons();
    }
  }, [selectedCanteen]);

  const fetchCoupons = async () => {
    if (!selectedCanteen) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/coupons?canteen_id=${selectedCanteen.id}`);
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

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!selectedCanteen) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">No Canteen Selected</h2>
            <p className="text-muted-foreground">Please select a canteen to view coupons.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Canteen Coupons</h1>
          <p className="text-muted-foreground mt-1">View active discount codes and special offers.</p>
        </div>
        {/* Creation handled by Super Admin now */}
      </div>

      {/* Search & Filter Bar could go here */}
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
            <h3 className="text-lg font-medium">No coupons found</h3>
            <p className="text-muted-foreground mb-4">There are currently no active offers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCoupons.map((coupon) => (
                <CouponCard 
                    key={coupon.id} 
                    coupon={coupon} 
                />
            ))}
        </div>
      )}
    </div>
  );
}

function CouponCard({ coupon }: { coupon: Coupon }) {
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
                        {reward.type === 'PERCENTAGE_DISCOUNT' ? <Percent className="h-5 w-5" /> : '₹'}
                    </div>
                    <div>
                        <p className="font-bold text-2xl">
                            {rewardValue}{reward.type === 'PERCENTAGE_DISCOUNT' ? '%' : ''} OFF
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
            {/* Read-only view for canteens - no actions */}
        </Card>
    );
}
