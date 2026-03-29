"use client";

import { useEffect, useState, useCallback } from "react";
import { useCanteen } from "@/lib/canteen-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChefHat, Clock, CheckCircle, Plus } from "lucide-react";

interface Order {
  id: string;
  order_number: string;
  status: "not_started" | "started" | "cooking" | "ready";
  total_amount: number;
  created_at: string;
  items?: Array<{
    menu_item_id: string;
    quantity: number;
  }>;
}

interface MenuItem {
  id: string;
  name: string;
}

export function OrderDisplay() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<
    "not_started" | "started" | "cooking" | "ready"
  >("not_started");

  const { selectedCanteen } = useCanteen();

  const fetchOrders = useCallback(async () => {
    if (!selectedCanteen) return;
    try {
      const resp = await fetch(
        `/api/orders/list?canteenId=${selectedCanteen.id}`,
        { credentials: "include" },
      );
      if (resp.ok) {
        const data = await resp.json();
        setOrders(data);
      }
    } catch (e) {
      console.error("Failed to fetch orders", e);
    } finally {
      setLoading(false);
    }
  }, [selectedCanteen]);

  useEffect(() => {
    if (!selectedCanteen) return;

    // Fetch menu items for reference
    const fetchMenuItems = async () => {
      try {
        const resp = await fetch(`/api/menu?canteenId=${selectedCanteen.id}`, {
          credentials: "include",
        });
        if (resp.ok) {
          const data = await resp.json();
          const itemMap = Object.fromEntries(
            data.map((item: any) => [item.id, item.name]),
          );
          setMenuItems(itemMap);
        }
      } catch (e) {
        console.error("Failed to fetch menu", e);
      }
    };

    fetchMenuItems();
    fetchOrders();

    // Since we removed Supabase from the client, we can't use postgres_changes directly here
    // securely without exposing keys or writing a custom websocket relay.
    // For now, implement basic polling every 5 seconds.
    const pollInterval = setInterval(() => {
      fetchOrders();
    }, 5000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [selectedCanteen, fetchOrders]);

  const updateOrderStatus = async (
    orderId: string,
    newStatus: "not_started" | "started" | "cooking" | "ready",
  ) => {
    try {
      const resp = await fetch("/api/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId, newStatus }),
      });

      if (!resp.ok) throw new Error("Update failed");

      // Trigger push notification (fire and forget)
      console.log(
        "[Frontend Debug] Triggering notification API for order:",
        orderId,
        "status:",
        newStatus,
      );
      fetch("/api/orders/notify-status-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, newStatus }),
      })
        .then((res) =>
          console.log(
            "[Frontend Debug] Notification API response:",
            res.status,
          ),
        )
        .catch((err) => console.error("Failed to trigger notification:", err));

      setOrders(
        orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
    } catch (err) {
      console.error("Error updating order:", err);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm("Delete this order?")) return;

    try {
      const resp = await fetch("/api/orders/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId }),
      });

      if (!resp.ok) throw new Error("Delete failed");

      setOrders(orders.filter((o) => o.id !== orderId));
    } catch (err) {
      console.error("Error deleting order:", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not_started":
        return "bg-muted border-muted-foreground/30";
      case "started":
        return "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800";
      case "cooking":
        return "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800";
      case "ready":
        return "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800";
      default:
        return "bg-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "not_started":
        return <Clock className="w-5 h-5 text-muted-foreground" />;
      case "started":
        return (
          <ChefHat className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        );
      case "cooking":
        return (
          <ChefHat className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        );
      case "ready":
        return (
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
        );
      default:
        return null;
    }
  };

  const filteredOrders = orders.filter((o) => o.status === selectedTab);

  if (loading) {
    return <div className="text-center py-8">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Status Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["not_started", "started", "cooking", "ready"] as const).map(
          (status) => (
            <Button
              key={status}
              onClick={() => setSelectedTab(status)}
              variant={selectedTab === status ? "default" : "outline"}
              className={
                selectedTab === status
                  ? status === "started"
                    ? "bg-orange-600 hover:bg-orange-700"
                    : status === "cooking"
                      ? "bg-yellow-600 hover:bg-yellow-700"
                      : status === "ready"
                        ? "bg-green-600 hover:bg-green-700"
                        : ""
                  : ""
              }>
              {status === "not_started" && <Clock className="w-4 h-4 mr-2" />}
              {status === "started" && <ChefHat className="w-4 h-4 mr-2" />}
              {status === "cooking" && <ChefHat className="w-4 h-4 mr-2" />}
              {status === "ready" && <CheckCircle className="w-4 h-4 mr-2" />}
              {status.replace("_", " ").charAt(0).toUpperCase() +
                status.slice(1).replace("_", " ")}
              <span className="ml-2 bg-background text-foreground px-2 py-1 rounded text-xs font-semibold">
                {orders.filter((o) => o.status === status).length}
              </span>
            </Button>
          ),
        )}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No orders in this category
          </div>
        ) : (
          filteredOrders.map((order) => (
            <Card
              key={order.id}
              className={`border-2 ${getStatusColor(order.status)} cursor-pointer hover:shadow-lg transition-shadow`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    <CardTitle className="text-lg">
                      Order #{order.order_number}
                    </CardTitle>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteOrder(order.id)}
                    className="h-6 w-6 p-0">
                    ×
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.created_at).toLocaleTimeString()}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Items */}
                <div className="space-y-1">
                  {order.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="text-sm text-foreground/80">
                      {item.quantity}x{" "}
                      {menuItems[item.menu_item_id] || "Unknown"}
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="border-t pt-2">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-xl font-bold text-foreground">
                    ₹{order.total_amount.toFixed(2)}
                  </p>
                </div>

                {/* Status Buttons */}
                <div className="flex gap-2 pt-2">
                  {selectedTab === "not_started" && (
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, "started")}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                      Start Order
                    </Button>
                  )}
                  {selectedTab === "started" && (
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, "ready")}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                      Mark Ready
                    </Button>
                  )}
                  {selectedTab === "cooking" && (
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, "ready")}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                      Mark Ready
                    </Button>
                  )}
                  {selectedTab !== "ready" && (
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, "ready")}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                      Mark Ready
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
