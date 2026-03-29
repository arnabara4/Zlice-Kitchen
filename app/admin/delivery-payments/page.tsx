'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Wallet, 
  Search, 
  Phone, 
  Bike, 
  IndianRupee, 
  CheckCircle, 
  Clock,
  Calendar as CalendarIcon,
  CreditCard,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface DeliveryMan {
  id: string;
  name: string;
  phone: string;
  vehicle_type: string | null;
  totalEarned: number;
  totalPaid: number;
  pendingPayment: number;
  deliveryCount: number;
}

interface Payment {
  id: string;
  amount: number;
  paid_at: string;
  payment_method: string | null;
  transaction_reference: string | null;
  covered_period: string | null;
  notes: string | null;
  paid_by_name: string | null;
}

export default function DeliveryPaymentsPage() {
  const [deliveryMen, setDeliveryMen] = useState<DeliveryMan[]>([]);
  const [filteredDeliveryMen, setFilteredDeliveryMen] = useState<DeliveryMan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeliveryMan, setSelectedDeliveryMan] = useState<DeliveryMan | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Payment form
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [transactionReference, setTransactionReference] = useState('');
  const [coveredPeriod, setCoveredPeriod] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const getIndianDate = () => {
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  };

  useEffect(() => {
    fetchDeliveryMen();
  }, []);

  // Refetch when date filters change
  useEffect(() => {
    if (!loading) {
      setLoading(true);
      fetchDeliveryMen();
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDeliveryMen(deliveryMen);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = deliveryMen.filter(
        (dm) =>
          dm.name.toLowerCase().includes(query) ||
          dm.phone.includes(query)
      );
      setFilteredDeliveryMen(filtered);
    }
  }, [searchQuery, deliveryMen]);

  const fetchDeliveryMen = async () => {
    try {
      // Build API URL with date filters if provided
      const url = new URL('/api/delivery-man/payments/summary', window.location.origin);
      
      if (startDate) {
        // Convert Indian date to UTC for API
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const day = String(startDate.getDate()).padStart(2, '0');
        const istStartStr = `${year}-${month}-${day}T00:00:00.000+05:30`;
        const startDateUTC = new Date(istStartStr);
        url.searchParams.set('startDate', startDateUTC.toISOString());
      }
      
      if (endDate) {
        // Convert Indian date to UTC for API (end of day)
        const year = endDate.getFullYear();
        const month = String(endDate.getMonth() + 1).padStart(2, '0');
        const day = String(endDate.getDate()).padStart(2, '0');
        const istEndStr = `${year}-${month}-${day}T23:59:59.999+05:30`;
        const endDateUTC = new Date(istEndStr);
        url.searchParams.set('endDate', endDateUTC.toISOString());
      }

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to fetch delivery men');
      const data = await response.json();
      setDeliveryMen(data);
      setFilteredDeliveryMen(data);
    } catch (error) {
      console.error('Error fetching delivery men:', error);
      toast.error('Failed to load delivery personnel');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async (deliveryManId: string) => {
    setLoadingHistory(true);
    try {
      const response = await fetch(`/api/delivery-man/payments/history?deliveryManId=${deliveryManId}`);
      if (!response.ok) throw new Error('Failed to fetch payment history');
      const data = await response.json();
      setPaymentHistory(data);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      toast.error('Failed to load payment history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handlePayClick = (deliveryMan: DeliveryMan) => {
    setSelectedDeliveryMan(deliveryMan);
    setPaymentAmount(deliveryMan.pendingPayment.toString());
    setIsPaymentDialogOpen(true);
  };

  const handleViewHistory = async (deliveryMan: DeliveryMan) => {
    setSelectedDeliveryMan(deliveryMan);
    setIsHistoryDialogOpen(true);
    await fetchPaymentHistory(deliveryMan.id);
  };

  const handleSubmitPayment = async () => {
    if (!selectedDeliveryMan || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/delivery-man/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryManId: selectedDeliveryMan.id,
          amount: parseFloat(paymentAmount),
          paymentMethod,
          transactionReference: transactionReference || null,
          coveredPeriod: coveredPeriod || null,
          notes: notes || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to record payment');
      }

      toast.success('Payment recorded successfully!');
      setIsPaymentDialogOpen(false);
      resetForm();
      fetchDeliveryMen(); // Refresh the list
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setPaymentAmount('');
    setPaymentMethod('cash');
    setTransactionReference('');
    setCoveredPeriod('');
    setNotes('');
    setSelectedDeliveryMan(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  // Calculate totals
  const totalStats = {
    totalEarned: deliveryMen.reduce((sum, dm) => sum + dm.totalEarned, 0),
    totalPaid: deliveryMen.reduce((sum, dm) => sum + dm.totalPaid, 0),
    totalPending: deliveryMen.reduce((sum, dm) => sum + dm.pendingPayment, 0),
    totalDeliveryMen: deliveryMen.length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Delivery Payments
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage payments to delivery personnel
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Earned</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(totalStats.totalEarned)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Paid</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(totalStats.totalPaid)}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Pending Payment</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {formatCurrency(totalStats.totalPending)}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Delivery Personnel</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {totalStats.totalDeliveryMen}
                  </p>
                </div>
                <Bike className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Date Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {/* Start Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 text-xs"
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {startDate ? format(startDate, "dd MMM yyyy") : "Start Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50" align="start">
              <CalendarComponent
                mode="single"
                selected={startDate}
                onSelect={(date) => {
                  setStartDate(date);
                }}
                disabled={(date) => date > getIndianDate()}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* End Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 text-xs"
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {endDate ? format(endDate, "dd MMM yyyy") : "End Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50" align="start">
              <CalendarComponent
                mode="single"
                selected={endDate}
                onSelect={(date) => {
                  setEndDate(date);
                }}
                disabled={(date) => {
                  if (date > getIndianDate()) return true;
                  if (startDate && date < startDate) return true;
                  return false;
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Clear Filters Button */}
          {(startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-3 text-xs"
              onClick={() => {
                setStartDate(undefined);
                setEndDate(undefined);
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Delivery Men List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDeliveryMen.map((deliveryMan) => (
            <Card key={deliveryMan.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                      <Bike className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{deliveryMan.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 text-xs">
                        <Phone className="w-3 h-3" />
                        {deliveryMan.phone}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <p className="text-xs text-slate-600 dark:text-slate-400">Deliveries</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {deliveryMan.deliveryCount}
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-xs text-green-600 dark:text-green-400">Total Earned</p>
                      <p className="font-semibold text-green-700 dark:text-green-300">
                        {formatCurrency(deliveryMan.totalEarned)}
                      </p>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-blue-600 dark:text-blue-400">Total Paid</span>
                      <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                        {formatCurrency(deliveryMan.totalPaid)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                        Pending
                      </span>
                      <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                        {formatCurrency(deliveryMan.pendingPayment)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handlePayClick(deliveryMan)}
                      disabled={deliveryMan.pendingPayment <= 0}
                      className="flex-1"
                      size="sm"
                    >
                      <Wallet className="w-4 h-4 mr-2" />
                      Pay Now
                    </Button>
                    <Button
                      onClick={() => handleViewHistory(deliveryMan)}
                      variant="outline"
                      size="sm"
                    >
                      <CalendarIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredDeliveryMen.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Bike className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No delivery personnel found
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {searchQuery ? 'Try a different search term' : 'No delivery personnel available'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record payment to {selectedDeliveryMan?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transactionRef">Transaction Reference</Label>
              <Input
                id="transactionRef"
                placeholder="UPI ID, Cheque No., etc."
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coveredPeriod">Covered Period</Label>
              <Input
                id="coveredPeriod"
                placeholder="e.g., Week of Jan 15-21"
                value={coveredPeriod}
                onChange={(e) => setCoveredPeriod(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsPaymentDialogOpen(false);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitPayment} disabled={isSubmitting}>
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment History</DialogTitle>
            <DialogDescription>
              Payment history for {selectedDeliveryMan?.name}
            </DialogDescription>
          </DialogHeader>

          {loadingHistory ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Loading history...</p>
            </div>
          ) : paymentHistory.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600 dark:text-slate-400">No payment history</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentHistory.map((payment) => (
                <Card key={payment.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-1">
                          <CalendarIcon className="w-3 h-3" />
                          {formatDate(payment.paid_at)}
                        </p>
                      </div>
                      {payment.payment_method && (
                        <Badge variant="outline" className="capitalize">
                          <CreditCard className="w-3 h-3 mr-1" />
                          {payment.payment_method.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>

                    {(payment.transaction_reference || payment.covered_period || payment.notes) && (
                      <div className="space-y-1 text-sm border-t pt-3">
                        {payment.transaction_reference && (
                          <p className="text-slate-600 dark:text-slate-400">
                            <span className="font-medium">Ref:</span> {payment.transaction_reference}
                          </p>
                        )}
                        {payment.covered_period && (
                          <p className="text-slate-600 dark:text-slate-400">
                            <span className="font-medium">Period:</span> {payment.covered_period}
                          </p>
                        )}
                        {payment.notes && (
                          <p className="text-slate-600 dark:text-slate-400">
                            <span className="font-medium">Notes:</span> {payment.notes}
                          </p>
                        )}
                        {payment.paid_by_name && (
                          <p className="text-xs text-slate-500 dark:text-slate-500">
                            Paid by: {payment.paid_by_name}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
