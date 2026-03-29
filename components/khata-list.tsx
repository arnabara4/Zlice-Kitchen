"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";

import { useCanteen } from "@/lib/canteen-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Search,
  Plus,
  ArrowUpDown,
  Filter,
  Calendar,
  TrendingUp,
  Eye,
  User,
  Hash,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Pencil,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { KhataSkeleton } from "@/components/page-skeletons";

type Student = {
  id: string;
  name: string;
  roll_number: string;
  phone_number?: string;
};

type MonthlyStats = {
  currentMonth: number;
  lastMonth: number;
  total: number;
  entryCount: number;
};

type StudentWithStats = Student & MonthlyStats;

export default function KhataList() {
  const { selectedCanteen } = useCanteen();
  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<
    "name" | "roll_number" | "currentMonth" | "total"
  >("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [monthFilter, setMonthFilter] = useState<"current" | "last" | "all">(
    "current",
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] =
    useState<StudentWithStats | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function fetchStudents() {
    if (!selectedCanteen) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/khata", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch khata lists");
      const data = await res.json();
      setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStudents();
  }, [selectedCanteen]);

  async function createStudent(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    setSuccess(false);

    if (!name.trim() || !rollNumber.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    if (!selectedCanteen) {
      setError("Please select a canteen first");
      return;
    }

    setFormLoading(true);

    try {
      const res = await fetch("/api/khata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: "create",
          payload: {
            name: name.trim(),
            roll_number: rollNumber.trim(),
            phone_number: phoneNumber.trim() || undefined,
          },
        }),
      });

      const dbRes = await res.json();
      setFormLoading(false);

      if (!res.ok || dbRes.error) {
        if (dbRes.error?.includes("duplicate") || dbRes.code === "23505") {
          setError(
            "This roll number already exists. Please use a different one.",
          );
        } else {
          setError(dbRes.error || "Failed to add student. Please try again.");
        }
        return;
      }
    } catch (err) {
      setFormLoading(false);
      setError("Network error. Please try again.");
      return;
    }

    setSuccess(true);
    setName("");
    setRollNumber("");
    setPhoneNumber("");

    // Refresh the list and close dialog
    setTimeout(() => {
      fetchStudents();
      setDialogOpen(false);
      setSuccess(false);
    }, 1000);
  }

  async function deleteStudent() {
    if (!studentToDelete) return;

    setDeleteLoading(true);

    try {
      const res = await fetch("/api/khata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: "delete",
          payload: { khata_id: studentToDelete.id },
        }),
      });

      const dbRes = await res.json();
      setDeleteLoading(false);

      if (!res.ok || dbRes.error) {
        console.error("Error deleting student:", dbRes.error);
        return;
      }
    } catch (err) {
      setDeleteLoading(false);
      console.error("Network error deleting student:", err);
      return;
    }

    // Refresh list and close dialog
    setDeleteDialogOpen(false);
    setStudentToDelete(null);
    fetchStudents();
  }

  // Filtering and sorting
  const filteredAndSorted = useMemo(() => {
    let filtered = students.filter(
      (s) =>
        s.name.toLowerCase().includes(filter.toLowerCase()) ||
        s.roll_number.toLowerCase().includes(filter.toLowerCase()),
    );

    // Apply month filter
    if (monthFilter !== "all") {
      filtered = filtered.filter((s) => {
        if (monthFilter === "current") return s.currentMonth > 0;
        if (monthFilter === "last") return s.lastMonth > 0;
        return true;
      });
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return sorted;
  }, [students, filter, sortField, sortDirection, monthFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      totalStudents: students.length,
      activeStudents: students.filter((s) => s.currentMonth > 0).length,
      totalCurrentMonth: students.reduce((sum, s) => sum + s.currentMonth, 0),
      totalLastMonth: students.reduce((sum, s) => sum + s.lastMonth, 0),
      totalAllTime: students.reduce((sum, s) => sum + s.total, 0),
      totalEntries: students.reduce((sum, s) => sum + s.entryCount, 0),
    };
  }, [students]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Name",
      "Roll Number",
      "Current Month",
      "Last Month",
      "Total",
      "Entries",
    ];
    const rows = filteredAndSorted.map((s) => [
      s.name,
      s.roll_number,
      s.currentMonth.toFixed(2),
      s.lastMonth.toFixed(2),
      s.total.toFixed(2),
      s.entryCount.toString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `khata-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const now = new Date();
  const currentMonthName = now.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  const lastMonthName = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
  ).toLocaleString("default", { month: "long", year: "numeric" });

  if (loading && students.length === 0) {
    return (
      <div className="space-y-6">
        <KhataSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Card className="border-l-4 border-l-red-500 dark:bg-[#1e293b] dark:border-slate-800/50">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Total Students
                </p>
                <h3 className="text-xl font-bold mt-0.5 text-slate-900 dark:text-white">
                  {stats.totalStudents}
                </h3>
              </div>
              <Users className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 dark:bg-[#1e293b] dark:border-slate-800/50">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Active This Month
                </p>
                <h3 className="text-xl font-bold mt-0.5 text-slate-900 dark:text-white">
                  {stats.activeStudents}
                </h3>
              </div>
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 dark:bg-[#1e293b] dark:border-slate-800/50">
          <CardContent className="pt-3 pb-3">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {currentMonthName}
              </p>
              <h3 className="text-xl font-bold mt-0.5 text-emerald-600 dark:text-emerald-500">
                ₹{stats.totalCurrentMonth.toFixed(0)}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 dark:bg-[#1e293b] dark:border-slate-800/50">
          <CardContent className="pt-3 pb-3">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {lastMonthName}
              </p>
              <h3 className="text-xl font-bold mt-0.5 text-red-600 dark:text-red-500">
                ₹{stats.totalLastMonth.toFixed(0)}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 dark:bg-[#1e293b] dark:border-slate-800/50">
          <CardContent className="pt-3 pb-3">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                All Time Total
              </p>
              <h3 className="text-xl font-bold mt-0.5 text-purple-600 dark:text-purple-500">
                ₹{stats.totalAllTime.toFixed(0)}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col lg:flex-row gap-2 items-stretch lg:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search by name or roll number..."
            className="pl-9 h-9 text-sm dark:bg-[#1e293b] dark:border-slate-700/50 focus:ring-2 focus:ring-red-500 dark:focus:ring-red-500 transition-all"
          />
        </div>

        {/* Month Filter */}
        <div className="flex items-center gap-2">
          <Select
            value={monthFilter}
            onValueChange={(value: any) => setMonthFilter(value)}>
            <SelectTrigger className="h-9 w-[180px] text-sm dark:bg-[#1e293b] dark:border-slate-700/50 dark:text-white">
              <SelectValue placeholder="Filter students" />
            </SelectTrigger>
            <SelectContent className="dark:bg-[#1e293b] dark:border-slate-700">
              <SelectItem
                value="all"
                className="text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" />
                  All Students
                </div>
              </SelectItem>
              <SelectItem
                value="current"
                className="text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Current Month Active
                </div>
              </SelectItem>
              <SelectItem
                value="last"
                className="text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  Last Month Active
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Add Student Dialog */}
        <Dialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full lg:w-auto bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white h-9 px-4 text-sm font-medium">
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] dark:bg-[#1e293b] dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-2xl text-red-600 dark:text-red-500">
                Add New Student
              </DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-400">
                Register a new student to the khata system. Make sure the roll
                number is unique.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={createStudent}
              className="space-y-5 py-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <p className="text-sm font-medium">
                    Student added successfully!
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="dialog-name"
                  className="text-slate-700 dark:text-slate-300 font-medium">
                  Student Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <Input
                    id="dialog-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Enter full name"
                    className="pl-10 h-11 dark:bg-[#0f172a] dark:border-slate-700/50 dark:text-white"
                    disabled={formLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="dialog-rollNumber"
                  className="text-slate-700 dark:text-slate-300 font-medium">
                  Roll Number <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <Input
                    id="dialog-rollNumber"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    required
                    placeholder="e.g. 2024001"
                    className="pl-10 h-11 dark:bg-[#0f172a] dark:border-slate-700/50 dark:text-white"
                    disabled={formLoading}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Must be unique for each student
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="dialog-phoneNumber"
                  className="text-slate-700 dark:text-slate-300 font-medium">
                  Phone Number{" "}
                  <span className="text-slate-400">(Optional)</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <Input
                    id="dialog-phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    type="tel"
                    placeholder="e.g. 9876543210"
                    className="pl-10 h-11 dark:bg-[#0f172a] dark:border-slate-700/50 dark:text-white"
                    disabled={formLoading}
                  />
                </div>
              </div>

              <DialogFooter className="gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={formLoading}
                  className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/50">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={formLoading}
                  className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white min-w-[120px]">
                  {formLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Student
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table View */}
      <Card className="dark:bg-transparent dark:border-slate-800/50 border-0">
        <CardContent className="p-0">
          {students.length === 0 ? (
            <div className="p-12 text-center">
              <div className="h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                <Users className="h-10 w-10 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">
                No students yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Get started by adding your first student
              </p>

              <Dialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full lg:w-auto bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white h-9 px-4 text-sm font-medium">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Student
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] dark:bg-[#1e293b] dark:border-slate-800">
                  <DialogHeader>
                    <DialogTitle className="text-2xl text-red-600 dark:text-red-500">
                      Add First Student
                    </DialogTitle>
                    <DialogDescription className="text-slate-600 dark:text-slate-400">
                      Register a new student to the khata system. Make sure the
                      roll number is unique.
                    </DialogDescription>
                  </DialogHeader>

                  <form
                    onSubmit={createStudent}
                    className="space-y-5 py-4">
                    {error && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                      </div>
                    )}

                    {success && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <p className="text-sm font-medium">
                          Student added successfully!
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label
                        htmlFor="dialog-name"
                        className="text-slate-700 dark:text-slate-300 font-medium">
                        Student Name <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                        <Input
                          id="dialog-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          placeholder="Enter full name"
                          className="pl-10 h-11 dark:bg-[#0f172a] dark:border-slate-700/50 dark:text-white"
                          disabled={formLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="dialog-rollNumber"
                        className="text-slate-700 dark:text-slate-300 font-medium">
                        Roll Number <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                        <Input
                          id="dialog-rollNumber"
                          value={rollNumber}
                          onChange={(e) => setRollNumber(e.target.value)}
                          required
                          placeholder="e.g. 2024001"
                          className="pl-10 h-11 dark:bg-[#0f172a] dark:border-slate-700/50 dark:text-white"
                          disabled={formLoading}
                        />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Must be unique for each student
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="dialog-phoneNumber"
                        className="text-slate-700 dark:text-slate-300 font-medium">
                        Phone Number{" "}
                        <span className="text-slate-400">(Optional)</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                        <Input
                          id="dialog-phoneNumber"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          type="tel"
                          placeholder="e.g. 9876543210"
                          className="pl-10 h-11 dark:bg-[#0f172a] dark:border-slate-700/50 dark:text-white"
                          disabled={formLoading}
                        />
                      </div>
                    </div>

                    <DialogFooter className="gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                        disabled={formLoading}
                        className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/50">
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={formLoading}
                        className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white min-w-[120px]">
                        {formLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Student
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="p-12 text-center">
              <Search className="h-12 w-12 mx-auto text-slate-400 dark:text-slate-500 mb-3" />
              <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">
                No students found
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Try adjusting your filters or search terms
              </p>
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
                        onClick={() => handleSort("name")}
                        className="h-7 flex items-center gap-1 hover:text-red-600 dark:hover:text-red-400 transition-colors -ml-3 text-xs font-semibold">
                        <User className="h-3.5 w-3.5" />
                        Student Name
                        <ArrowUpDown className="h-3 w-3 opacity-50" />
                      </Button>
                    </TableHead>
                    <TableHead className="h-9 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("roll_number")}
                        className="h-7 flex items-center gap-1 hover:text-red-600 dark:hover:text-red-400 transition-colors -ml-3 text-xs font-semibold">
                        <Hash className="h-3.5 w-3.5" />
                        Roll Number
                        <ArrowUpDown className="h-3 w-3 opacity-50" />
                      </Button>
                    </TableHead>
                    <TableHead className="h-9 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("currentMonth")}
                        className="h-7 flex items-center gap-1 ml-auto hover:text-red-600 dark:hover:text-red-400 transition-colors text-xs font-semibold">
                        <Calendar className="h-3.5 w-3.5" />
                        Current
                        <ArrowUpDown className="h-3 w-3 opacity-50" />
                      </Button>
                    </TableHead>
                    <TableHead className="h-9 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Last Month
                    </TableHead>
                    <TableHead className="h-9 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("total")}
                        className="h-7 flex items-center gap-1 ml-auto hover:text-red-600 dark:hover:text-red-400 transition-colors text-xs font-semibold">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Total
                        <ArrowUpDown className="h-3 w-3 opacity-50" />
                      </Button>
                    </TableHead>
                    <TableHead className="h-9 text-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Entries
                    </TableHead>
                    <TableHead className="h-9 text-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSorted.map((student) => {
                    const hasCurrentActivity = student.currentMonth > 0;
                    const growth =
                      student.lastMonth > 0
                        ? ((student.currentMonth - student.lastMonth) /
                            student.lastMonth) *
                          100
                        : 0;

                    return (
                      <TableRow
                        key={student.id}
                        className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                        onClick={() =>
                          (window.location.href = `/khata/${student.id}`)
                        }>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                                hasCurrentActivity
                                  ? "bg-emerald-500 text-white"
                                  : "bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300"
                              }`}>
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-sm text-slate-900 dark:text-white">
                                {student.name}
                              </div>
                              {hasCurrentActivity && (
                                <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                                  <span className="h-1 w-1 rounded-full bg-emerald-500"></span>
                                  Active
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                            {student.roll_number}
                          </span>
                        </TableCell>
                        <TableCell className="text-right py-2">
                          <div>
                            <div className="font-semibold text-sm text-slate-900 dark:text-white">
                              ₹{student.currentMonth.toFixed(0)}
                            </div>
                            {student.lastMonth > 0 && growth !== 0 && (
                              <div
                                className={`text-xs flex items-center justify-end gap-0.5 ${
                                  growth > 0
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-emerald-600 dark:text-emerald-400"
                                }`}>
                                <TrendingUp
                                  className={`h-2.5 w-2.5 ${growth < 0 ? "rotate-180" : ""}`}
                                />
                                {Math.abs(growth).toFixed(0)}%
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-2">
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            ₹{student.lastMonth.toFixed(0)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right py-2">
                          <span className="font-semibold text-sm text-slate-900 dark:text-white">
                            ₹{student.total.toFixed(0)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <Badge
                            variant="secondary"
                            className="text-xs font-medium px-2 py-0">
                            {student.entryCount}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className="text-center py-2"
                          onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <Link href={`/khata/${student.id}`}>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                View
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setStudentToDelete(student);
                                setDeleteDialogOpen(true);
                              }}
                              className="h-7 px-2 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[450px] dark:bg-[#1e293b] dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-2xl text-red-600 dark:text-red-500">
              Delete Student
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              Are you sure you want to delete this student? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          {studentToDelete && (
            <div className="py-4 space-y-3">
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800 dark:text-red-300">
                    <p className="font-semibold mb-1">
                      Warning: This will permanently delete:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-1">
                      <li>
                        Student: <strong>{studentToDelete.name}</strong>
                      </li>
                      <li>
                        Roll Number:{" "}
                        <strong>{studentToDelete.roll_number}</strong>
                      </li>
                      <li>
                        All {studentToDelete.entryCount} khata entries (₹
                        {studentToDelete.total.toFixed(0)} total)
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setStudentToDelete(null);
              }}
              disabled={deleteLoading}
              className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/50">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={deleteStudent}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white min-w-[120px]">
              {deleteLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Student
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
