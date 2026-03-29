"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Distance {
  id: string;
  address_slug_1: string;
  address_slug_2: string;
  distance_meters: number;
}

export default function DistancesPage() {
  const [distances, setDistances] = useState<Distance[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updated, setUpdated] = useState<any[]>([]);

  const fetchDistances = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/distances-list");
      if (!res.ok) throw new Error("Failed to fetch distances");
      const data = await res.json();
      setDistances(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistances();
  }, []);

  const handleCalculate = async () => {
    setUpdating(true);
    setError(null);
    setUpdated([]);
    try {
      const res = await fetch("/api/admin/distances", { method: "POST" });
      const data = await res.json();
      setUpdated(data.updated || []);
      fetchDistances();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Distances</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage and calculate delivery distances</p>
        </div>
        <Button onClick={handleCalculate} disabled={updating} className="gap-2">
          {updating ? "Calculating..." : "Calculate"}
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Distance Table</CardTitle>
          <CardDescription>Shows all address pairs and their distances (meters)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading distances...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : distances.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No distances found.</div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Address 1</TableHead>
                    <TableHead>Address 2</TableHead>
                    <TableHead>Distance (meters)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distances.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs">{d.address_slug_1}</TableCell>
                      <TableCell className="font-mono text-xs">{d.address_slug_2}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {d.distance_meters > 0 ? d.distance_meters.toFixed(2) : <span className="text-red-500">Not calculated</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {updated.length > 0 && (
            <div className="mt-4 text-green-600 text-sm">
              Updated: {updated.filter(u => u.distance_meters).length} distances.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
