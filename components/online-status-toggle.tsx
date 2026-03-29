"use client";

import { useState, useEffect, memo } from "react";
import { useCanteen } from "@/lib/canteen-context";
import { useAuth } from "@/lib/auth-context";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OnlineStatusToggleProps {
  className?: string;
  compact?: boolean;
  hideText?: boolean;
}

export const OnlineStatusToggle = memo(function OnlineStatusToggle({
  className,
  compact = false,
  hideText = false,
}: OnlineStatusToggleProps) {
  const { selectedCanteen, selectedCanteenId } = useCanteen();
  const { isUnderReview } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedCanteen) {
      setIsOnline((selectedCanteen as any).is_online || false);
    }
  }, [selectedCanteenId]); // Use stable ID instead of full object

  const handleToggle = async (enabled: boolean) => {
    if (!selectedCanteen || isLoading) return;

    if (isUnderReview) {
      toast.error("Verification in Progress", {
        description: "Your kitchen must be verified before you can take online orders.",
      });
      return;
    }

    setIsLoading(true);
    // Optimistic update
    setIsOnline(enabled);

    try {
      const resp = await fetch("/api/canteen/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_online: enabled }),
      });

      if (!resp.ok) {
        throw new Error("Failed to update status");
      }

      toast.success(
        enabled ? "Canteen is now online" : "Canteen is now offline",
      );

      // Note: No need to refresh full context, just update local state
    } catch (error) {
      console.error("Error updating online status:", error);
      toast.error("Failed to update status");
      // Revert the state on error
      setIsOnline(!enabled);
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedCanteen) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-between bg-slate-50 dark:bg-[#0a0f1e]/50 border border-slate-200 dark:border-slate-800 rounded-lg p-3",
        className,
      )}>
      <div className={cn("flex items-center gap-2", hideText && "gap-0")}>
        {!hideText && (
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              isOnline ? "bg-green-500 animate-pulse" : "bg-slate-400",
            )}
          />
        )}
        {!hideText && (
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {compact ? "Online" : "Take Online Orders"}
          </span>
        )}
      </div>
      <Switch
        checked={isOnline}
        onCheckedChange={handleToggle}
        disabled={isLoading || isUnderReview}
        className={cn(
          "data-[state=checked]:bg-blue-500",
          isUnderReview && "opacity-50 cursor-not-allowed"
        )}
      />
    </div>
  );
});

OnlineStatusToggle.displayName = "OnlineStatusToggle";
