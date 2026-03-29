import React from 'react'
import KhataList from '@/components/khata-list'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

export const metadata = {
  title: 'Khata — Student Records',
  description: 'Manage student payment records and billing',
}

export default function KhataPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-red-600 dark:text-red-500 mb-2">
              Khata Management
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Manage student payment records, track daily and monthly entries
            </p>
          </div>
          <Link href="/">
            <Button variant="outline" className="gap-2 dark:border-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-800/50 transition-colors">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Home</span>
            </Button>
          </Link>
        </div>

        <KhataList />
      </div>
    </div>
  )
}
