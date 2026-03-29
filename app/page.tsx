import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, UtensilsCrossed, Monitor, TrendingUp } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-full bg-slate-50 dark:bg-[#0a0f1e]">
      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="text-xl text-red-600 dark:text-red-500">Modern Kitchen Management System</p>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Order Taking Card */}
          <Card className="hover:shadow-xl transition-all cursor-pointer border border-slate-200 dark:border-slate-800/50 hover:border-red-400 dark:hover:border-red-500 group bg-white dark:bg-[#1e293b]">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-800/40 transition-all">
                  <ClipboardList className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <CardTitle className="text-xl text-slate-800 dark:text-slate-100">Order Taking</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">Take orders & manage billing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Complete order management: Take orders, edit items, update status, and print receipts.
              </p>
              <Link href="/orders/take" className="block">
                <Button className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white font-semibold shadow-md">
                  Open Orders
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Menu Management Card */}
          <Card className="hover:shadow-xl transition-all cursor-pointer border border-slate-200 dark:border-slate-800/50 hover:border-red-400 dark:hover:border-red-500 group bg-white dark:bg-[#1e293b]">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-800/40 transition-all">
                  <UtensilsCrossed className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <CardTitle className="text-xl text-slate-800 dark:text-slate-100">Menu Management</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">Manage your menu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Add, edit, or delete menu items. Update pricing and manage your catalog.
              </p>
              <Link href="/menu-v2" className="block">
                <Button className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white font-semibold shadow-md">
                  Manage Menu
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Display Board Card */}
          <Card className="hover:shadow-xl transition-all cursor-pointer border border-slate-200 dark:border-slate-800/50 hover:border-blue-400 dark:hover:border-blue-500 group bg-white dark:bg-[#1e293b]">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-all">
                  <Monitor className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <CardTitle className="text-xl text-slate-800 dark:text-slate-100">Customer Display</CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">Public order board</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Large display board for customers to track their order status in real-time.
              </p>
              <Link href="/display" target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold shadow-md">
                  Open Display
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800/50 hover:border-red-300 dark:hover:border-red-500 transition-all">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600 dark:text-red-500 mb-1">3</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Main Modules</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800/50 hover:border-red-300 dark:hover:border-red-500 transition-all">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600 dark:text-red-500 mb-1">∞</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Menu Items</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800/50 hover:border-emerald-300 dark:hover:border-emerald-500 transition-all">
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-500 mx-auto mb-1" />
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Real-time Updates</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800/50 hover:border-blue-300 dark:hover:border-blue-500 transition-all">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-500 mb-1">✓</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Print Ready</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">Made with ❤️ by Shahid & Sohail</p>
        </div>
      </div>
    </div>
  );
}
