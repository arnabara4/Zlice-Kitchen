'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { CanteenSettlementRow } from '@/types/analytics';

const PREDEFINED_REASONS = [
  "Refund",
  "Delivery Rider Cost",
  "Penalty",
  "Adjustment",
  "Setup Fee",
  "Other"
];

const chargeFormSchema = z.object({
  chargeType: z.enum(['GLOBAL_MISC', 'CANTEEN_DISTRIBUTED']),
  canteenId: z.string().optional(),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  reason: z.string().min(1, 'Please select a reason'),
  customReason: z.string().optional(),
}).refine(data => {
  if (data.chargeType === 'CANTEEN_DISTRIBUTED' && !data.canteenId) {
    return false;
  }
  return true;
}, {
  message: "Kitchen is required for distributed charges",
  path: ["canteenId"],
}).refine(data => {
  if (data.reason === 'Other' && (!data.customReason || data.customReason.trim().length < 3)) {
    return false;
  }
  return true;
}, {
  message: "Please provide a specific reason for 'Other'",
  path: ["customReason"],
});

type ChargeFormValues = z.infer<typeof chargeFormSchema>;

interface AddChargeModalProps {
  canteens: Array<{ id: string; name: string }>;
  onChargeAdded: () => void;
  trigger?: React.ReactNode;
}

export function AddChargeModal({ canteens, onChargeAdded, trigger }: AddChargeModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ChargeFormValues>({
    resolver: zodResolver(chargeFormSchema),
    defaultValues: {
      chargeType: 'CANTEEN_DISTRIBUTED',
      amount: 0,
      reason: '',
      customReason: '',
      canteenId: undefined,
    },
  });

  const chargeType = form.watch("chargeType");
  const selectedReason = form.watch("reason");

  const onSubmit = async (data: ChargeFormValues) => {
    if (isSubmitting) return; // Prevent double submission
    
    try {
      setIsSubmitting(true);
      const finalReason = data.reason === 'Other' ? data.customReason : data.reason;
      
      const response = await fetch('/api/admin/charges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          charge_type: data.chargeType,
          charge_amount: data.amount,
          charge_reason: finalReason,
          canteen_id: data.chargeType === 'CANTEEN_DISTRIBUTED' ? data.canteenId : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add charge');
      }

      toast.success('Charge added successfully');
      setOpen(false);
      form.reset();
      onChargeAdded(); // Refresh data

    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
          onClick={() => setOpen(true)}
        >
          <PlusCircle className="w-4 h-4" />
          Add Charge
        </Button>
      )}
      
      <DialogContent className="sm:max-w-[425px] bg-slate-950 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>Add New Charge</DialogTitle>
          <DialogDescription className="text-slate-400">
            Apply a charge to a specific kitchen or a global miscellaneous charge.
          </DialogDescription>
        </DialogHeader>
 
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="chargeType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Charge Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-slate-900 border-slate-800">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                      <SelectItem value="CANTEEN_DISTRIBUTED">Kitchen (Distributed)</SelectItem>
                      <SelectItem value="GLOBAL_MISC">Global / Miscellaneous</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-slate-500">
                    Kitchen charges reduce the payable amount for that kitchen.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
 
            {chargeType === 'CANTEEN_DISTRIBUTED' && (
              <FormField
                control={form.control}
                name="canteenId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Kitchen</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-900 border-slate-800">
                          <SelectValue placeholder="Select a kitchen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-900 border-slate-800 text-white">
                        {canteens.map((canteen) => (
                          <SelectItem key={canteen.id} value={canteen.id}>
                            {canteen.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
 
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (₹)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      className="bg-slate-900 border-slate-800"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
 
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-slate-900 border-slate-800">
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                      {PREDEFINED_REASONS.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedReason === 'Other' && (
              <FormField
                control={form.control}
                name="customReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specify Reason</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter custom reason" 
                        className="bg-slate-900 border-slate-800"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
 
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-slate-800 text-slate-300">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className={`bg-red-600 hover:bg-red-700 text-white ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Charge
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
