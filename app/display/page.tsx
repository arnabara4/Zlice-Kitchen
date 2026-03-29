'use client';

import { useEffect, useRef, useState } from 'react';
import { useCanteen } from '@/lib/canteen-context';
import { Clock, ChefHat, Check, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Slideshow from '@/components/slideshow';

interface SlideshowItem {
  type: 'image' | 'youtube' | 'youtube-playlist';
  url: string;
  title?: string;
  duration?: number;
}

interface OrderItem {
  menu_item_id: string;
  quantity: number;
  price: number;
  menu_items?: { name: string };
}

interface OrderWithItems {
  id: string;
  order_number: number;
  status: 'not_started' | 'cooking' | 'ready' | 'taken_away';
  total_amount: number;
  created_at: string;
  order_items: OrderItem[];
}

export default function DisplayPage() {
  const { selectedCanteen, selectedCanteenId } = useCanteen();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [slideshowEnabled, setSlideshowEnabled] = useState(false);
  const [slideshowInterval, setSlideshowInterval] = useState(5000);
  const [slideshowItems, setSlideshowItems] = useState<SlideshowItem[]>([]);
  const [ordersDisplayInterval, setOrdersDisplayInterval] = useState(10000);
  const [ordersDisplayDuration, setOrdersDisplayDuration] = useState(15000);
  const [showOrders, setShowOrders] = useState(false);
  const [previousOrdersCount, setPreviousOrdersCount] = useState(0);
  const [lastCycleTime, setLastCycleTime] = useState(Date.now());
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentFlashCardIndex, setCurrentFlashCardIndex] = useState(0);
  const stripRef = useRef<HTMLDivElement | null>(null);

  const fetchOrders = async () => {
    if (!selectedCanteen) {
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch(`/api/display?canteenId=${selectedCanteen.id}`);
      if (!res.ok) throw new Error('Failed to fetch from display route');
      const { orders } = await res.json();
      setOrders(orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCanteen) {
      setSlideshowEnabled((selectedCanteen as any).slideshow_enabled || false);
      setSlideshowInterval((selectedCanteen as any).slideshow_interval || 5000);
      setSlideshowItems((selectedCanteen as any).slideshow_items || []);
      setOrdersDisplayInterval((selectedCanteen as any).orders_display_interval || 10000);
      setOrdersDisplayDuration((selectedCanteen as any).orders_display_duration || 15000);
    }
  }, [selectedCanteenId]); // Use stable ID

  // Detect order changes and show orders immediately for 15 seconds
  useEffect(() => {
    if (orders.length === 0) {
      setPreviousOrdersCount(0);
      setShowOrders(false);
      return;
    }

    // If orders count changed (new order or order removed), show orders immediately for 15s
    if (orders.length !== previousOrdersCount && previousOrdersCount !== 0) {
      setShowOrders(true);
      setLastCycleTime(Date.now());
      
      // Show for 15 seconds then return to slideshow or hide
      const quickShowTimeout = setTimeout(() => {
        if (!slideshowEnabled || slideshowItems.length === 0) {
          // If no slideshow, keep showing orders
          setShowOrders(true);
        } else {
          setShowOrders(false);
        }
      }, 15000);

      setPreviousOrdersCount(orders.length);
      
      return () => clearTimeout(quickShowTimeout);
    }
    
    // Initialize count on first load
    if (previousOrdersCount === 0) {
      setPreviousOrdersCount(orders.length);
    }
  }, [orders.length, previousOrdersCount, slideshowEnabled, slideshowItems.length]);

  // Progress bar animation
  useEffect(() => {
    if (!slideshowEnabled || slideshowItems.length === 0 || orders.length === 0) {
      setProgressPercent(0);
      return;
    }

    const totalCycleDuration = showOrders ? 15000 : ordersDisplayInterval;
    const startTime = Date.now();
    
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const percent = Math.min((elapsed / totalCycleDuration) * 100, 100);
      setProgressPercent(percent);
      
      if (percent >= 100) {
        clearInterval(progressInterval);
      }
    }, 50); // Update every 50ms for smooth animation

    return () => clearInterval(progressInterval);
  }, [showOrders, slideshowEnabled, slideshowItems.length, orders.length, ordersDisplayInterval]);

  // Alternating logic between slideshow and orders
  useEffect(() => {
    // If slideshow not enabled or no items, always show orders if any exist
    if (!slideshowEnabled || slideshowItems.length === 0) {
      setShowOrders(orders.length > 0);
      setProgressPercent(0);
      return;
    }

    // If no orders, just show slideshow
    if (orders.length === 0) {
      setShowOrders(false);
      setProgressPercent(0);
      return;
    }

    // Start with slideshow
    setShowOrders(false);
    setProgressPercent(0);
    
    let slideshowTimer: NodeJS.Timeout;
    let ordersTimer: NodeJS.Timeout;

    const runCycle = () => {
      // Show slideshow for ordersDisplayInterval duration
      setShowOrders(false);
      setProgressPercent(0);
      
      slideshowTimer = setTimeout(() => {
        // Then show orders for 15 seconds (fixed duration)
        if (orders.length > 0) {
          setShowOrders(true);
          setProgressPercent(0);
          
          ordersTimer = setTimeout(() => {
            // Repeat the cycle
            runCycle();
          }, 15000); // Fixed 15 seconds for orders display
        }
      }, ordersDisplayInterval);
    };

    // Start the cycle
    runCycle();

    return () => {
      clearTimeout(slideshowTimer);
      clearTimeout(ordersTimer);
    };
  }, [slideshowEnabled, slideshowItems.length, orders.length, ordersDisplayInterval]);

  // Rotate flash cards (kept for index updates)
  useEffect(() => {
    if (!slideshowEnabled || slideshowItems.length === 0 || orders.length === 0 || showOrders) {
      return;
    }

    const flashCardInterval = setInterval(() => {
      setCurrentFlashCardIndex((prev) => (prev + 1) % orders.length);
    }, 3000); // Change card every 3 seconds

    return () => clearInterval(flashCardInterval);
  }, [slideshowEnabled, slideshowItems.length, orders.length, showOrders, orders]);

  // Auto-scroll TV-style ticker strip. Smooth, continuous, pauses on hover.
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;

    let rafId = 0;
    let paused = false;
    const speed = 1.2; // px per frame for TV-like scrolling

    const step = () => {
      if (!paused && el.scrollWidth > el.clientWidth) {
        el.scrollLeft += speed;
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth) {
          el.scrollLeft = 0;
        }
      }
      rafId = requestAnimationFrame(step);
    };

    const onEnter = () => (paused = true);
    const onLeave = () => (paused = false);

    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);

    rafId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafId);
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [orders.length]);

  useEffect(() => {
    fetchOrders();
    const orderInterval = setInterval(fetchOrders, 3000);
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    
    return () => {
      clearInterval(orderInterval);
      clearInterval(timeInterval);
    };
  }, [selectedCanteenId]); // Use stable ID

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return (
          <div className="flex items-center gap-1 md:gap-2 bg-gradient-to-r from-green-400 to-emerald-500 text-black px-2 md:px-5 py-1.5 md:py-2.5 rounded-full font-black text-[10px] md:text-sm shadow-lg shadow-green-500/60 hover:shadow-green-400/80 transition-shadow whitespace-nowrap">
            <Check className="w-3 h-3 md:w-5 md:h-5" strokeWidth={3} />
            <span className="tracking-wide">READY</span>
          </div>
        );
      case 'cooking':
        return (
          <div className="flex items-center gap-1 md:gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-2 md:px-5 py-1.5 md:py-2.5 rounded-full font-black text-[10px] md:text-sm shadow-lg shadow-red-500/50 animate-pulse whitespace-nowrap">
            <ChefHat className="w-3 h-3 md:w-5 md:h-5" strokeWidth={2.5} />
            <span className="tracking-wide hidden sm:inline">COOKING</span>
            <span className="tracking-wide sm:hidden">COOK</span>
          </div>
        );
      case 'not_started':
        return (
          <div className="flex items-center gap-1 md:gap-2 bg-gradient-to-r from-slate-700 to-slate-800 text-yellow-400 px-2 md:px-5 py-1.5 md:py-2.5 rounded-full font-black text-[10px] md:text-sm shadow-lg shadow-slate-900/50 hover:shadow-yellow-500/30 transition-shadow whitespace-nowrap">
            <Clock className="w-3 h-3 md:w-5 md:h-5" strokeWidth={2.5} />
            <span className="tracking-wide hidden sm:inline">WAITING</span>
            <span className="tracking-wide sm:hidden">WAIT</span>
          </div>
        );
      default:
        return null;
    }
  };

  const getRowBackground = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-slate-800/50 border-l-4 border-green-500';
      case 'cooking':
        return 'bg-slate-800/50 border-l-4 border-red-500';
      case 'not_started':
        return 'bg-slate-800/50 border-l-4 border-amber-500';
      default:
        return 'bg-slate-800/50';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-black via-slate-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-r-4 border-yellow-400 mx-auto mb-8 shadow-2xl shadow-yellow-500/50"></div>
          <p className="text-yellow-400 text-3xl font-bold tracking-wider">Loading orders...</p>
          <p className="text-slate-400 text-sm font-medium mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black via-slate-900 to-black overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 shadow-lg px-2 md:px-6 py-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="rounded-xl md:rounded-2xl overflow-hidden p-1 md:p-1.5">
              {selectedCanteen?.logo_url ? (
                <img 
                  src={selectedCanteen.logo_url} 
                  alt={`${selectedCanteen.name} Logo`} 
                  className="w-8 h-8 md:w-10 md:h-10 object-contain"
                />
              ) : (
                <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-red-100">
                  <Building2 className="w-4 h-4 md:w-6 md:h-6 text-red-600" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-base md:text-2xl font-black tracking-tight text-black leading-none uppercase">
                {selectedCanteen?.name || 'CANTEEN'}
              </h1>
              <p className="text-[8px] md:text-[10px] text-black/70 font-semibold tracking-widest uppercase mt-0.5">Live Order Board</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-3 flex-wrap">
            <div className="text-right bg-black/15 backdrop-blur-sm rounded-lg md:rounded-xl px-2 md:px-3 py-1 md:py-1.5 shadow-lg">
              <p className="text-sm md:text-xl font-black text-black leading-none">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </p>
              <p className="text-[7px] md:text-[9px] text-black/60 font-semibold tracking-wider uppercase mt-0.5">
                {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
            </div>
            <div className="flex gap-1 md:gap-2 items-center">
              <div className="text-center bg-black/85 backdrop-blur-sm rounded-lg md:rounded-xl px-2 md:px-3 py-1 md:py-1.5 shadow-lg min-w-[40px] md:min-w-[60px]">
                <p className="text-base md:text-2xl font-black text-green-400 leading-none">{orders.filter(o => o.status === 'ready').length}</p>
                <p className="text-[7px] md:text-[9px] text-green-300/90 font-bold tracking-wider uppercase mt-0.5">Ready</p>
              </div>
              <div className="text-center bg-black/85 backdrop-blur-sm rounded-lg md:rounded-xl px-2 md:px-3 py-1 md:py-1.5 shadow-lg min-w-[40px] md:min-w-[60px]">
                <p className="text-base md:text-2xl font-black text-red-400 leading-none">{orders.filter(o => o.status === 'cooking').length}</p>
                <p className="text-[7px] md:text-[9px] text-red-300/90 font-bold tracking-wider uppercase mt-0.5">Cooking</p>
              </div>
              <div className="text-center bg-black/85 backdrop-blur-sm rounded-lg md:rounded-xl px-2 md:px-3 py-1 md:py-1.5 shadow-lg min-w-[40px] md:min-w-[60px]">
                <p className="text-base md:text-2xl font-black text-slate-300 leading-none">{orders.filter(o => o.status === 'not_started').length}</p>
                <p className="text-[7px] md:text-[9px] text-slate-400/90 font-bold tracking-wider uppercase mt-0.5">Waiting</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar - Shows when slideshow is enabled and orders exist */}
      {slideshowEnabled && slideshowItems.length > 0 && orders.length > 0 && (
        <div className="h-1 bg-black/30 relative overflow-hidden">
          <div 
            className={`h-full transition-all duration-100 ${
              showOrders 
                ? 'bg-gradient-to-r from-green-400 to-green-500' 
                : 'bg-gradient-to-r from-yellow-400 to-yellow-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-hidden relative">
        {/* Background Slideshow - Always Running */}
        {slideshowEnabled && slideshowItems.length > 0 && (
          <div className="absolute inset-0 z-0">
            <Slideshow items={slideshowItems} interval={slideshowInterval} />
          </div>
        )}

        {/* Orders Overlay */}
        <div className={`relative z-10 h-full overflow-hidden flex flex-col transition-all duration-700 ${
          showOrders && orders.length > 0 ? 'bg-gradient-to-br from-black/95 via-slate-900/95 to-black/95 backdrop-blur-sm' : 'opacity-0 pointer-events-none'
        }`}>
          {orders.length > 0 && (
            <>
              {/* Table Header */}
              <div className="bg-slate-900/80 backdrop-blur-md border-b-2 border-yellow-500/30">
                <div className="grid grid-cols-12 gap-2 md:gap-6 px-2 md:px-6 py-2 md:py-2.5 font-black text-[8px] md:text-xs uppercase tracking-widest text-yellow-400/80">
                  <div className="col-span-3 md:col-span-2 text-left pl-1 md:pl-4">Order #</div>
                  <div className="col-span-5 md:col-span-7">Items</div>
                  <div className="col-span-3 md:col-span-2 text-center">Status</div>
                  <div className="col-span-1 text-right pr-1 md:pr-4 hidden md:block">Time</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-yellow-500/10">
                {orders.map((order, index) => (
                  <div 
                    key={`${order.id}-${order.status}`}
                    className={`grid grid-cols-12 gap-2 md:gap-6 px-2 md:px-6 py-3 md:py-6 items-center transition-all duration-500 animate-in fade-in slide-in-from-left-4 ${
                      order.status === 'ready' 
                        ? 'bg-green-500/10 hover:bg-green-500/15 border-l-4 border-green-500/60' 
                        : order.status === 'cooking' 
                        ? 'bg-red-500/12 hover:bg-red-500/18 border-l-4 border-red-500/50 animate-pulse' 
                        : 'bg-slate-700/15 hover:bg-slate-700/20 border-l-4 border-slate-500/30'
                    }`}
                  >
                    {/* Order Number */}
                    <div className="col-span-3 md:col-span-2 flex items-center pl-1 md:pl-4">
                      <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-black rounded-lg md:rounded-2xl px-2 md:px-5 py-1.5 md:py-3 shadow-xl hover:scale-105 transition-transform duration-300 animate-in fade-in zoom-in">
                        <p className="text-lg md:text-4xl font-black tracking-tight leading-none">#{order.order_number}</p>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="col-span-5 md:col-span-7">
                      <div className="flex flex-wrap gap-1 md:gap-2.5">
                        {order.order_items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1 md:gap-2.5 bg-slate-800/80 rounded-lg md:rounded-xl px-2 md:px-4 py-1 md:py-2.5 shadow-lg hover:bg-slate-700/80 hover:shadow-xl transition-all duration-200">
                            <span className="text-[10px] md:text-base font-bold text-white tracking-wide truncate max-w-[80px] md:max-w-none">
                              {item.menu_items?.name || 'Unknown'}
                            </span>
                            <span className="bg-yellow-400 text-black rounded px-1 md:px-2.5 py-0.5 md:py-1 text-[10px] md:text-sm font-black whitespace-nowrap">
                              ×{item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-3 md:col-span-2 flex justify-center">
                      <div className="scale-75 md:scale-100">
                        {getStatusBadge(order.status)}
                      </div>
                    </div>

                    {/* Time - Hidden on mobile */}
                    <div className="col-span-1 text-right pr-1 md:pr-4 hidden md:block">
                      <p className="text-xl font-black text-yellow-400">{formatTime(order.created_at)}</p>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Elegant infinite scrolling flash cards */}
        {!showOrders && slideshowEnabled && slideshowItems.length > 0 && orders.length > 0 && (
          <div className="absolute left-0 right-0 bottom-0 z-20 pb-[52px] md:pb-[60px] pointer-events-none">
            <div className=" to-white shadow-2xl overflow-hidden">
              <div className="relative h-full overflow-hidden py-3">
                <div
                  ref={stripRef}
                  className="flex gap-4 items-center animate-scroll-infinite"
                  style={{
                    animation: 'scroll-left 30s linear infinite',
                    width: 'max-content',
                  }}
                >
                  {/* Duplicate orders twice for seamless infinite loop */}
                  {[...orders, ...orders, ...orders].map((order, idx) => (
                    <motion.div
                      key={`${order.id}-${idx}`}
                      whileHover={{ scale: 1.05, y: -4 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="flex-shrink-0 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-yellow-400 overflow-hidden pointer-events-auto cursor-pointer px-5 py-3"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-black font-black text-2xl md:text-3xl px-5 py-2 rounded-lg shadow-md min-w-[80px] text-center">
                          #{order.order_number}
                        </div>
                        <div className="h-10 w-px bg-gray-300"></div>
                        <div className="scale-90">
                          {getStatusBadge(order.status)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <style jsx global>{`
          @keyframes scroll-left {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-33.333%);
            }
          }
          
          .animate-scroll-infinite:hover {
            animation-play-state: paused;
          }
        `}</style>
      </div>

      {/* Footer */}
      <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 backdrop-blur-sm px-2 md:px-6 py-2 md:py-2.5 shadow-xl border-t-2 border-yellow-600/70">
        <div className="flex items-center justify-center gap-1 md:gap-2 flex-wrap">
          <p className="text-black text-[10px] md:text-sm font-bold tracking-wide">Crafted with</p>
          <span className="text-red-600 text-xs md:text-base animate-pulse">❤️</span>
          <p className="text-black text-[10px] md:text-sm font-bold tracking-wide">by</p>
          <div className="flex items-center gap-1 md:gap-2.5 rounded-lg md:rounded-xl px-2 md:px-4 py-1 md:py-1.5 shadow-lg">
            <span className="text-black text-[10px] md:text-sm font-black tracking-tight">Shahid Mollick '27</span>
            <span className="text-black/60 text-[10px] md:text-sm font-black">•</span>
            <span className="text-black text-[10px] md:text-sm font-black tracking-tight">Sohail Belim '27</span>
          </div>
        </div>
      </div>
    </div>
  );
}
