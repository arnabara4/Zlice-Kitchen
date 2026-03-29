"use client"

import React from 'react';
import { useRouter } from 'next/navigation';
import KhataForm from '@/components/khata-form';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserPlus, Info } from 'lucide-react';

export default function NewStudentPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1e]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => router.back()} 
              className="dark:hover:bg-slate-800/50 dark:border-slate-700/50 hover:scale-105 transition-transform"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <UserPlus className="h-8 w-8 text-red-600 dark:text-red-500" />
                <h1 className="text-3xl sm:text-4xl font-bold text-red-600 dark:text-red-500">Add New Student</h1>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">Register a new student to the khata system</p>
            </div>
          </div>

          {/* Info Card */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-300">
              <p className="font-medium mb-1">Quick Tip</p>
              <p className="text-blue-700 dark:text-blue-400">Make sure to verify the student's information before submitting. The roll number must be unique and cannot be changed later.</p>
            </div>
          </div>

          {/* Form Card */}
          <Card className="dark:bg-[#1e293b] dark:border-slate-800/50 shadow-xl">
            <CardHeader className="bg-linear-to-r from-slate-50 to-slate-100 dark:from-[#0f172a] dark:to-[#1e293b] border-b border-slate-200 dark:border-slate-700/50">
              <CardTitle className="text-xl text-red-600 dark:text-red-500 flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Student Information
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Enter the student's details below. All fields marked with <span className="text-red-500">*</span> are required.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8 pb-8">
              <KhataForm onCreated={() => router.push('/khata')} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
