"use client";

import React, { useState } from "react";

import { useCanteen } from "@/lib/canteen-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, Hash, CheckCircle2, AlertCircle, UserPlus } from "lucide-react";

export default function KhataForm({ onCreated }: { onCreated?: () => void }) {
  const { selectedCanteen } = useCanteen();
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function createStudent(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    setSuccess(false);

    if (!name.trim() || !rollNumber.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    if (!selectedCanteen) {
      setError("Please select a kitchen first");
      return;
    }

    setLoading(true);

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
          },
        }),
      });

      const dbRes = await res.json();

      setLoading(false);

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
      setLoading(false);
      setError("Network error. Please try again.");
      return;
    }

    setSuccess(true);
    setName("");
    setRollNumber("");

    setTimeout(() => {
      onCreated?.();
    }, 800);
  }

  return (
    <form
      onSubmit={createStudent}
      className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 animate-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 animate-in slide-in-from-top-2">
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Success!</p>
            <p className="text-sm">Student added successfully!</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label
          htmlFor="name"
          className="text-slate-700 dark:text-slate-300 font-medium">
          Student Name <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Enter full name"
            className="pl-11 h-12 text-base dark:bg-[#0f172a] dark:border-slate-700/50 dark:text-white focus:ring-2 focus:ring-red-500 dark:focus:ring-red-500 transition-all"
            disabled={loading}
          />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 pl-1">
          Enter the student's full legal name
        </p>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="rollNumber"
          className="text-slate-700 dark:text-slate-300 font-medium">
          Roll Number <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
          <Input
            id="rollNumber"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            required
            placeholder="e.g. 2024001"
            className="pl-11 h-12 text-base dark:bg-[#0f172a] dark:border-slate-700/50 dark:text-white focus:ring-2 focus:ring-red-500 dark:focus:ring-red-500 transition-all"
            disabled={loading}
          />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 pl-1">
          Must be unique for each student
        </p>
      </div>

      <div className="flex justify-end pt-4 gap-3">
        <Button
          type="submit"
          disabled={loading}
          className="min-w-[140px] h-11 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white font-medium shadow-lg hover:shadow-xl transition-all">
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Save Student
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
