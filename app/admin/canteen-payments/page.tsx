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
  Store, 
  Search, 
  Phone, 
  MapPin, 
  IndianRupee, 
  CheckCircle, 
  Clock,
  Calendar as CalendarIcon,
  CreditCard,
  TrendingUp,
  DollarSign,
  ShoppingBag
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

interface Canteen {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalEarned: number;
  totalPaid: number;
  pendingPayment: number;
  onlineOrderCount: number;
}

interface Payment {
  id: string;
  amount: number;
  paid_at: string;
  payment_method: string | null;
  transaction_reference: string | null;
  covered_period: string | null;
  notes: string | null;
}

export default function CanteenPaymentsPage() {
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [filteredCanteens, setFilteredCanteens] = useState<Canteen[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCanteen, setSelectedCanteen] = useState<Canteen | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  // Payment form
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [transactionReference, setTransactionReference] = useState('');
  const [coveredPeriod, setCoveredPeriod] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getIndianDate = () => {
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  };

  useEffect(() => {
    fetchCanteens();
  }, []);

  // Refetch when date filters change
  useEffect(() => {
    if (!loading) {
      setLoading(true);
      fetchCanteens();
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCanteens(canteens);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = canteens.filter(
        (canteen) =>
          canteen.name.toLowerCase().includes(query) ||
          canteen.phone.includes(query)
      );
      setFilteredCanteens(filtered);
    }
  }, [searchQuery, canteens]);

  const fetchCanteens = async () => {
    try {
      // Build API URL with date filters if provided
      const url = new URL('/api/canteen/payments/summary', window.location.origin);
      
      if (startDate) {
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const day = String(startDate.getDate()).padStart(2, '0');
        const istStartStr = `${year}-${month}-${day}T00:00:00.000+05:30`;
        const startDateUTC = new Date(istStartStr);
        url.searchParams.set('startDate', startDateUTC.toISOString());
      }
      
      if (endDate) {
        const year = endDate.getFullYear();
        const month = String(endDate.getMonth() + 1).padStart(2, '0');
        const day = String(endDate.getDate()).padStart(2, '0');
        const istEndStr = `${year}-${month}-${day}T23:59:59.999+05:30`;
        const endDateUTC = new Date(istEndStr);
        url.searchParams.set('endDate', endDateUTC.toISOString());
      }

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to fetch kitchens');
      const data = await response.json();
      setCanteens(data);
      setFilteredCanteens(data);
    } catch (error) {
      console.error('Error fetching kitchens:', error);
      toast.error('Failed to load kitchens');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async (canteenId: string) => {
    setLoadingHistory(true);
    try {
      const response = await fetch(`/api/canteen/payments/history?canteenId=${canteenId}`);
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

  const handleMakePayment = (canteen: Canteen) => {
    setSelectedCanteen(canteen);
    setPaymentAmount(canteen.pendingPayment.toFixed(2));
    setIsPaymentDialogOpen(true);
  };

  const handleViewHistory = (canteen: Canteen) => {
    setSelectedCanteen(canteen);
    fetchPaymentHistory(canteen.id);
    setIsHistoryDialogOpen(true);
  };

  const handleSubmitPayment = async () => {
    if (!selectedCanteen || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/canteen/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canteen_id: selectedCanteen.id,
          amount: parseFloat(paymentAmount),
          payment_method: paymentMethod,
          transaction_reference: transactionReference || null,
          covered_period: coveredPeriod || null,
          notes: notes || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to record payment');

      toast.success('Payment recorded successfully');
      setIsPaymentDialogOpen(false);
      resetPaymentForm();
      fetchCanteens(); // Refresh the list
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetPaymentForm = () => {
    setPaymentAmount('');
    setPaymentMethod('cash');
    setTransactionReference('');
    setCoveredPeriod('');
    setNotes('');
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
  const totalEarned = canteens.reduce((sum, c) => sum + c.totalEarned, 0);
  const totalPaid = canteens.reduce((sum, c) => sum + c.totalPaid, 0);
  const totalPending = canteens.reduce((sum, c) => sum + c.pendingPayment, 0);
  const totalOrders = canteens.reduce((sum, c) => sum + c.onlineOrderCount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading kitchens...</p>
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
            Kitchen Payments
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage payments to kitchens for online orders
          </p>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Total Earned
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(totalEarned)}
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
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Total Paid
                  </p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(totalPaid)}
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
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Total Pending
                  </p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {formatCurrency(totalPending)}
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
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Online Orders
                  </p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {totalOrders}
                  </p>
                </div>
                <ShoppingBag className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Date Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-3 text-xs">
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {startDate ? format(startDate, "dd MMM yyyy") : "Start Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50" align="start">
              <CalendarComponent
                mode="single"
                selected={startDate}
                onSelect={(date) => setStartDate(date)}
                disabled={(date) => date > getIndianDate()}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-3 text-xs">
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {endDate ? format(endDate, "dd MMM yyyy") : "End Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50" align="start">
              <CalendarComponent
                mode="single"
                selected={endDate}
                onSelect={(date) => setEndDate(date)}
                disabled={(date) => {
                  if (date > getIndianDate()) return true;
                  if (startDate && date < startDate) return true;
                  return false;
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

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

        {/* Canteens List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCanteens.map((canteen) => (
            <Card key={canteen.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                      <Store className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{canteen.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 text-xs">
                        <Phone className="w-3 h-3" />
                        {canteen.phone}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Total Earned</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(canteen.totalEarned)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Total Paid</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {formatCurrency(canteen.totalPaid)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Pending</span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      {formatCurrency(canteen.pendingPayment)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Online Orders</span>
                    <Badge variant="secondary">{canteen.onlineOrderCount}</Badge>
                  </div>

                  <div className="pt-3 flex gap-2">
                    <Button
                      onClick={() => handleMakePayment(canteen)}
                      className="flex-1"
                      size="sm"
                      disabled={canteen.pendingPayment <= 0}
                    >
                      <IndianRupee className="w-4 h-4 mr-1" />
                      Pay
                    </Button>
                    <Button
                      onClick={() => handleViewHistory(canteen)}
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

          {filteredCanteens.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Store className="w-12 h-12 text-slate-400 mb-4" />
                <p className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  No kitchens found
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {searchQuery ? 'Try a different search term' : 'No kitchens available'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Payment to {selectedCanteen?.name}</DialogTitle>
              <DialogDescription>
                Record a payment for online order earnings
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment Method</Label>
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
                <Label htmlFor="reference">Transaction Reference</Label>
                <Input
                  id="reference"
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                  placeholder="Transaction ID, Cheque #, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="period">Covered Period</Label>
                <Input
                  id="period"
                  value={coveredPeriod}
                  onChange={(e) => setCoveredPeriod(e.target.value)}
                  placeholder="e.g., Week of Jan 15-21"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsPaymentDialogOpen(false);
                  resetPaymentForm();
                }}
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
              <DialogTitle>Payment History - {selectedCanteen?.name}</DialogTitle>
              <DialogDescription>
                All payments made to this kitchen
              </DialogDescription>
            </DialogHeader>

            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : paymentHistory.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-400">No payment history</p>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentHistory.map((payment) => (
                  <Card key={payment.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-lg text-green-600 dark:text-green-400">
                            {formatCurrency(payment.amount)}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {formatDate(payment.paid_at)}
                          </p>
                        </div>
                        {payment.payment_method && (
                          <Badge variant="secondary" className="capitalize">
                            {payment.payment_method.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                      {payment.transaction_reference && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Ref: {payment.transaction_reference}
                        </p>
                      )}
                      {payment.covered_period && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Period: {payment.covered_period}
                        </p>
                      )}
                      {payment.notes && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                          {payment.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
