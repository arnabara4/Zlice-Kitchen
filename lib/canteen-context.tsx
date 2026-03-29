"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useAuth } from "./auth-context";

interface SlideshowItem {
  type: "image" | "youtube";
  url: string;
  title?: string;
}

interface Canteen {
  id: string;
  name: string;
  email: string;
  logo_url: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  slideshow_enabled?: boolean;
  slideshow_interval?: number;
  slideshow_items?: SlideshowItem[];
  is_gst_enabled: boolean;
  total_packaging_fee?: number;
  packaging_fee_per_item?: number;
  packaging_fee_type?: "fixed" | "per_item";
}

interface CanteenContextType {
  canteens: Canteen[];
  selectedCanteen: Canteen | null;
  selectedCanteenId: string | null; // NEW: Stable ID for dependency arrays
  setSelectedCanteen: (canteen: Canteen | null) => void;
  loading: boolean;
  refreshCanteens: () => Promise<void>;
}

const CanteenContext = createContext<CanteenContextType | undefined>(undefined);

// Cache to prevent unnecessary re-fetches
const canteenCache = new Map<string, Canteen>();
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function CanteenProvider({ children }: { children: ReactNode }) {
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [selectedCanteenId, setSelectedCanteenId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const hasFetchedRef = useRef(false);
  const canteensMapRef = useRef(new Map<string, Canteen>());
  // Use ref to read selectedCanteenId inside fetchCanteens without adding it as a dependency
  const selectedCanteenIdRef = useRef(selectedCanteenId);
  selectedCanteenIdRef.current = selectedCanteenId;

  const fetchCanteens = useCallback(
    async (force = false) => {
      // Check cache first
      const now = Date.now();
      if (
        !force &&
        hasFetchedRef.current &&
        now - lastFetchTime < CACHE_DURATION
      ) {
        setLoading(false);
        return;
      }

      try {
        let fetchUrl = "/api/canteens";
        if (user?.type === "canteen" && user.canteen_id) {
          fetchUrl = `/api/canteens?id=${user.canteen_id}`;
        }

        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error("Failed to fetch canteens");
        let data = await response.json();

        // /api/canteens returns a single object if queried by id, map to array
        if (!Array.isArray(data)) {
          data = data ? [data] : [];
        }

        // Note: is_active filter removed - canteens can login and operate regardless of is_active status
        // is_active field is only for visibility in the super app admin panel
        let canteensForPOS = data;

        // If user is a canteen, only show their canteen
        if (user?.type === "canteen" && user.canteen_id) {
          canteensForPOS = canteensForPOS.filter(
            (c: Canteen) => c.id === user.canteen_id,
          );
        }

        // Update cache with stable references without temporarily clearing the current map
        const nextMap = new Map<string, Canteen>();
        canteensForPOS.forEach((c: Canteen) => {
          nextMap.set(c.id, c);
          canteenCache.set(c.id, c);
        });
        canteensMapRef.current = nextMap;

        setCanteens(canteensForPOS);
        lastFetchTime = now;
        hasFetchedRef.current = true;

        // Auto-select canteen by ID only — read from ref to avoid stale closure
        const currentSelectedId = selectedCanteenIdRef.current;
        if (!currentSelectedId && canteensForPOS.length > 0) {
          let idToSelect: string | undefined;

          // If canteen user, select their canteen
          if (user?.type === "canteen" && user.canteen_id) {
            idToSelect = user.canteen_id;
          } else {
            // Super admin: use stored preference or first canteen
            const storedCanteenId = localStorage.getItem("selectedCanteenId");
            idToSelect = storedCanteenId || canteensForPOS[0]?.id;
          }

          if (idToSelect && canteensMapRef.current.has(idToSelect)) {
            setSelectedCanteenId(idToSelect);
          }
        }
      } catch (error) {
        console.error("Error fetching canteens:", error);
      } finally {
        setLoading(false);
      }
    },
    [user?.type, user?.canteen_id],
  ); // Removed selectedCanteenId — uses ref instead

  useEffect(() => {
    if (user) {
      // Only reset and fetch if user actually changed
      if (!hasFetchedRef.current) {
        setSelectedCanteenId(null);
        fetchCanteens();
      }
    } else {
      setSelectedCanteenId(null);
      setCanteens([]);
      setLoading(false);
      hasFetchedRef.current = false;
    }
  }, [user?.id, user?.type, fetchCanteens]);

  // Refetch data when window regains focus (tab switch returning)
  useEffect(() => {
    const handleFocus = () => {
      if (user?.id) {
        // Force refresh to bypass cache on focus
        fetchCanteens(true);
      }
    };
    
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [user?.id, fetchCanteens]);

  // Save preference to localStorage
  useEffect(() => {
    if (selectedCanteenId && user?.type !== "canteen") {
      localStorage.setItem("selectedCanteenId", selectedCanteenId);
    }
  }, [selectedCanteenId, user?.type]);

  // Stable setSelectedCanteen handler
  const handleSetSelectedCanteen = useCallback((canteen: Canteen | null) => {
    setSelectedCanteenId(canteen?.id || null);
  }, []);

  // Stable refreshCanteens handler — avoids new ref each time fetchCanteens changes
  const refreshCanteens = useCallback(() => {
    return fetchCanteens(true);
  }, [fetchCanteens]);

  // Memoized selectedCanteen - returns stable reference from map
  const selectedCanteen = useMemo(() => {
    if (!selectedCanteenId) return null;
    return canteensMapRef.current.get(selectedCanteenId) || null;
  }, [selectedCanteenId]);

  // Stable context value
  const contextValue = useMemo(
    () => ({
      canteens,
      selectedCanteen,
      selectedCanteenId,
      setSelectedCanteen: handleSetSelectedCanteen,
      loading,
      refreshCanteens,
    }),
    [
      canteens,
      selectedCanteen,
      selectedCanteenId,
      loading,
      handleSetSelectedCanteen,
      refreshCanteens,
    ],
  );

  return (
    <CanteenContext.Provider value={contextValue}>
      {children}
    </CanteenContext.Provider>
  );
}

export function useCanteen() {
  const context = useContext(CanteenContext);
  if (context === undefined) {
    throw new Error("useCanteen must be used within a CanteenProvider");
  }
  return context;
}
