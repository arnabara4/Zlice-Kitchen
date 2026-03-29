'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface Canteen {
  id: string;
  name: string;
  logo_url: string | null;
}

interface DeliveryManFormProps {
  deliveryMan?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function DeliveryManForm({ deliveryMan, onSuccess, onCancel }: DeliveryManFormProps) {
  const [loading, setLoading] = useState(false);
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [selectedCanteens, setSelectedCanteens] = useState<string[]>(() => {
    if (deliveryMan?.assigned_canteens) {
      return deliveryMan.assigned_canteens.map((ac: any) => ac.canteen_id);
    }
    return [];
  });
  const [canteenEarningVisibility, setCanteenEarningVisibility] = useState<Record<string, boolean>>(() => {
    if (deliveryMan?.assigned_canteens) {
      const visibility: Record<string, boolean> = {};
      deliveryMan.assigned_canteens.forEach((ac: any) => {
        visibility[ac.canteen_id] = ac.is_earning_visible ?? true;
      });
      return visibility;
    }
    return {};
  });
  const [form, setForm] = useState(() => {
    if (deliveryMan) {
      return {
        name: deliveryMan.name || '',
        phone: deliveryMan.phone || '',
        password: '',
        address: deliveryMan.address || '',
        vehicle_type: deliveryMan.vehicle_type || '',
        vehicle_number: deliveryMan.vehicle_number || '',
        id_proof_type: deliveryMan.id_proof_type || '',
        id_proof_number: deliveryMan.id_proof_number || '',
        emergency_contact_name: deliveryMan.emergency_contact_name || '',
        emergency_contact_phone: deliveryMan.emergency_contact_phone || '',
        is_active: deliveryMan.is_active ?? true,
        is_earning_visible: deliveryMan.is_earning_visible ?? true,
      };
    }
    return {
      name: '',
      phone: '',
      password: '',
      address: '',
      vehicle_type: '',
      vehicle_number: '',
      id_proof_type: '',
      id_proof_number: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      is_active: true,
      is_earning_visible: true,
    };
  });

  // Fetch canteens on mount
  useEffect(() => {
    fetchCanteens();
  }, []);

  const fetchCanteens = async () => {
    try {
      const response = await fetch('/api/canteens');
      if (!response.ok) throw new Error('Failed to fetch canteens');
      const data = await response.json();
      setCanteens(data.filter((c: Canteen & { is_active: boolean }) => c.is_active));
    } catch (error) {
      console.error('Error fetching canteens:', error);
    }
  };

  const toggleCanteen = (canteenId: string) => {
    setSelectedCanteens(prev => {
      const isCurrentlySelected = prev.includes(canteenId);
      if (isCurrentlySelected) {
        // Remove canteen
        setCanteenEarningVisibility(prevVisibility => {
          const newVisibility = { ...prevVisibility };
          delete newVisibility[canteenId];
          return newVisibility;
        });
        return prev.filter(id => id !== canteenId);
      } else {
        // Add canteen with default visibility true
        setCanteenEarningVisibility(prevVisibility => ({
          ...prevVisibility,
          [canteenId]: true
        }));
        return [...prev, canteenId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        ...form,
        canteens: selectedCanteens.map(canteenId => ({
          canteen_id: canteenId,
          is_earning_visible: canteenEarningVisibility[canteenId] ?? true
        })),
        ...(deliveryMan && { id: deliveryMan.id }),
      };

      const method = deliveryMan ? 'PUT' : 'POST';

      const response = await fetch('/api/delivery-man', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save delivery man');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving delivery man:', error);
      alert(error instanceof Error ? error.message : 'Failed to save delivery man');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground">Basic Information</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="Enter full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
              placeholder="Enter phone number"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">
            Password {deliveryMan ? '(Leave blank to keep current)' : '*'}
          </Label>
          <Input
            id="password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required={!deliveryMan}
            placeholder="Enter password"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Enter complete address"
            rows={2}
          />
        </div>
      </div>

      {/* Vehicle Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground">Vehicle Information</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="vehicle_type">Vehicle Type</Label>
            <Select
              value={form.vehicle_type || undefined}
              onValueChange={(value) => setForm({ ...form, vehicle_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bike">Bike</SelectItem>
                <SelectItem value="scooter">Scooter</SelectItem>
                <SelectItem value="bicycle">Bicycle</SelectItem>
                <SelectItem value="car">Car</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle_number">Vehicle Number</Label>
            <Input
              id="vehicle_number"
              value={form.vehicle_number}
              onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })}
              placeholder="e.g., DL 01 AB 1234"
            />
          </div>
        </div>
      </div>

      {/* ID Proof Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground">ID Proof</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="id_proof_type">ID Proof Type</Label>
            <Select
              value={form.id_proof_type || undefined}
              onValueChange={(value) => setForm({ ...form, id_proof_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select ID proof type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aadhar">Aadhar Card</SelectItem>
                <SelectItem value="pan">PAN Card</SelectItem>
                <SelectItem value="driving_license">Driving License</SelectItem>
                <SelectItem value="voter_id">Voter ID</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="id_proof_number">ID Proof Number</Label>
            <Input
              id="id_proof_number"
              value={form.id_proof_number}
              onChange={(e) => setForm({ ...form, id_proof_number: e.target.value })}
              placeholder="Enter ID proof number"
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground">Emergency Contact</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergency_contact_name">Contact Name</Label>
            <Input
              id="emergency_contact_name"
              value={form.emergency_contact_name}
              onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })}
              placeholder="Enter contact name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
            <Input
              id="emergency_contact_phone"
              value={form.emergency_contact_phone}
              onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })}
              placeholder="Enter contact phone"
            />
          </div>
        </div>
      </div>

      {/* Canteen Assignments */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground">Canteen Assignments</h3>
        
        <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-3">
          {canteens.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active canteens available</p>
          ) : (
            canteens.map((canteen) => (
              <div key={canteen.id} className="space-y-2">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={`canteen-${canteen.id}`}
                    checked={selectedCanteens.includes(canteen.id)}
                    onCheckedChange={() => toggleCanteen(canteen.id)}
                  />
                  <label
                    htmlFor={`canteen-${canteen.id}`}
                    className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                  >
                    {canteen.logo_url && (
                      <img
                        src={canteen.logo_url}
                        alt={canteen.name}
                        className="w-6 h-6 rounded object-cover"
                      />
                    )}
                    {canteen.name}
                  </label>
                </div>
                {selectedCanteens.includes(canteen.id) && (
                  <div className="ml-9 flex items-center space-x-2">
                    <Checkbox
                      id={`earning-${canteen.id}`}
                      checked={canteenEarningVisibility[canteen.id] ?? true}
                      onCheckedChange={(checked) => setCanteenEarningVisibility(prev => ({
                        ...prev,
                        [canteen.id]: checked as boolean
                      }))}
                    />
                    <label
                      htmlFor={`earning-${canteen.id}`}
                      className="text-xs text-muted-foreground cursor-pointer"
                    >
                      Show earnings to the canteen
                    </label>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Select canteens this delivery person can deliver for
        </p>
      </div>

      {/* Status */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground">Settings</h3>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_active"
            checked={form.is_active}
            onCheckedChange={(checked) => setForm({ ...form, is_active: checked as boolean })}
          />
          <label
            htmlFor="is_active"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Active (Can accept deliveries)
          </label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="is_earning_visible"
            checked={form.is_earning_visible}
            onCheckedChange={(checked) => setForm({ ...form, is_earning_visible: checked as boolean })}
          />
          <div>
            <label
              htmlFor="is_earning_visible"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Show Earnings to Partner
            </label>
            <p className="text-xs text-muted-foreground mt-1">
              When enabled, delivery partner can view their earnings and delivery history. This is a global setting that affects all canteens.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {deliveryMan ? 'Update' : 'Create'} Delivery Person
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
