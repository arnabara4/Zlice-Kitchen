'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Wallet, Calendar, CreditCard, IndianRupee, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { DeliveryPaymentsSkeleton } from '@/components/page-skeletons';

interface Payment {
  id: string;
  amount: number;
  paid_at: string;
  payment_method: string | null;
  transaction_reference: string | null;
  covered_period: string | null;
  notes: string | null;
}

interface PaymentStats {
  totalEarned: number;
  totalPaid: number;
  pendingPayment: number;
  paymentCount: number;
}

export default function DeliveryPaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/delivery-man/my-payments');
      
      if (response.status === 401) {
        router.push('/delivery/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }

      const data = await response.json();
      setPayments(data.payments);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
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

  if (loading && payments.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <DeliveryPaymentsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 xl:pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Payment History</h1>
          <p className="text-slate-600 dark:text-slate-400">Track your earnings and received payments</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Earned</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(stats.totalEarned)}
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
                      {formatCurrency(stats.totalPaid)}
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
                    <p className="text-sm text-slate-600 dark:text-slate-400">Pending</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {formatCurrency(stats.pendingPayment)}
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
                    <p className="text-sm text-slate-600 dark:text-slate-400">Payments</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {stats.paymentCount}
                    </p>
                  </div>
                  <Wallet className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payment List */}
        {payments.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Wallet className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No payments yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Your payment history will appear here once you receive payments.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Recent Payments</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {payments.map((payment) => (
                <Card key={payment.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-3xl font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(payment.amount)}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-2">
                          <Calendar className="w-4 h-4" />
                          {formatDate(payment.paid_at)}
                        </CardDescription>
                      </div>
                      {payment.payment_method && (
                        <Badge variant="outline" className="capitalize">
                          <CreditCard className="w-3 h-3 mr-1" />
                          {payment.payment_method.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  {(payment.transaction_reference || payment.covered_period || payment.notes) && (
                    <CardContent>
                      <div className="space-y-2">
                        {payment.transaction_reference && (
                          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Transaction Reference</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              {payment.transaction_reference}
                            </p>
                          </div>
                        )}
                        
                        {payment.covered_period && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Period Covered</p>
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              {payment.covered_period}
                            </p>
                          </div>
                        )}
                        
                        {payment.notes && (
                          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Notes</p>
                            <p className="text-sm text-slate-900 dark:text-white">
                              {payment.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
