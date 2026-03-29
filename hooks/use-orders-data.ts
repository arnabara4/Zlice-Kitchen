import { useState, useEffect, useCallback, useRef } from 'react';
import { getActiveOrders, getMenuItems, getKhataStudents, getSchedules } from '@/app/orders/actions';

// Global cache for orders to allow instant navigation
const ORDERS_CACHE: Record<string, { data: any; timestamp: number }> = {};
// Menu items don't change often, cache longer
const MENU_CACHE: Record<string, { data: any; timestamp: number }> = {};
const STUDENTS_CACHE: Record<string, { data: any; timestamp: number }> = {};
const SCHEDULES_CACHE: Record<string, { data: any; timestamp: number }> = {};

const POLLING_INTERVAL = 3000; // 3 seconds

interface UseOrdersDataReturn {
  orders: any[];
  menuItems: any[];
  students: any[];
  schedules: any[];
  loading: boolean;
  refreshOrders: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useOrdersData(canteenId: string | undefined): UseOrdersDataReturn {
  // --- Initial State from Cache ---
  const getInitialCache = (key: string, cache: Record<string, any>) => 
    (key && cache[key]) ? cache[key].data : [];

  const [orders, setOrders] = useState<any[]>(() => 
    canteenId ? getInitialCache(canteenId, ORDERS_CACHE) : []
  );
  const [menuItems, setMenuItems] = useState<any[]>(() => 
    canteenId ? getInitialCache(canteenId, MENU_CACHE) : []
  );
  const [students, setStudents] = useState<any[]>(() => 
    canteenId ? getInitialCache(canteenId, STUDENTS_CACHE) : []
  );
  const [schedules, setSchedules] = useState<any[]>(() => 
    canteenId ? getInitialCache(canteenId, SCHEDULES_CACHE) : []
  );

  const [loading, setLoading] = useState<boolean>(() => {
    if (!canteenId) return true;
    // If we have orders cached, we are not "loading" (blocking UI)
    // We might be "refreshing", but that's different.
    return !ORDERS_CACHE[canteenId];
  });
  
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Track previous ID for derived state updates
  const [prevCanteenId, setPrevCanteenId] = useState<string | undefined>(canteenId);

  // --- Derived State for Instant Cache Switching ---
  if (canteenId !== prevCanteenId) {
    setPrevCanteenId(canteenId);
    if (canteenId) {
       // Switch orders
       if (ORDERS_CACHE[canteenId]) {
         setOrders(ORDERS_CACHE[canteenId].data);
         setLoading(false);
       } else {
         setOrders([]);
         setLoading(true);
       }
       // Switch Menu
       if (MENU_CACHE[canteenId]) setMenuItems(MENU_CACHE[canteenId].data);
       else setMenuItems([]);
       
       // Switch Students
       if (STUDENTS_CACHE[canteenId]) setStudents(STUDENTS_CACHE[canteenId].data);
       else setStudents([]);

       // Switch Schedules
       if (SCHEDULES_CACHE[canteenId]) setSchedules(SCHEDULES_CACHE[canteenId].data);
       else setSchedules([]);
    } else {
        setOrders([]);
        setMenuItems([]);
        setStudents([]);
        setSchedules([]);
        setLoading(true);
    }
  }

  const fetchOrders = useCallback(async (isPolling = false) => {
    if (!canteenId) return;
    
    try {
      if (!isPolling && !ORDERS_CACHE[canteenId]) setLoading(true);
      
      const newOrders = await getActiveOrders(canteenId);
      
      // Update Cache
      ORDERS_CACHE[canteenId] = { data: newOrders, timestamp: Date.now() };
      
      // Update State (React will bail out if data structure deeply equal? No, strict equality. 
      // But we can check length or something simple to avoid renders if needed, 
      // but for orders queue, simple set is usually fine).
      // JSON.stringify check might be expensive every 3s but useful for stability.
      // Efficient data comparison to avoid unnecessary re-renders
      setOrders(prev => {
        if (prev.length !== newOrders.length) return newOrders;
        
        // Quick check for ID and status changes
        const isDifferent = newOrders.some((order: any, i: number) => {
          const prevOrder = prev[i];
          return !prevOrder || 
                 prevOrder.id !== order.id || 
                 prevOrder.status !== order.status || 
                 prevOrder.payment_status !== order.payment_status ||
                 (prevOrder.order_items?.length !== order.order_items?.length);
        });

        if (!isDifferent) return prev;
        return newOrders;
      });
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [canteenId]);

  const fetchStaticData = useCallback(async () => {
    if (!canteenId) return;

    // Menu Items
    if (!MENU_CACHE[canteenId] || (Date.now() - MENU_CACHE[canteenId].timestamp > 60000 * 5)) {
        const items = await getMenuItems(canteenId);
        MENU_CACHE[canteenId] = { data: items, timestamp: Date.now() };
        setMenuItems(items);
    }

    // Students
    if (!STUDENTS_CACHE[canteenId] || (Date.now() - STUDENTS_CACHE[canteenId].timestamp > 60000 * 5)) {
        const studs = await getKhataStudents(canteenId);
        STUDENTS_CACHE[canteenId] = { data: studs, timestamp: Date.now() };
        setStudents(studs);
    }

    // Schedules
    if (!SCHEDULES_CACHE[canteenId] || (Date.now() - SCHEDULES_CACHE[canteenId].timestamp > 60000 * 5)) {
        const scheds = await getSchedules(canteenId);
        SCHEDULES_CACHE[canteenId] = { data: scheds, timestamp: Date.now() };
        setSchedules(scheds);
    }
  }, [canteenId]);

  // Initial Fetch & Polling
  useEffect(() => {
    if (!canteenId) return;

    fetchOrders(); // Initial fetch
    fetchStaticData(); // Fetch menu/students once

    const interval = setInterval(() => {
      fetchOrders(true); // Polling silent
    }, POLLING_INTERVAL);

    // Re-fetch on visibility change (user comes back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchOrders(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [canteenId, fetchOrders, fetchStaticData]);

  // Expose a refresh function
  const refreshOrders = async () => {
      await fetchOrders(true);
  };

  return { orders, menuItems, students, schedules, loading, refreshOrders, lastUpdated };
}

// Prefetch function for orders
export async function prefetchOrdersData(canteenId: string) {
  if (ORDERS_CACHE[canteenId] && (Date.now() - ORDERS_CACHE[canteenId].timestamp < 60000)) { // 1 min freshness for prefetch
      return; 
  }
  try {
      // console.log("Prefetching orders data...");
      const newOrders = await getActiveOrders(canteenId);
      ORDERS_CACHE[canteenId] = { data: newOrders, timestamp: Date.now() };
      
      // Also prefetch static data if needed
      if (!MENU_CACHE[canteenId]) {
         const items = await getMenuItems(canteenId);
         MENU_CACHE[canteenId] = { data: items, timestamp: Date.now() };
      }
       if (!STUDENTS_CACHE[canteenId]) {
         const studs = await getKhataStudents(canteenId);
         STUDENTS_CACHE[canteenId] = { data: studs, timestamp: Date.now() };
      }
       if (!SCHEDULES_CACHE[canteenId]) {
         const scheds = await getSchedules(canteenId);
         SCHEDULES_CACHE[canteenId] = { data: scheds, timestamp: Date.now() };
      }

  } catch (err) { console.error(err); }
}
