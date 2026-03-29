'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  RefreshCw,
  Store,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/financial-utils';

interface ChargeRow {
  id: string;
  canteen_id: string | null;
  order_id: string | null;
  charge_amount: number;
  charge_reason: string;
  charge_type: string;
  applied: boolean;
  created_at: string;
  canteen_name: string | null;
}

interface ChargeTotals {
  total: number;
  applied: number;
  unapplied: number;
  count: number;
}

export default function AllChargesPage() {
  const [charges, setCharges] = useState<ChargeRow[]>([]);
  const [totals, setTotals] = useState<ChargeTotals>({ total: 0, applied: 0, unapplied: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const fetchCharges = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/charges');
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch charges');
      }

      setCharges(data.charges || []);
      setTotals(data.totals || { total: 0, applied: 0, unapplied: 0, count: 0 });
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCharges();
  }, [fetchCharges]);

  const handleApply = async (chargeId: string) => {
    if (applyingId) return; // Prevent double clicks
    setApplyingId(chargeId);

    try {
      const res = await fetch(`/api/admin/charges/${chargeId}/apply`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to apply charge');
      }

      toast.success(data.message || 'Charge applied successfully');
      
      // Optimistic update
      setCharges(prev => prev.map(c => 
        c.id === chargeId ? { ...c, applied: true } : c
      ));
      setTotals(prev => {
        const chargeAmount = charges.find(c => c.id === chargeId)?.charge_amount || 0;
        return {
          ...prev,
          applied: prev.applied + chargeAmount,
          unapplied: prev.unapplied - chargeAmount,
        };
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setApplyingId(null);
    }
  };

  const formatChargeType = (type: string) => {
    switch (type) {
      case 'CANTEEN_DISTRIBUTED': return 'Canteen';
      case 'ORDER_SPECIFIC': return 'Order';
      case 'GLOBAL_MISC': return 'Global';
      default: return type;
    }
  };

  if (error && !loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Failed to Load Charges</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
            <Button onClick={fetchCharges}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Link href="/admin/canteens/settlements">
              <Button variant="ghost" size="sm" className="w-fit -ml-2 text-slate-500">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Settlements
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  All Charges Ledger
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  View and manage all platform charges 
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchCharges}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-slate-200 dark:border-slate-700">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Charges</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                {formatCurrency(totals.total)}
              </p>
              <p className="text-xs text-slate-500 mt-1">{totals.count} charges</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Applied</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {formatCurrency(totals.applied)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 dark:border-amber-800">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Unapplied</p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                {formatCurrency(totals.unapplied)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Count</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {totals.count}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charges Table */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-600" />
                <CardTitle>Charges</CardTitle>
              </div>
              <Badge variant="outline" className="font-mono">
                {charges.length} records
              </Badge>
            </div>
            <CardDescription>
              All charges across canteens. Click &quot;Apply&quot; to mark an unapplied charge as accounted for.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-slate-600">Loading charges...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white dark:bg-slate-950 z-10">
                    <TableRow className="bg-slate-50 dark:bg-slate-900">
                      <TableHead className="font-semibold text-xs">Date</TableHead>
                      <TableHead className="font-semibold text-xs">Canteen</TableHead>
                      <TableHead className="font-semibold text-xs">Type</TableHead>
                      <TableHead className="text-right font-semibold text-xs text-red-600">Amount</TableHead>
                      <TableHead className="font-semibold text-xs">Reason</TableHead>
                      <TableHead className="font-semibold text-xs">Order</TableHead>
                      <TableHead className="text-center font-semibold text-xs">Status</TableHead>
                      <TableHead className="text-center font-semibold text-xs">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {charges.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                          No charges found
                        </TableCell>
                      </TableRow>
                    ) : (
                      charges.map((charge) => (
                        <TableRow key={charge.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                          <TableCell className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {format(new Date(charge.created_at), 'dd MMM yyyy, HH:mm')}
                          </TableCell>
                          <TableCell className="text-xs">
                            {charge.canteen_name ? (
                              <div className="flex items-center gap-1.5">
                                <Store className="w-3.5 h-3.5 text-blue-500" />
                                <span className="font-medium">{charge.canteen_name}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {formatChargeType(charge.charge_type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-red-600 font-semibold text-xs">
                            {formatCurrency(charge.charge_amount)}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 dark:text-slate-400 max-w-[180px] truncate" title={charge.charge_reason}>
                            {charge.charge_reason}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-slate-500">
                            {charge.order_id ? charge.order_id.slice(0, 8).toUpperCase() : '—'}
                          </TableCell>
                          <TableCell className="text-center">
                            {charge.applied ? (
                              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 text-[10px]">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Applied
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 text-[10px]">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {!charge.applied ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[10px] px-3 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                onClick={() => handleApply(charge.id)}
                                disabled={applyingId === charge.id}
                              >
                                {applyingId === charge.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  'Apply'
                                )}
                              </Button>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
