"use client";

import React, { useState, useMemo, useCallback, memo } from "react";
import { CheckCircle2, ChevronRight, ChevronLeft, ShieldCheck, AlertTriangle, FileText, Camera, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// --- STEP COMPONENTS ---

const StepHeader = ({ title, icon: Icon, colorClass = "text-red-600" }: { title: string, icon: any, colorClass?: string }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-800 ${colorClass}`}>
      <Icon className="h-6 w-6" />
    </div>
    <h2 className="text-2xl font-bold">{title}</h2>
  </div>
);

const Clause = ({ title, content, severity, id, checked, onToggle }: { 
  title: string, 
  content: string, 
  severity: "Severe" | "Important" | "Standard",
  id: string,
  checked: boolean,
  onToggle: (checked: boolean) => void
}) => {
  const severityColors = {
    Severe: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
    Important: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    Standard: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
  };

  return (
    <div className="mb-6 md:mb-8 border rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800">
      <div className={`px-4 py-2.5 border-b flex justify-between items-center ${severityColors[severity]}`}>
        <span className="text-[10px] md:text-sm font-bold tracking-tight uppercase">{title}</span>
        <span className="text-[9px] md:text-xs font-semibold px-2 py-0.5 rounded-full border border-current">{severity}</span>
      </div>
      <div className="p-4 md:p-6">
        <p className="text-sm md:text-base text-slate-700 dark:text-slate-300 leading-relaxed mb-6 whitespace-pre-wrap">{content}</p>
        <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-all hover:bg-slate-100 dark:hover:bg-slate-800">
          <Checkbox 
            id={id} 
            checked={checked} 
            onCheckedChange={(val) => onToggle(!!val)}
            className="mt-0.5 h-5 w-5 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
          />
          <Label htmlFor={id} className="text-xs md:text-sm font-semibold cursor-pointer select-none leading-snug">
            {content.split("\n").pop()?.includes("I understand") || content.split("\n").pop()?.includes("I accept") || content.split("\n").pop()?.includes("I commit") 
              ? content.split("\n").pop() 
              : "I have read and accept this clause."}
          </Label>
        </div>
      </div>
    </div>
  );
};

// --- STEP 1: FOOD SAFETY & HYGIENE ---
export const StepFoodSafety = memo(({ data, onUpdate }: { data: any, onUpdate: (update: any) => void }) => {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <StepHeader title="Food Safety & Hygiene" icon={ShieldCheck} />
      
      <Clause 
        title="CLAUSE 1 — Food Safety & Hygiene"
        severity="Severe"
        id="clause_1"
        checked={data.clause_1}
        onToggle={(val) => onUpdate({ clause_1: val })}
        content="As a kitchen partner on Zlice, you are responsible for ensuring that all food prepared and supplied through the platform is fresh, hygienic, and safe for consumption. This includes the quality of ingredients, cleanliness of the cooking area, hygiene during preparation, and proper packaging and sealing before handoff to the delivery partner.
I commit to ensuring food safety and hygiene as per Clause 1."
      />

      <Clause 
        title="CLAUSE 2 — Health Incidents"
        severity="Severe"
        id="clause_2"
        checked={data.clause_2}
        onToggle={(val) => onUpdate({ clause_2: val })}
        content="In the event that a student reports a health concern linked to food supplied from your kitchen, Zlice will first communicate directly with you to understand the situation. You agree to cooperate fully and provide any relevant information requested. Where the concern is serious and requires further action, Zlice reserves the right to temporarily suspend your kitchen on the platform pending a review.
I understand and agree to the health incident protocol in Clause 2."
      />
    </div>
  );
});

// --- STEP 2: ORDER FULFILMENT & PENALTY ---
export const StepOrderFulfilment = memo(({ data, onUpdate }: { data: any, onUpdate: (update: any) => void }) => {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <StepHeader title="Order Fulfilment & Penalty" icon={AlertTriangle} colorClass="text-amber-600" />
      
      <Clause 
        title="CLAUSE 3 — Accepted Orders Must Be Fulfilled"
        severity="Important"
        id="clause_3"
        checked={data.clause_3}
        onToggle={(val) => onUpdate({ clause_3: val })}
        content="Once you accept an order on the Zlice platform, you are obligated to prepare and dispatch it within the committed time. Cancelling an accepted order without a valid reason is not permitted and will attract a penalty as per the schedule below.
I understand that accepted orders must be fulfilled as per Clause 3."
      />

      <div className="mb-8 border rounded-xl bg-slate-900 text-white p-6 shadow-xl border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-red-500 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            CLAUSE 4 — Penalty Schedule
          </h3>
          <span className="text-[9px] md:text-xs font-semibold px-2 py-0.5 rounded-full border border-amber-500 text-amber-500 uppercase tracking-widest">Important</span>
        </div>
        <p className="text-sm text-slate-400 mb-6 italic">The following penalties apply and will be deducted from your earnings:</p>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] md:text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="pb-3 pr-4 font-bold text-slate-400">Violation Instance</th>
                <th className="pb-3 px-4 font-bold text-slate-400">Penalty / Deduction</th>
                <th className="pb-3 pl-4 font-bold text-slate-400">Action Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr>
                <td className="py-3 pr-4">Cancelling accepted order (1st)</td>
                <td className="py-3 px-4">Full order value + gateway charges</td>
                <td className="py-3 pl-4">Warning issued</td>
              </tr>
              <tr>
                <td className="py-3 pr-4">Cancelling accepted order (2nd)</td>
                <td className="py-3 px-4">Full order value + Rs. 50</td>
                <td className="py-3 pl-4">Penalty deducted</td>
              </tr>
              <tr>
                <td className="py-3 pr-4">Delayed preparation</td>
                <td className="py-3 px-4 text-amber-400">-Rs. 15 per instance</td>
                <td className="py-3 pl-4">Auto-deducted</td>
              </tr>
              <tr>
                <td className="py-3 pr-4">Wrong item / Quality complaint</td>
                <td className="py-3 px-4">Full refund to student</td>
                <td className="py-3 pl-4">Deducted from earnings</td>
              </tr>
              <tr>
                <td className="py-3 pr-4">Foreign object / Severe incident</td>
                <td className="py-3 px-4 text-red-400">Full refund + Rs. 100</td>
                <td className="py-3 pl-4 font-bold text-red-400 leading-tight">Suspension pending review</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-black">Three strikes (30 days)</td>
                <td className="py-3 px-4 font-black text-red-500 uppercase">Termination</td>
                <td className="py-3 pl-4 font-black text-red-500 leading-tight uppercase">Permanent Removal</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex items-start gap-3 p-4 rounded-lg bg-red-950/20 border border-red-900/40">
          <Checkbox 
            id="clause_4" 
            checked={data.clause_4} 
            onCheckedChange={(val) => onUpdate({ clause_4: !!val })}
            className="mt-1 border-slate-500 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
          />
          <Label htmlFor="clause_4" className="text-xs md:text-sm font-semibold cursor-pointer select-none leading-snug">
            I have read and accept the full penalty schedule (Clause 4).
          </Label>
        </div>
      </div>
    </div>
  );
});

// --- STEP 3: PLATFORM & LEGAL ---
export const StepPlatformRules = memo(({ data, onUpdate }: { data: any, onUpdate: (update: any) => void }) => {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <StepHeader title="Platform Rules & Legal" icon={ShieldCheck} />
      
      <Clause 
        title="CLAUSE 5 — Suspension and Removal"
        severity="Important"
        id="clause_5"
        checked={data.clause_5}
        onToggle={(val) => onUpdate({ clause_5: val })}
        content="Zlice reserves the right to temporarily suspend or permanently remove a kitchen from the platform in the following circumstances — a severe food quality complaint, repeated order cancellations, a verified health incident, or any conduct that compromises the trust and safety of the platform. Reinstatement following a suspension is at the sole discretion of Zlice.
I understand Zlice's right to suspend or remove my account (Clause 5)."
      />

      <Clause 
        title="CLAUSE 6 — Independent Kitchen Partner"
        severity="Standard"
        id="clause_6"
        checked={data.clause_6}
        onToggle={(val) => onUpdate({ clause_6: val })}
        content="You operate as an independent kitchen partner and not as an employee, agent, or representative of Zlice. Zlice provides the technology platform connecting you to students — it does not supervise your kitchen, prepare your food, or control your day-to-day operations. Responsibility for the food you prepare rests with you.
I acknowledge my status as an independent partner as per Clause 6."
      />
    </div>
  );
});

// --- STEP 5: DIGITAL SIGNATURE ---
export const StepSignature = memo(({ data, onUpdate }: { data: any, onUpdate: (update: any) => void }) => {
  const isDraftReady = data.fullName && data.kitchenName && data.signatureAccepted;

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <StepHeader title="Digital Signature & Declaration" icon={FileText} />
      
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-bold uppercase tracking-wide">Full Name *</Label>
            <Input 
              id="fullName" 
              placeholder="As per identity proof" 
              value={data.fullName || ''} 
              onChange={(e) => onUpdate({ fullName: e.target.value })}
              className="h-12 border-slate-200 dark:border-slate-800"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kitchenName" className="text-sm font-bold uppercase tracking-wide">Kitchen Name *</Label>
            <Input 
              id="kitchenName" 
              placeholder="Your kitchen name on Zlice" 
              value={data.kitchenName || ''} 
              onChange={(e) => onUpdate({ kitchenName: e.target.value })}
              className="h-12 border-slate-200 dark:border-slate-800"
            />
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-bold uppercase tracking-wide">Date *</Label>
            <div className="h-12 flex items-center px-4 bg-slate-100 dark:bg-slate-800 rounded-md font-mono text-slate-600 dark:text-slate-400 border border-transparent">
              {new Date().toLocaleDateString('en-GB')}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-bold uppercase tracking-wide">Registered Email</Label>
            <div className="h-12 flex items-center px-4 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-400 truncate">
               {data.email || 'Loading...'}
            </div>
          </div>
        </div>
      </div>

      <div className={`p-8 rounded-2xl border-2 border-dashed transition-all ${isDraftReady ? "border-red-500 bg-red-50/30 dark:bg-red-900/10" : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"}`}>
        <p className="italic text-lg text-slate-800 dark:text-slate-200 leading-relaxed mb-6">
          "By accepting these terms on the Zlice platform, I (<span className="font-bold border-b-2 border-slate-400 px-2 min-w-[100px] inline-block not-italic text-red-600">{data.fullName || " [ your name ] "}</span>) confirm that I have read and understood all the above clauses and agree to abide by them for the duration of my partnership with Zlice. I acknowledge that this constitutes a legally binding digital agreement."
        </p>
        <div className="flex items-center gap-3">
          <Checkbox 
            id="signatureAccepted" 
            checked={data.signatureAccepted} 
            onCheckedChange={(val) => onUpdate({ signatureAccepted: !!val })}
            className="h-6 w-6 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
          />
          <Label htmlFor="signatureAccepted" className="text-base font-bold cursor-pointer select-none">
            I confirm that I have read, understood and agree to all terms above.
          </Label>
        </div>
      </div>
    </div>
  );
});
