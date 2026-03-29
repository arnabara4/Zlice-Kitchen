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

// --- STEP 1: FOOD SAFETY ---
export const StepFoodSafety = memo(({ data, onUpdate }: { data: any, onUpdate: (update: any) => void }) => {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <StepHeader title="Food Safety & Hygiene" icon={ShieldCheck} />
      
      <Clause 
        title="Personal Responsibility for Food Safety"
        severity="Severe"
        id="safety_1"
        checked={data.safety_1}
        onToggle={(val) => onUpdate({ safety_1: val })}
        content="You are solely and fully responsible for ensuring that all food you prepare and supply through Zlice is safe for consumption. This includes the quality of ingredients used, cleanliness of your kitchen, hygiene during preparation, and proper packaging. If a student falls ill due to food you prepared, you bear full legal and financial responsibility. Zlice acts only as a technology platform connecting you to students and is not responsible for the quality of food prepared in your kitchen.
I understand I am solely responsible for the safety of food I prepare."
      />

      <Clause 
        title="Food Poisoning & Health Incidents"
        severity="Severe"
        id="safety_2"
        checked={data.safety_2}
        onToggle={(val) => onUpdate({ safety_2: val })}
        content="If a student or any consumer reports a food poisoning case or health incident traceable to food supplied from your kitchen, you agree to bear all costs arising from the incident — including medical expenses, consumer compensation, and any legal or regulatory penalties. You agree to indemnify and hold harmless Zlice and IIT Kharagpur from any claims, lawsuits, or penalties arising from such incidents. Zlice reserves the right to immediately suspend your kitchen and report the matter to the institute.
I accept full liability for any health incidents caused by food from my kitchen."
      />

      <Clause 
        title="Hygiene Commitments"
        severity="Standard"
        id="safety_3"
        checked={data.safety_3}
        onToggle={(val) => onUpdate({ safety_3: val })}
        content="You commit to maintaining clean cooking surfaces, utensils, and storage at all times. You will not prepare food if you or anyone in your household is suffering from an infectious illness. You will use fresh ingredients and not supply food that is stale, reheated beyond safe limits, or prepared under unsanitary conditions. Zlice may conduct random quality checks and reserves the right to request evidence of hygiene practices.
I commit to maintaining hygiene standards at all times."
      />
    </div>
  );
});

// --- STEP 2: ORDER & DELIVERY ---
export const StepOrderFulfilment = memo(({ data, onUpdate }: { data: any, onUpdate: (update: any) => void }) => {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <StepHeader title="Order Fulfilment & Delivery" icon={AlertTriangle} colorClass="text-amber-600" />
      
      <Clause 
        title="Accepted Orders Must Be Fulfilled"
        severity="Important"
        id="order_1"
        checked={data.order_1}
        onToggle={(val) => onUpdate({ order_1: val })}
        content="Once you accept an order on the Zlice platform, you are contractually obligated to prepare and dispatch it within the committed time. Cancelling an accepted order without a valid reason is not permitted. Repeated cancellations damage the student's trust and the platform's reliability. Each unwarranted cancellation will attract a financial penalty as detailed in the Penalty Schedule below.
I understand that accepted orders must be fulfilled and cancellations attract penalties."
      />

      <div className="mb-8 border rounded-xl bg-slate-900 text-white p-6 shadow-xl border-slate-800">
        <h3 className="text-xl font-bold mb-4 text-red-500 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Penalty Schedule
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="pb-3 pr-4 font-bold text-slate-400">Violation</th>
                <th className="pb-3 px-4 font-bold text-slate-400">Penalty</th>
                <th className="pb-3 pl-4 font-bold text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr><td className="py-3 pr-4">Cancelling (1st time)</td><td className="py-3 px-4">Full order value</td><td className="py-3 pl-4">Warning</td></tr>
              <tr><td className="py-3 pr-4">Cancelling (2nd time)</td><td className="py-3 px-4">Full value + Rs. 100</td><td className="py-3 pl-4">24h Pause</td></tr>
              <tr><td className="py-3 pr-4">Delayed delivery</td><td className="py-3 px-4">Rs. 50 deducted</td><td className="py-3 pl-4">Recorded</td></tr>
              <tr><td className="py-3 pr-4">Wrong item / Quality</td><td className="py-3 px-4">Full refund</td><td className="py-3 pl-4">Strike 1</td></tr>
              <tr><td className="py-3 pr-4">Foreign object</td><td className="py-3 px-4">Refund + Rs. 500</td><td className="py-3 pl-4 text-red-400">Suspension</td></tr>
              <tr><td className="py-3 pr-4">Food poisoning</td><td className="py-3 px-4">All costs borne</td><td className="py-3 pl-4 text-red-500 font-bold">Blacklist</td></tr>
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex items-start gap-3 p-4 rounded-lg bg-red-950/20 border border-red-900/40">
          <Checkbox 
            id="order_2" 
            checked={data.order_2} 
            onCheckedChange={(val) => onUpdate({ order_2: !!val })}
            className="mt-1 border-slate-500 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
          />
          <Label htmlFor="order_2" className="text-sm font-semibold cursor-pointer select-none leading-snug">
            I have read and accept the full penalty schedule above.
          </Label>
        </div>
      </div>
    </div>
  );
});

// --- STEP 3: PLATFORM RULES ---
export const StepPlatformRules = memo(({ data, onUpdate }: { data: any, onUpdate: (update: any) => void }) => {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <StepHeader title="Platform Rules & Blacklisting" icon={ShieldCheck} />
      
      <Clause 
        title="Zlice's Right to Suspend or Blacklist"
        severity="Important"
        id="rules_1"
        checked={data.rules_1}
        onToggle={(val) => onUpdate({ rules_1: val })}
        content="Zlice reserves the unilateral right to temporarily suspend or permanently remove your kitchen from the platform under the following conditions, without prior notice:

Temporary Suspension: Upon receipt of a severe complaint involving a health hazard, foreign object in food, or two unwarranted cancellations within 7 days.

Permanent Blacklisting: Three strikes within 30 days. Confirmed food poisoning incident. Fraudulent activity on the platform. Violation of IIT Kharagpur campus rules resulting in institutional action against you.
I accept Zlice's right to suspend or permanently blacklist my kitchen."
      />

      <Clause 
        title="Independent Contractor Status"
        severity="Standard"
        id="rules_2"
        checked={data.rules_2}
        onToggle={(val) => onUpdate({ rules_2: val })}
        content="You operate as an independent contractor and not as an employee, agent, or partner of Zlice. Zlice is a technology platform — it does not supervise your kitchen, prepare your food, or control your operations. All legal, financial, and institutional liability arising from your kitchen activities rests entirely with you.
I understand I am an independent contractor and not an employee of Zlice."
      />
    </div>
  );
});

// --- STEP 4: CAMPUS RULES ---
export const StepCampusRules = memo(({ data, onUpdate }: { data: any, onUpdate: (update: any) => void }) => {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <StepHeader title="IIT Kharagpur Campus Rules" icon={AlertTriangle} colorClass="text-red-700" />
      
      <Clause 
        title="Compliance with Campus Regulations"
        severity="Severe"
        id="campus_1"
        checked={data.campus_1}
        onToggle={(val) => onUpdate({ campus_1: val })}
        content="You declare that you have obtained all necessary permissions from the relevant campus authority (Estate Office for staff quarters, or Hall Warden/HMC for hostels) to operate a home kitchen for commercial supply. If IIT Kharagpur takes disciplinary action against you — including fines, eviction, or academic penalties — Zlice bears no responsibility whatsoever. You accept this risk entirely and cannot hold Zlice liable for any institutional consequences arising from your participation on this platform.
I have obtained the necessary campus permissions and accept all institutional risk."
      />

      <Clause 
        title="Institute Notification on Serious Violations"
        severity="Important"
        id="campus_2"
        checked={data.campus_2}
        onToggle={(val) => onUpdate({ campus_2: val })}
        content="In the event of a confirmed food poisoning case, a health incident affecting a student, or any fraudulent activity on the platform, Zlice reserves the right to notify IIT Kharagpur administration about your kitchen's involvement. This may result in independent institutional action against you. By accepting this undertaking, you acknowledge this right and do not hold Zlice liable for any action the institute subsequently takes.
I acknowledge that Zlice may notify IIT Kharagpur in serious cases."
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
          "I, <span className="font-bold border-b-2 border-slate-400 px-2 min-w-[100px] inline-block not-italic text-red-600">{data.fullName || " [ your name ] "}</span>, have read, understood, and voluntarily accept all terms in this Kitchen Partner Undertaking. I acknowledge that this constitutes a legally binding digital agreement and that Zlice and IIT Kharagpur may take action as stated herein if I fail to comply."
        </p>
        <div className="flex items-center gap-3">
          <Checkbox 
            id="signatureAccepted" 
            checked={data.signatureAccepted} 
            onCheckedChange={(val) => onUpdate({ signatureAccepted: !!val })}
            className="h-6 w-6 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
          />
          <Label htmlFor="signatureAccepted" className="text-base font-bold cursor-pointer select-none">
            I confirm that the above information is accurate and I sign this undertaking digitally.
          </Label>
        </div>
      </div>
    </div>
  );
});
