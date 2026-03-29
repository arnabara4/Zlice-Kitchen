"use client";

import { Bell, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface NotificationProps {
  isOn: boolean;
  onClick?: () => void;
  className?: string;
  size?: number;
  showDot?: boolean;
}

// Utility function to convert VAPID key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
 
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
 
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function NotificationToggle({
  isOn,
  onClick,
  className,
  size = 24,
  showDot = true,
}: NotificationProps) {
  const { user } = useAuth();
  const [notificationPermission, setNotificationPermission] = useState<"granted" | "denied" | "default">("default");

  // Show user data in console for debugging
  useEffect(() => {
    if (user) {
      console.log("\n--- User Object Properties ---");
      console.log("🆔 user.id:", user.id);
      console.log("📧 user.email:", user.email);
      console.log("👨 user.name:", user.name);
      console.log("🏷️  user.type:", user.type);
      console.log("🏪 user.canteen_id:", user.canteen_id || "N/A (not a canteen user)");
      console.log("🖼️  user.logo_url:", user.logo_url || "N/A (no logo)");
    }
  }, [user]);

  const showNotificationPrompt = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === "granted") {
        await subscribeUser();
        toast.success("Notifications enabled!", {
          description: "You will receive order notifications",
        });
      } else {
        toast.info("Please enable notifications", {
          description: "Go to your browser settings to enable notifications",
        });
      }
    } else {
      toast.error("Notifications not supported", {
        description: "This browser does not support notifications",
      });
    }
  };

  async function subscribeUser() {
    if ("serviceWorker" in navigator) {
      try {
        // Check if service worker is already registered
        const registration = await navigator.serviceWorker.getRegistration();
        
        if (registration) {
          await generateSubscribeEndPoint(registration);
        } else {
          // Register the service worker
          const newRegistration = await navigator.serviceWorker.register("/sw.js");
          await generateSubscribeEndPoint(newRegistration);
        }
      } catch (error) {
        console.error("Error during service worker registration:", error);
        toast.error("Failed to register for notifications");
      }
    } else {
      toast.error("Service workers are not supported in this browser");
    }
  }

  const generateSubscribeEndPoint = async (
    registration: ServiceWorkerRegistration
  ) => {
    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      
      if (!vapidKey) {
        console.error("VAPID key not found");
        toast.error("Configuration error: VAPID key missing");
        return;
      }

      const applicationServerKey = urlBase64ToUint8Array(vapidKey);
      const options = {
        applicationServerKey,
        userVisibleOnly: true,
      };

      const subscription = await registration.pushManager.subscribe(options);
      
      if (!user?.id) {
        toast.error("You must be logged in to enable notifications");
        return;
      }

      const subscriptionData = subscription.toJSON();

      const res = await fetch('/api/web-push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscriptionData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error saving subscription:", errorData);
        toast.error(errorData.error || "Failed to save subscription");
      } else {
        console.log(`Push subscription saved successfully`);
        toast.success("Notifications enabled!");
      }
    } catch (error) {
      console.error("Error in generateSubscribeEndPoint:", error);
      toast.error("Failed to subscribe to notifications");
    }
  };

  const removeNotification = async () => {
    if (!user?.id) return;

    try {
      setNotificationPermission("denied");

      const res = await fetch('/api/web-push/unsubscribe', {
        method: 'POST'
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to remove notifications");
      } else {
        toast.success("Notifications disabled");
      }
    } catch (error) {
      console.error("Error removing notification:", error);
      toast.error("Failed to remove notifications");
    }
  };

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleClick = () => {
    if (notificationPermission === "granted") {
      removeNotification();
    } else {
      showNotificationPrompt();
    }
  };

  return (
    <button
      onClick={onClick || handleClick}
      className={cn(
        "relative inline-flex items-center justify-center rounded-lg p-2 transition-all",
        notificationPermission === "granted"
          ? "text-primary hover:bg-primary/10"
          : "text-muted-foreground hover:bg-muted",
        "cursor-pointer",
        className
      )}
      aria-label={notificationPermission === "granted" ? "Notifications enabled" : "Notifications disabled"}
    >
      {notificationPermission === "granted" ? (
        <Bell size={size} className="animate-pulse" />
      ) : (
        <BellOff size={size} />
      )}
      
      {notificationPermission === "granted" && showDot && (
        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
      )}
    </button>
  );
}
