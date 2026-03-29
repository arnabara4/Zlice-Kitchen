'use client';

import { memo } from 'react';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Store, 
  Eye, 
  CheckCircle2, 
  Clock, 
  HelpCircle,
  Banknote
} from 'lucide-react';
import { formatCurrency } from '@/lib/financial-utils';
import type { CanteenSettlementRow } from '@/types/analytics';

interface CanteenSettlementTableProps {
  canteens: CanteenSettlementRow[];
  totals: {
    totalRevenue: number;
    gatewayAmount: number;
    foodValue: number;
    deliveryAmount: number;
    packagingAmount: number;
    gstAmount: number;
    totalCharges: number;
    settlementAmount: number;
    profit: number;
    orderCount: number;
  };
  loading?: boolean;
  onViewDetails: (canteenId: string, canteenName: string) => void;
  onSettle: (canteenId: string, amount: number) => void;
}

// Column tooltips explaining calculations
const COLUMN_TOOLTIPS = {
  totalRevenue: {
    label: 'Total Revenue',
    formula: 'SUM(total_amount)',
    description: 'Sum of all order totals',
  },
  gatewayAmount: {
    label: 'Gateway Fee (Zlice)',
    formula: '1.9% × Zlice total_amount',
    description: 'Payment gateway fee. Only applies to Zlice orders. PoS orders = ₹0',
  },
  foodValue: {
    label: 'Food Value',
    formula: 'canteen_amount - GST - packaging',
    description: 'Pure food value without GST or packaging',
  },
  deliveryAmount: {
    label: 'Delivery',
    formula: 'SUM(delivery_partner_amount)',
    description: 'Total paid to delivery partners',
  },
  packagingAmount: {
    label: 'Packaging',
    formula: 'SUM(packaging_amount)',
    description: 'Packaging costs',
  },
  gstAmount: {
    label: 'GST',
    formula: 'SUM(gst_amount_canteen)',
    description: 'GST amount (payable to kitchen)',
  },
  settlementAmount: {
    label: 'Settlement Amount',
    formula: 'SUM(canteen_amount)',
    description: 'Actual amount payable to kitchen',
  },
  profit: {
    label: 'Profit',
    formula: '(0.98 × total) - kitchen - delivery',
    description: 'Platform profit. Only from Zlice orders. PoS = ₹0',
  },
  extraCharges: {
    label: 'Extra Charges',
    formula: 'SUM(charges)',
    description: 'Extra charges applied to orders (e.g. penalties, adjustments)',
  },
};

function ColumnHeader({ 
  children, 
  tooltip 
}: { 
  children: React.ReactNode; 
  tooltip: { label: string; formula: string; description: string } 
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 cursor-help">
            {children}
            <HelpCircle className="w-3 h-3 text-slate-400" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-3">
          <p className="font-semibold text-sm mb-1">{tooltip.label}</p>
          <p className="text-xs font-mono bg-slate-100 dark:bg-slate-800 p-1 rounded mb-2">
            {tooltip.formula}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {tooltip.description}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function TableSkeleton() {
  return (
    <Card className="border shadow-sm animate-pulse">
      <CardHeader className="pb-3">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export const CanteenSettlementTable = memo(({
  canteens,
  totals,
  loading,
  onViewDetails,
  onSettle,
}: CanteenSettlementTableProps) => {
  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-emerald-600" />
            <CardTitle>Kitchen Settlements</CardTitle>
          </div>
          <Badge variant="outline" className="font-mono">
            {canteens.length} canteens
          </Badge>
        </div>
        <CardDescription>
          Settlement breakdown per kitchen. Click "View Details" for per-order data.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white dark:bg-slate-950 z-10">
              <TableRow className="bg-slate-50 dark:bg-slate-900">
                <TableHead className="font-semibold">Kitchen</TableHead>
                <TableHead className="text-right font-semibold">
                  <ColumnHeader tooltip={COLUMN_TOOLTIPS.totalRevenue}>Revenue</ColumnHeader>
                </TableHead>
                <TableHead className="text-right font-semibold">
                  <ColumnHeader tooltip={COLUMN_TOOLTIPS.gatewayAmount}>
                    <span className="text-amber-600">Gateway</span>
                  </ColumnHeader>
                </TableHead>
                <TableHead className="text-right font-semibold">
                  <ColumnHeader tooltip={COLUMN_TOOLTIPS.foodValue}>Food</ColumnHeader>
                </TableHead>
                <TableHead className="text-right font-semibold">
                  <ColumnHeader tooltip={COLUMN_TOOLTIPS.deliveryAmount}>Delivery</ColumnHeader>
                </TableHead>
                <TableHead className="text-right font-semibold">
                  <ColumnHeader tooltip={COLUMN_TOOLTIPS.packagingAmount}>Pkg</ColumnHeader>
                </TableHead>
                <TableHead className="text-right font-semibold">
                  <ColumnHeader tooltip={COLUMN_TOOLTIPS.gstAmount}>GST</ColumnHeader>
                </TableHead>
                <TableHead className="text-right font-semibold">
                  <ColumnHeader tooltip={COLUMN_TOOLTIPS.settlementAmount}>
                    <span className="text-emerald-600">Settlement</span>
                  </ColumnHeader>
                </TableHead>
                <TableHead className="text-right font-semibold">
                  <ColumnHeader tooltip={COLUMN_TOOLTIPS.profit}>
                    <span className="text-blue-600">Profit</span>
                  </ColumnHeader>
                </TableHead>
                <TableHead className="text-right font-semibold">
                  <ColumnHeader tooltip={COLUMN_TOOLTIPS.extraCharges}>
                    <span className="text-red-600">Charges</span>
                  </ColumnHeader>
                </TableHead>
                <TableHead className="text-center font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {canteens.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-12 text-slate-500">
                    No settlement data for this date
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {canteens.map((canteen) => (
                    <TableRow 
                      key={canteen.canteenId}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Store className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {canteen.canteenName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {canteen.orderCount} orders ({canteen.zliceOrderCount} Zlice)
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(canteen.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-amber-600">
                        {formatCurrency(canteen.gatewayAmount)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(canteen.foodValue)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(canteen.deliveryAmount)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(canteen.packagingAmount)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(canteen.gstAmount)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-emerald-600 font-semibold">
                        {formatCurrency(canteen.settlementAmount)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-blue-600">
                        {formatCurrency(canteen.profit)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        {canteen.totalCharges > 0 ? formatCurrency(canteen.totalCharges) : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewDetails(canteen.canteenId, canteen.canteenName)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Details
                          </Button>
                          {canteen.status === 'settled' ? (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Settled
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-emerald-600 hover:bg-emerald-700"
                              disabled={canteen.settlementAmount <= 0}
                              onClick={() => onSettle(canteen.canteenId, canteen.settlementAmount)}
                            >
                              <Banknote className="w-4 h-4 mr-1" />
                              Settle
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Totals Row */}
                  <TableRow className="bg-slate-100 dark:bg-slate-800 font-semibold border-t-2">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 dark:text-white">TOTALS</span>
                        <Badge variant="outline">{totals.orderCount} orders</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(totals.totalRevenue)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-amber-600">
                      {formatCurrency(totals.gatewayAmount)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(totals.foodValue)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(totals.deliveryAmount)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(totals.packagingAmount)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(totals.gstAmount)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-emerald-600 text-lg">
                      {formatCurrency(totals.settlementAmount)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-blue-600 text-lg">
                      {formatCurrency(totals.profit)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-red-600 text-lg">
                      {totals.totalCharges > 0 ? formatCurrency(totals.totalCharges) : '—'}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
});

CanteenSettlementTable.displayName = 'CanteenSettlementTable';

export default CanteenSettlementTable;
