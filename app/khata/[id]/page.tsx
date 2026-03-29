"use client"

import React, { useEffect, useState } from "react";
import { useCanteen } from "@/lib/canteen-context";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { ArrowLeft, Calendar, IndianRupee, Trash2, Plus, TrendingUp, Receipt, ArrowUpDown, AlertCircle, CheckCircle2, UtensilsCrossed, Pencil, User, Hash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StudentDetail() {
  const { selectedCanteen, selectedCanteenId } = useCanteen();
  const router = useRouter();
  const params = useParams();
  const id = (params as any)?.id as string;

  const [student, setStudent] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedMenuItems, setSelectedMenuItems] = useState<{[key: string]: number}>({});
  const [sortField, setSortField] = useState<'entry_date' | 'amount'>('entry_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [transactionType, setTransactionType] = useState<'debit' | 'credit'>('debit');
  
  // Month/Year filter state
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [showAllTime, setShowAllTime] = useState<boolean>(false);
  
  // Delete entry dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Edit student dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editRollNumber, setEditRollNumber] = useState("");
  const [editPhoneNumber, setEditPhoneNumber] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState(false);

  useEffect(() => {
    if (!id || !selectedCanteenId) return;
    setPageLoading(true);
    Promise.all([fetchStudent(), fetchEntries(), fetchMenuItems()]).finally(() => setPageLoading(false));
  }, [id, selectedCanteenId]); // Use stable ID

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setDialogOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  async function fetchStudent() {
     try {
        const res = await fetch(`/api/khata?id=${id}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setStudent(data.student);
     } catch (err) {
        console.error("Error fetching student:", err);
     }
  }

  async function fetchEntries() {
    if (!selectedCanteen) return;
    try {
        const res = await fetch(`/api/khata?id=${id}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setEntries(data.entries || []);
    } catch (err) {
        console.error("Error fetching entries:", err);
    }
  }

  async function fetchMenuItems() {
    if (!selectedCanteen) return;
    try {
       const res = await fetch('/api/menu');
       if (!res.ok) throw new Error('Failed to fetch menu');
       const data = await res.json();
       setMenuItems(data || []);
    } catch (err) {
       console.error("Error fetching menu items:", err);
       setMenuItems([]);
    }
  }

  async function addEntry(e?: React.FormEvent, entryType?: 'debit' | 'credit') {
    e?.preventDefault();
    if (!amount) return;
    setLoading(true);
    
    // Use the passed entryType parameter, or fall back to transactionType state
    const effectiveEntryType = entryType || transactionType;
    
    const amountNum = Number(amount);
    const currentBalance = Number(student?.prepaid_balance || 0);
    
    // Calculate new balance based on transaction type
    let newBalance;
    if (effectiveEntryType === 'credit') {
      // Prepaid top-up: add to balance
      newBalance = currentBalance + amountNum;
    } else {
      // Debit/purchase: subtract from balance (can go negative for postpaid)
      newBalance = currentBalance - amountNum;
    }
    
    // Insert entry
    if (!selectedCanteen) return;
    
    try {
      const res = await fetch('/api/khata', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            type: 'add_entry',
            payload: {
               student_id: id,
               amount: amountNum,
               entry_type: effectiveEntryType,
               notes: note || undefined
            }
         })
      });
      
      const dbRes = await res.json();
      setLoading(false);
      
      if (!res.ok || dbRes.error) {
         console.error("Error adding entry:", dbRes.error);
         return;
      }
    } catch (err) {
       setLoading(false);
       console.error("Network error:", err);
       return;
    }
    
    setAmount("");
    setNote("");
    setTransactionType('debit');
    setDialogOpen(false);
    fetchStudent();
    fetchEntries();
  }

  async function addMenuItemsEntry(e?: React.FormEvent) {
    e?.preventDefault();
    const selectedItems = Object.entries(selectedMenuItems).filter(([_, qty]) => qty > 0);
    if (selectedItems.length === 0) return;
    
    if (!selectedCanteen) {
      console.error("No canteen selected");
      return;
    }
    
    setLoading(true);
    const totalAmount = selectedItems.reduce((sum, [itemId, qty]) => {
      const item = menuItems.find(m => m.id === itemId);
      return sum + (item ? Number(item.price) * Number(qty) : 0);
    }, 0);
    
    const itemsNote = selectedItems.map(([itemId, qty]) => {
      const item = menuItems.find(m => m.id === itemId);
      return `${item?.name || 'Unknown'} x${qty}`;
    }).join(", ");
    
    const currentBalance = Number(student?.prepaid_balance || 0);
    const newBalance = currentBalance - totalAmount; // Menu purchases are always debits
    
    // Insert entry via API
    try {
      const res = await fetch('/api/khata', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            type: 'add_entry',
            payload: {
               student_id: id,
               amount: totalAmount,
               entry_type: 'debit',
               notes: itemsNote
            }
         })
      });
      
      const dbRes = await res.json();
      setLoading(false);
      
      if (!res.ok || dbRes.error) {
         console.error("Error adding items entry:", dbRes.error);
         return;
      }
    } catch (err) {
       setLoading(false);
       console.error("Network error:", err);
       return;
    }
    
    setSelectedMenuItems({});
    setMenuSearch('');
    setDialogOpen(false);
    fetchStudent();
    fetchEntries();
  }
  
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'entry_date' ? 'desc' : 'asc');
    }
  };
  
  // Filter entries by month/year
  const filteredEntries = showAllTime ? entries : entries.filter(entry => {
    const entryDate = new Date(entry.entry_date);
    return entryDate.getMonth() === selectedMonth && entryDate.getFullYear() === selectedYear;
  });

  const sortedEntries = [...filteredEntries].sort((a, b) => {
    let aVal = sortField === 'entry_date' ? new Date(a.entry_date).getTime() : Number(a.amount);
    let bVal = sortField === 'entry_date' ? new Date(b.entry_date).getTime() : Number(b.amount);
    
    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  async function deleteEntry() {
    if (!entryToDelete) return;
    
    setDeleteLoading(true);
    
    // Get the entry details
    const entryAmount = Number(entryToDelete.amount);
    const entryType = entryToDelete.entry_type;
    
    try {
      const res = await fetch('/api/khata', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            type: 'delete_entry',
            payload: { entry_id: entryToDelete.id }
         })
      });
      
      const dbRes = await res.json();
      setDeleteLoading(false);
      
      if (!res.ok || dbRes.error) {
         console.error("Error deleting entry:", dbRes.error);
         return;
      }
    } catch (err) {
       setDeleteLoading(false);
       console.error("Network error:", err);
       return;
    }
    
    setDeleteDialogOpen(false);
    setEntryToDelete(null);
    
    // Refresh data
    await Promise.all([fetchStudent(), fetchEntries()]);
  }
  
  function openDeleteDialog(entry: any) {
    setEntryToDelete(entry);
    setDeleteDialogOpen(true);
  }
  
  function openEditDialog() {
    setEditName(student?.name || "");
    setEditRollNumber(student?.roll_number || "");
    setEditPhoneNumber(student?.phone_number || "");
    setEditError("");
    setEditSuccess(false);
    setEditDialogOpen(true);
  }
  
  async function updateStudent(e?: React.FormEvent) {
    e?.preventDefault();
    setEditError("");
    setEditSuccess(false);
    
    if (!editName.trim() || !editRollNumber.trim()) {
      setEditError("Please fill in all required fields");
      return;
    }
    
    setEditLoading(true);
    
    try {
      const res = await fetch('/api/khata', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            type: 'update_student',
            payload: {
               student_id: id,
               name: editName.trim(),
               roll_number: editRollNumber.trim(),
               phone_number: editPhoneNumber.trim() || undefined
            }
         })
      });
      
      const dbRes = await res.json();
      setEditLoading(false);
      
      if (!res.ok || dbRes.error) {
        if (dbRes.error?.includes('duplicate') || dbRes.code === '23505') {
          setEditError("This roll number already exists. Please use a different one.");
        } else {
          setEditError(dbRes.error || "Failed to update student. Please try again.");
        }
        return;
      }
    } catch (err) {
       setEditLoading(false);
       setEditError("Network error. Please try again.");
       return;
    }
    
    setEditSuccess(true);
    
    // Refresh student data and close dialog
    setTimeout(() => {
      fetchStudent();
      setEditDialogOpen(false);
      setEditSuccess(false);
    }, 1000);
  }

  // Calculate balances (filtered by month if not showing all time)
  const prepaidBalance = Number(student?.prepaid_balance || 0);
  const totalDebits = filteredEntries.filter(e => e.entry_type === 'debit').reduce((sum, e) => sum + Number(e.amount), 0);
  const totalCredits = filteredEntries.filter(e => e.entry_type === 'credit').reduce((sum, e) => sum + Number(e.amount), 0);
  const postpaidDebt = prepaidBalance < 0 ? Math.abs(prepaidBalance) : 0;
  
  // Generate months and years for filter
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i); // Last 5 years

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {pageLoading ? (
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-md" />
                <div>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.back()} 
                  className="h-8 w-8 p-0 dark:hover:bg-slate-800/50"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-red-600 dark:text-red-500">{student?.name ?? 'Student'}</h1>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={openEditDialog}
                      className="h-7 w-7 p-0 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                      Roll: {student?.roll_number ?? '—'}
                    </span>
                    {student?.phone_number && (
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        • {student.phone_number}
                      </span>
                    )}
                    {entries.length > 0 && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        • {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white h-9 px-4 text-sm">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] dark:bg-[#1e293b] dark:border-slate-800 animate-in fade-in-0 zoom-in-95 duration-200">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-red-600 dark:text-red-500 flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add New Entry
                  </DialogTitle>
                  <DialogDescription className="text-slate-600 dark:text-slate-400 text-sm">
                    Record a new payment for <span className="font-semibold text-slate-900 dark:text-white">{student?.name}</span>
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="menu" className="py-4">
                  <TabsList className="grid w-full grid-cols-3 mb-4 bg-slate-100 dark:bg-slate-800/50">
                    <TabsTrigger value="menu" className="text-xs data-[state=active]:bg-red-600 data-[state=active]:text-white">
                      <UtensilsCrossed className="h-3.5 w-3.5 mr-1" />
                      Purchase
                    </TabsTrigger>
                    <TabsTrigger value="topup" className="text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Balance
                    </TabsTrigger>
                    <TabsTrigger value="direct" className="text-xs data-[state=active]:bg-red-600 data-[state=active]:text-white">
                      <IndianRupee className="h-3.5 w-3.5 mr-1" />
                      Direct Entry
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="direct">
                    <form onSubmit={addEntry} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-slate-700 dark:text-slate-300 text-sm">
                          Transaction Type <span className="text-red-500">*</span>
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            variant={transactionType === 'debit' ? 'default' : 'outline'}
                            className={`h-10 ${transactionType === 'debit' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
                            onClick={() => setTransactionType('debit')}
                          >
                            <TrendingUp className="h-4 w-4 mr-2 rotate-180" />
                            Expense (Debit)
                          </Button>
                          <Button
                            type="button"
                            variant={transactionType === 'credit' ? 'default' : 'outline'}
                            className={`h-10 ${transactionType === 'credit' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                            onClick={() => setTransactionType('credit')}
                          >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Top-up (Credit)
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="amount" className="text-slate-700 dark:text-slate-300 text-sm">
                          Amount (₹) <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                          <Input 
                            id="amount"
                            value={amount} 
                            onChange={(e) => setAmount(e.target.value)} 
                            type="number" 
                            required 
                            placeholder="0.00"
                            className="pl-9 h-9 text-sm dark:bg-[#0f172a] dark:border-slate-700/50 dark:text-white focus:ring-2 focus:ring-red-500 dark:focus:ring-red-500 transition-all"
                            step="0.01"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="note" className="text-slate-700 dark:text-slate-300 text-sm">Note (Optional)</Label>
                        <Input 
                          id="note"
                          value={note} 
                          onChange={(e) => setNote(e.target.value)} 
                          placeholder={transactionType === 'credit' ? 'e.g., Prepaid top-up' : 'e.g., Direct payment, custom note...'}
                          className="h-9 text-sm dark:bg-[#0f172a] dark:border-slate-700/50 dark:text-white focus:ring-2 focus:ring-red-500 dark:focus:ring-red-500 transition-all"
                        />
                      </div>

                      <DialogFooter className="gap-2 pt-2">
                        <Button 
                          type="button" 
                          size="sm"
                          variant="outline" 
                          onClick={() => setDialogOpen(false)}
                          disabled={loading}
                          className="h-9 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/50"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          size="sm" 
                          disabled={loading}
                          className={`h-9 min-w-[100px] ${transactionType === 'credit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-2"></div>
                              Adding...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                              {transactionType === 'credit' ? 'Add Balance' : 'Record Expense'}
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="topup">
                    <form onSubmit={(e) => addEntry(e, 'credit')} className="space-y-4">
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Prepaid Balance Top-up</p>
                            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                              Add money to the student's prepaid balance. They can use this balance for future purchases without creating debt.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="topup-amount" className="text-slate-700 dark:text-slate-300 text-sm">
                          Top-up Amount (₹) <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                          <Input 
                            id="topup-amount"
                            value={amount} 
                            onChange={(e) => setAmount(e.target.value)} 
                            type="number" 
                            required 
                            placeholder="0.00"
                            className="pl-9 h-9 text-sm dark:bg-[#0f172a] dark:border-slate-700/50 dark:text-white focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-500 transition-all"
                            step="0.01"
                          />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Current balance: <span className={`font-semibold ${prepaidBalance >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>₹{prepaidBalance.toFixed(2)}</span>
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="topup-note" className="text-slate-700 dark:text-slate-300 text-sm">Note (Optional)</Label>
                        <Input 
                          id="topup-note"
                          value={note} 
                          onChange={(e) => setNote(e.target.value)} 
                          placeholder="e.g., Cash payment, bank transfer..."
                          className="h-9 text-sm dark:bg-[#0f172a] dark:border-slate-700/50 dark:text-white focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-500 transition-all"
                        />
                      </div>

                      <DialogFooter className="gap-2 pt-2">
                        <Button 
                          type="button" 
                          size="sm"
                          variant="outline" 
                          onClick={() => setDialogOpen(false)}
                          disabled={loading}
                          className="h-9 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/50"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          size="sm" 
                          disabled={loading}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 min-w-[120px]"
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-2"></div>
                              Adding...
                            </>
                          ) : (
                            <>
                              <Plus className="h-3.5 w-3.5 mr-1.5" />
                              Add Balance
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="menu">
                    <form onSubmit={addMenuItemsEntry} className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-slate-700 dark:text-slate-300 text-sm font-semibold">
                            Select Menu Items <span className="text-red-500">*</span>
                          </Label>
                          {Object.values(selectedMenuItems).some(q => q > 0) && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedMenuItems({})}
                              className="h-7 text-xs text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              Clear All
                            </Button>
                          )}
                        </div>
                        
                        <Input
                          placeholder="🔍 Search menu items..."
                          value={menuSearch}
                          onChange={(e) => setMenuSearch(e.target.value)}
                          className="h-10 text-sm dark:bg-[#0f172a] dark:border-slate-700/50"
                        />

                        <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1 border dark:border-slate-700 rounded-md p-3 bg-slate-50 dark:bg-[#0f172a]">
                          {menuItems.length === 0 ? (
                            <div className="text-center py-12">
                              <UtensilsCrossed className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No menu items available</p>
                              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Please add menu items first</p>
                            </div>
                          ) : menuItems.filter((it) => it.name.toLowerCase().includes(menuSearch.toLowerCase())).length === 0 ? (
                            <div className="text-center py-8">
                              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No items found</p>
                              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Try a different search term</p>
                            </div>
                          ) : (
                            menuItems
                              .filter((it) =>
                                it.name.toLowerCase().includes(menuSearch.toLowerCase())
                              )
                              .map((item) => {
                                const qty = selectedMenuItems[item.id] || 0;
                                const isSelected = qty > 0;
                                
                                return (
                                  <div 
                                    key={item.id} 
                                    onClick={() => {
                                      const currentQty = selectedMenuItems[item.id] || 0;
                                      setSelectedMenuItems({ ...selectedMenuItems, [item.id]: currentQty + 1 });
                                    }}
                                    className={`flex items-center justify-between gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                                      isSelected
                                        ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-600 shadow-sm' 
                                        : 'bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-700'
                                    }`}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-medium truncate ${isSelected ? 'text-red-700 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                                        {item.name}
                                      </p>
                                      <p className={`text-xs mt-0.5 ${isSelected ? 'text-red-600 dark:text-red-500' : 'text-slate-600 dark:text-slate-400'}`}>
                                        ₹{item.price.toFixed(2)}
                                      </p>
                                    </div>
                                    {isSelected ? (
                                      <div className="flex items-center gap-2 shrink-0">
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const newItems = { ...selectedMenuItems };
                                            if (qty === 1) {
                                              delete newItems[item.id];
                                            } else {
                                              newItems[item.id] = qty - 1;
                                            }
                                            setSelectedMenuItems(newItems);
                                          }}
                                          className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-900/20"
                                        >
                                          -
                                        </Button>
                                        <span className="text-sm font-semibold w-8 text-center text-red-700 dark:text-red-400">
                                          {qty}
                                        </span>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedMenuItems({ ...selectedMenuItems, [item.id]: qty + 1 });
                                          }}
                                          className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-900/20"
                                        >
                                          +
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="shrink-0">
                                        <div className="h-7 w-7 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 dark:text-slate-500">
                                          <Plus className="h-4 w-4" />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                          )}
                        </div>
                        
                        {Object.values(selectedMenuItems).some(q => q > 0) && (
                          <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                            <div>
                              <span className="text-xs text-slate-600 dark:text-slate-400">Total Amount</span>
                              <p className="text-lg font-bold text-red-600 dark:text-red-500">
                                ₹{Object.entries(selectedMenuItems).reduce((sum, [itemId, qty]) => {
                                  const item = menuItems.find(m => m.id === itemId);
                                  return sum + (item ? item.price * qty : 0);
                                }, 0).toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-slate-600 dark:text-slate-400">Items Selected</span>
                              <p className="text-lg font-bold text-slate-900 dark:text-white">
                                {Object.values(selectedMenuItems).reduce((sum, qty) => sum + qty, 0)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <DialogFooter className="gap-2 pt-2">
                        <Button 
                          type="button" 
                          size="sm"
                          variant="outline" 
                          onClick={() => {
                            setDialogOpen(false);
                            setSelectedMenuItems({});
                          }}
                          disabled={loading}
                          className="h-9 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/50"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          size="sm" 
                          disabled={loading || Object.values(selectedMenuItems).reduce((sum, q) => sum + q, 0) === 0}
                          className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white h-9 min-w-[100px] disabled:opacity-50"
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-2"></div>
                              Adding...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                              Add Items
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>

          {/* Month/Year Filter */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex gap-2 flex-1">
              <Select 
                value={showAllTime ? 'all' : selectedMonth.toString()} 
                onValueChange={(value) => {
                  if (value === 'all') {
                    setShowAllTime(true);
                  } else {
                    setShowAllTime(false);
                    setSelectedMonth(parseInt(value));
                  }
                }}
              >
                <SelectTrigger className="h-9 w-full sm:w-[180px] dark:bg-[#1e293b] dark:border-slate-700/50 dark:text-white">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent className="dark:bg-[#1e293b] dark:border-slate-700">
                  <SelectItem value="all">All Time</SelectItem>
                  {months.map((month, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {!showAllTime && (
                <Select 
                  value={selectedYear.toString()} 
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                  <SelectTrigger className="h-9 w-full sm:w-[120px] dark:bg-[#1e293b] dark:border-slate-700/50 dark:text-white">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#1e293b] dark:border-slate-700">
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="text-xs text-slate-600 dark:text-slate-400 sm:text-right">
              Showing <span className="font-semibold text-slate-900 dark:text-white">{filteredEntries.length}</span> of <span className="font-semibold">{entries.length}</span> entries
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 sticky top-0 z-10 bg-slate-50 dark:bg-[#0a0f1e] py-2">
            <Card className={`border-l-4 ${prepaidBalance >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'} dark:bg-[#1e293b] dark:border-slate-800/50`}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {prepaidBalance >= 0 ? 'Prepaid Balance' : 'Postpaid Debt'}
                    </p>
                    <h3 className={`text-xl font-bold mt-0.5 ${prepaidBalance >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                      ₹{Math.abs(prepaidBalance).toFixed(0)}
                    </h3>
                  </div>
                  <IndianRupee className={`h-5 w-5 ${prepaidBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500 dark:bg-[#1e293b] dark:border-slate-800/50">
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {showAllTime ? 'Total Expenses' : 'Period Expenses'}
                    </p>
                    <h3 className="text-xl font-bold mt-0.5 text-red-600 dark:text-red-500">₹{totalDebits.toFixed(0)}</h3>
                  </div>
                  <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400 rotate-180" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500 dark:bg-[#1e293b] dark:border-slate-800/50">
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {showAllTime ? 'Total Entries' : 'Period Entries'}
                    </p>
                    <h3 className="text-xl font-bold mt-0.5 text-slate-900 dark:text-white">{filteredEntries.length}</h3>
                  </div>
                  <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500 dark:bg-[#1e293b] dark:border-slate-800/50">
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {showAllTime ? 'Total Top-ups' : 'Period Top-ups'}
                    </p>
                    <h3 className="text-xl font-bold mt-0.5 text-emerald-600 dark:text-emerald-500">₹{totalCredits.toFixed(0)}</h3>
                  </div>
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Entries Table */}
          <Card className="dark:bg-transparent dark:border-slate-800/50 border-0">
            <CardContent className="p-0">
              {pageLoading ? (
                <div className="space-y-3 p-4">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : sortedEntries.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-sm mb-1 text-slate-900 dark:text-white">
                    {entries.length === 0 ? 'No entries yet' : 'No entries for this period'}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                    {entries.length === 0 
                      ? 'Start tracking payments by adding the first entry' 
                      : `No entries found for ${months[selectedMonth]} ${selectedYear}. Try selecting a different period or add a new entry.`
                    }
                  </p>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white h-9">
                        <Plus className="h-4 w-4 mr-2" />
                        {entries.length === 0 ? 'Add First Entry' : 'Add Entry'}
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-slate-200 dark:border-slate-800 hover:bg-transparent">
                        <TableHead className="h-9 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('entry_date')}
                            className="h-7 flex items-center gap-1 hover:text-red-600 dark:hover:text-red-400 transition-colors -ml-3 text-xs font-semibold"
                          >
                            <Calendar className="h-3.5 w-3.5" />
                            Date
                            <ArrowUpDown className="h-3 w-3 opacity-50" />
                          </Button>
                        </TableHead>
                        <TableHead className="h-9 text-xs font-semibold text-slate-700 dark:text-slate-300">Type</TableHead>
                        <TableHead className="h-9 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort('amount')}
                            className="h-7 flex items-center gap-1 ml-auto hover:text-red-600 dark:hover:text-red-400 transition-colors text-xs font-semibold"
                          >
                            <IndianRupee className="h-3.5 w-3.5" />
                            Amount
                            <ArrowUpDown className="h-3 w-3 opacity-50" />
                          </Button>
                        </TableHead>
                        <TableHead className="h-9 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">Balance</TableHead>
                        <TableHead className="h-9 text-xs font-semibold text-slate-700 dark:text-slate-300">Note</TableHead>
                        <TableHead className="h-9 text-center text-xs font-semibold text-slate-700 dark:text-slate-300">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedEntries.map((en) => (
                        <TableRow key={en.id} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <TableCell className="py-2">
                            <div>
                              <div className="text-sm font-medium text-slate-900 dark:text-white">
                                {new Date(en.entry_date).toLocaleDateString('en-IN', { 
                                  day: '2-digit',
                                  month: 'short', 
                                  year: 'numeric' 
                                })}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {new Date(en.entry_date).toLocaleDateString('en-IN', { weekday: 'short' })}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <Badge 
                              variant="secondary"
                              className={en.entry_type === 'credit'
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-0 text-xs px-2'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-0 text-xs px-2'
                              }
                            >
                              <TrendingUp className={`h-3 w-3 mr-1 ${en.entry_type === 'debit' ? 'rotate-180' : ''}`} />
                              {en.entry_type === 'credit' ? 'Credit' : 'Debit'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right py-2">
                            <span className={`text-sm font-semibold ${en.entry_type === 'credit' ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                              {en.entry_type === 'credit' ? '+' : '-'}₹{Number(en.amount).toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right py-2">
                            <span className={`text-sm font-semibold ${(en.balance_after !== null && en.balance_after >= 0) ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                              ₹{en.balance_after !== null ? Number(en.balance_after).toFixed(2) : '—'}
                            </span>
                          </TableCell>
                          <TableCell className="py-2">
                            {en.note ? (
                              <span className="text-xs text-slate-600 dark:text-slate-400 italic line-clamp-2 max-w-xs">{en.note}</span>
                            ) : (
                              <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center py-2">
                            <Button 
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(en)}
                              className="h-7 px-2 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="border-t border-slate-300 dark:border-slate-600 hover:bg-transparent">
                        <TableCell colSpan={2} className="font-semibold text-sm text-slate-900 dark:text-white py-2">
                          Total <Badge variant="secondary" className="ml-2 text-xs px-2">{sortedEntries.length} {sortedEntries.length === 1 ? 'entry' : 'entries'}</Badge>
                        </TableCell>
                        <TableCell className="text-right py-2">
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-slate-600 dark:text-slate-400">
                              {showAllTime ? 'Total Expenses' : 'Period Expenses'}
                            </span>
                            <span className="text-sm font-bold text-red-600 dark:text-red-500">-₹{totalDebits.toFixed(2)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-2">
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-slate-600 dark:text-slate-400">Current Balance</span>
                            <span className={`text-sm font-bold ${prepaidBalance >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>₹{prepaidBalance.toFixed(2)}</span>
                          </div>
                        </TableCell>
                        <TableCell colSpan={2}></TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Delete Entry Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[450px] dark:bg-[#1e293b] dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-2xl text-red-600 dark:text-red-500 flex items-center gap-2">
                <AlertCircle className="h-6 w-6" />
                Delete Entry?
              </DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-400">
                This action cannot be undone. The balance will be recalculated.
              </DialogDescription>
            </DialogHeader>
            
            {entryToDelete && (
              <div className="space-y-4 py-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Date</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {new Date(entryToDelete.entry_date).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Type</span>
                    <Badge 
                      variant="secondary"
                      className={entryToDelete.entry_type === 'credit'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-0'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-0'
                      }
                    >
                      {entryToDelete.entry_type === 'credit' ? 'Credit' : 'Debit'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Amount</span>
                    <span className={`text-lg font-bold ${
                      entryToDelete.entry_type === 'credit' 
                        ? 'text-emerald-600 dark:text-emerald-500' 
                        : 'text-red-600 dark:text-red-500'
                    }`}>
                      {entryToDelete.entry_type === 'credit' ? '+' : '-'}₹{Number(entryToDelete.amount).toFixed(2)}
                    </span>
                  </div>
                  
                  {entryToDelete.note && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Note:</span>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{entryToDelete.note}</p>
                    </div>
                  )}
                </div>
                
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800 dark:text-amber-300">
                      <p className="font-semibold mb-1">Balance Impact:</p>
                      <p>
                        {entryToDelete.entry_type === 'credit' 
                          ? `Balance will decrease by ₹${Number(entryToDelete.amount).toFixed(2)}` 
                          : `Balance will increase by ₹${Number(entryToDelete.amount).toFixed(2)}`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setEntryToDelete(null);
                }}
                disabled={deleteLoading}
                className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/50"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={deleteEntry}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700 text-white min-w-[100px]"
              >
                {deleteLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Entry
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Edit Student Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px] dark:bg-[#1e293b] dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-2xl text-red-600 dark:text-red-500">Edit Student Details</DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-400">
                Update student information. Roll number must be unique.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={updateStudent} className="space-y-5 py-4">
              {editError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="text-sm font-medium">{editError}</p>
                </div>
              )}

              {editSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <p className="text-sm font-medium">Student updated successfully!</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-slate-700 dark:text-slate-300 font-medium">
                  Student Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <Input 
                    id="edit-name"
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)} 
                    required 
                    placeholder="Enter full name" 
                    className="pl-10 h-11 dark:bg-[#0f172a] dark:border-slate-700/50 dark:text-white"
                    disabled={editLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-rollNumber" className="text-slate-700 dark:text-slate-300 font-medium">
                  Roll Number <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <Input 
                    id="edit-rollNumber"
                    value={editRollNumber} 
                    onChange={(e) => setEditRollNumber(e.target.value)} 
                    required 
                    placeholder="e.g. 2024001" 
                    className="pl-10 h-11 dark:bg-[#0f172a] dark:border-slate-700/50 dark:text-white"
                    disabled={editLoading}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Must be unique for each student</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phoneNumber" className="text-slate-700 dark:text-slate-300 font-medium">
                  Phone Number <span className="text-slate-400">(Optional)</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <Input 
                    id="edit-phoneNumber"
                    value={editPhoneNumber} 
                    onChange={(e) => setEditPhoneNumber(e.target.value)} 
                    type="tel"
                    placeholder="e.g. 9876543210" 
                    className="pl-10 h-11 dark:bg-[#0f172a] dark:border-slate-700/50 dark:text-white"
                    disabled={editLoading}
                  />
                </div>
              </div>

              <DialogFooter className="gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  disabled={editLoading}
                  className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/50"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={editLoading}
                  className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white min-w-[120px]"
                >
                  {editLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}