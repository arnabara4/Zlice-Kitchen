"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  ChevronLeft, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  ChefHat, 
  Calendar,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function VerificationReviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const canteenId = searchParams.get("id");
  
  const [canteen, setCanteen] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (canteenId) {
      fetchCanteen();
    }
  }, [canteenId]);

  const fetchCanteen = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/canteens/${canteenId}`);
      if (!response.ok) throw new Error("Failed to fetch canteen");
      const data = await response.json();
      setCanteen(data);
    } catch (err) {
      console.error(err);
      toast.error("Error loading canteen details");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: "approve" | "reject") => {
    setActionLoading(true);
    const toastId = toast.loading(`${action === 'approve' ? 'Approving' : 'Rejecting'}...`);
    
    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canteenId, action }),
      });

      if (!response.ok) throw new Error("Action failed");

      toast.success(`Canteen ${action === 'approve' ? 'approved' : 'rejected'} successfully`, { id: toastId });
      router.push("/admin/canteens");
    } catch (err) {
      console.error(err);
      toast.error(`Failed to ${action} canteen`, { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="h-8 w-8 animate-spin text-red-600" /></div>;
  if (!canteen) return <div className="min-h-screen flex items-center justify-center">Canteen not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight">{canteen.name}</h1>
                <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pending Review</Badge>
              </div>
              <p className="text-slate-500 font-medium mt-1">Reviewing legal undertaking and video verification</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="h-12 px-6 border-red-200 text-red-600 hover:bg-red-50 gap-2 font-bold"
              onClick={() => handleAction("reject")}
              disabled={actionLoading}
            >
              <XCircle className="h-5 w-5" />
              Reject & Request Resubmission
            </Button>
            <Button 
              className="h-12 px-8 bg-green-600 hover:bg-green-700 text-white gap-2 font-bold shadow-lg shadow-green-900/10"
              onClick={() => handleAction("approve")}
              disabled={actionLoading}
            >
              <CheckCircle2 className="h-5 w-5" />
              Approve Partner
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Video Section */}
          <div className="space-y-4">
             <Card className="border-0 shadow-2xl overflow-hidden bg-slate-900 rounded-3xl group">
               <CardHeader className="bg-slate-800/50 border-b border-slate-700/50 py-4">
                 <div className="flex items-center gap-2 text-slate-200">
                    <Play className="h-4 w-4 fill-current" />
                    <span className="text-xs font-bold uppercase tracking-widest">Verification Video</span>
                 </div>
               </CardHeader>
               <div className="aspect-video relative">
                 {canteen.verification_video_url ? (
                   <video 
                     src={canteen.verification_video_url} 
                     controls 
                     className="w-full h-full object-contain"
                   />
                 ) : (
                   <div className="absolute inset-0 flex items-center justify-center text-slate-500 italic">
                     No video uploaded
                   </div>
                 )}
               </div>
             </Card>

             <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800 flex gap-4">
                <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
                <div className="space-y-1">
                   <p className="font-bold text-amber-800 dark:text-amber-400">Review Checklist</p>
                   <ul className="text-sm text-amber-700 dark:text-amber-500 space-y-1 list-disc ml-4">
                      <li>Are the packaging items clearly visible?</li>
                      <li>Are they Disposable and Well Sealed as required?</li>
                      <li>Is the background a commercial/hostel kitchen space?</li>
                      <li>Are there any signs of duress or fraudulent behavior?</li>
                   </ul>
                </div>
             </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <Card className="border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl overflow-hidden">
               <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50">
                 <CardTitle className="text-xl font-bold flex items-center gap-2">
                   <User className="h-5 w-5 text-red-600" />
                   Submission Details
                 </CardTitle>
               </CardHeader>
               <CardContent className="pt-6 space-y-6">
                 <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Submitted Name</p>
                      <p className="text-lg font-bold">{canteen.name}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Submission Date</p>
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <Calendar className="h-4 w-4" />
                        <span className="font-semibold">{canteen.submitted_at ? new Date(canteen.submitted_at).toLocaleDateString() : 'N/A'}</span>
                      </div>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Email Address</p>
                      <p className="font-medium text-slate-600 dark:text-slate-400">{canteen.email}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Verification ID</p>
                      <p className="font-mono text-xs text-slate-400">#{canteen.id.slice(0,8)}...</p>
                   </div>
                 </div>

                 <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold uppercase text-slate-400 mb-4">Legal Undertaking Status</p>
                    <div className="space-y-3">
                       <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/50">
                          <div className="flex items-center gap-3">
                             <CheckCircle2 className="h-5 w-5 text-green-600" />
                             <span className="text-sm font-bold text-green-800 dark:text-green-400">Undertaking Accepted</span>
                          </div>
                          <span className="text-xs font-mono text-green-600/70">{canteen.undertaking_accepted_at ? new Date(canteen.undertaking_accepted_at).toLocaleTimeString() : ''}</span>
                       </div>
                    </div>
                 </div>
               </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl overflow-hidden">
               <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50">
                 <CardTitle className="text-xl font-bold flex items-center gap-2">
                   <Clock className="h-5 w-5 text-red-600" />
                   Canteen History
                 </CardTitle>
               </CardHeader>
               <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="text-xs font-bold uppercase text-slate-400">Joined Platform</p>
                        <p className="text-sm font-semibold">{new Date(canteen.created_at).toLocaleDateString()}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-xs font-bold uppercase text-slate-400">Total Orders</p>
                        <p className="text-xl font-black text-red-600">0</p>
                     </div>
                  </div>
               </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
