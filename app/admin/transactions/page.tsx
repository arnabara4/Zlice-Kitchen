"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Copy, Plus, CheckCircle2, Clock, Landmark, AlertCircle, Loader2, MinusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AddChargeModal } from "@/components/admin/settlements/add-charge-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/financial-utils";

interface Transaction {
  id: string;
  canteen_id: string;
  amount: number;
  requested_at: string;
  paid: boolean;
  paid_at: string | null;
  paid_by_admin: string | null;
  canteens: { name: string } | null;
}

interface Canteen {
  id: string;
  name: string;
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCanteenId, setSelectedCanteenId] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  const [payingId, setPayingId] = useState<string | null>(null);
  
  // New: Filter state
  const [filterCanteenId, setFilterCanteenId] = useState<string>("all");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/transactions");
      const data = await res.json();
      if (data.success) setTransactions(data.data || []);
      
      // Fetch canteens list for the manual creation modal
      const canteensRes = await fetch("/api/admin/canteens");
      const canteensData = await canteensRes.json();
      if (canteensData.canteens) {
        setCanteens(canteensData.canteens);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePay = async (transactionId: string) => {
    setPayingId(transactionId);
    try {
      const res = await fetch(`/api/admin/transactions/${transactionId}/pay`, {
        method: "POST"
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to process payment");
      }
      
      toast.success(data.message || "Transaction processed successfully!");
      fetchData();
    } catch (err: any) {
      console.error("Payment error:", err);
      toast.error(err.message);
    } finally {
      setPayingId(null);
    }
  };

  const handleCreateExplicitTransaction = async () => {
    if (!selectedCanteenId) {
      toast.error("Please select a kitchen first.");
      return;
    }
    
    setIsCreating(true);
    try {
      const res = await fetch("/api/admin/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          canteenId: selectedCanteenId,
          amount: customAmount ? Number(customAmount) : undefined
        })
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to generate transaction");
      }
      
      toast.success(data.message);
      setIsCreateModalOpen(false);
      setSelectedCanteenId("");
      setCustomAmount("");
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Transaction ID copied!");
  };

  // Filtered transactions
  const filteredTransactions = transactions.filter(tx => 
    filterCanteenId === "all" || tx.canteen_id === filterCanteenId
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-white dark:to-slate-300">
            Withdrawal Requests
          </h1>
          <p className="text-slate-500 mt-2">
            Approve and track kitchen withdrawals. Bound by strict <b>requested_at</b> timeline rules.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <AddChargeModal 
            canteens={canteens} 
            onChargeAdded={fetchData} 
            trigger={
              <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 gap-2">
                <MinusCircle className="w-4 h-4" />
                Add Charge
              </Button>
            }
          />

          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                <Plus className="w-4 h-4" />
                Generate Transaction
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Implicit Transaction</DialogTitle>
              <DialogDescription>
                Bypass the PoS request. This instantly calculates a kitchen's pending balance and creates a transaction boundary right now.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Kitchen</label>
                <Select value={selectedCanteenId} onValueChange={setSelectedCanteenId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a kitchen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {canteens.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount (₹)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  placeholder="e.g. 500.00 (Leave blank for auto-calculate)" 
                  className="w-full flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  If left blank, the system will automatically calculate the maximum pending balance for this kitchen.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
              <Button disabled={!selectedCanteenId || isCreating} onClick={handleCreateExplicitTransaction}>
                {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Create Transaction
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>

    <div className="flex items-center gap-3 mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        <label className="text-sm font-medium text-slate-400">Filter by Kitchen:</label>
        <Select value={filterCanteenId} onValueChange={setFilterCanteenId}>
          <SelectTrigger className="w-[280px] bg-slate-950 border-slate-800 text-white">
            <SelectValue placeholder="All Kitchens" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800 text-white">
            <SelectItem value="all">All Kitchens</SelectItem>
            {canteens.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {filterCanteenId !== "all" && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setFilterCanteenId("all")}
            className="text-slate-500 hover:text-white"
          >
            Clear Filter
          </Button>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Landmark className="w-5 h-5 text-indigo-500" />
            Transaction History
          </CardTitle>
          <CardDescription>All pending and completed financial clearances.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-20 flex justify-center items-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mr-2" />
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center border-2 border-dashed rounded-lg border-slate-200 dark:border-slate-800">
               <AlertCircle className="w-10 h-10 text-slate-400 mb-3" />
               <p className="text-slate-500 text-lg">No transactions found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left align-middle border-collapse">
                <thead className="bg-[#1e1b2e] text-slate-400 font-medium">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Transaction ID</th>
                    <th className="px-6 py-4 font-semibold">Kitchen</th>
                    <th className="px-6 py-4 font-semibold">Boundary Cutoff Time</th>
                    <th className="px-6 py-4 font-semibold">Amount</th>
                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredTransactions.map((tx) => (
                     <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-slate-500 flex items-center gap-2">
                          {tx.id.split('-')[0]}...
                          <button onClick={() => copyToClipboard(tx.id)} className="hover:text-white transition-colors">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">
                          {tx.canteens?.name || "Unknown"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-300 font-medium">{format(new Date(tx.requested_at), "dd MMM yyyy, HH:mm")}</div>
                          <div className="text-xs text-slate-500 mt-1">Orders settled until this exact minute</div>
                        </td>
                        <td className="px-6 py-4 font-bold text-amber-500">
                          {formatCurrency(Number(tx.amount))}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {tx.paid ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              <CheckCircle2 className="w-4 h-4" />
                              PAID
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              <Clock className="w-4 h-4" />
                              PENDING
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {!tx.paid ? (
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => handlePay(tx.id)}
                              disabled={payingId === tx.id}
                            >
                              {payingId === tx.id ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing</>
                              ) : (
                                "Approve & Pay"
                              )}
                            </Button>
                          ) : (
                            <div className="text-xs text-slate-500 flex flex-col items-end gap-1">
                               <span>Cleared On</span>
                               <span className="font-mono text-slate-400">
                                 {tx.paid_at ? format(new Date(tx.paid_at), "dd MMM, HH:mm") : "-"}
                               </span>
                            </div>
                          )}
                        </td>
                     </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
