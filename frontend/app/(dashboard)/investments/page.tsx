"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchInvestments = async () => {
    try {
      const data = await api.investments.list();
      setInvestments(data as any[]);
    } catch (error) {
      console.error("Failed to fetch investments:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Investments</h1>
      
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : investments.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Investments Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You haven't added any investments yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {investments.map((inv) => (
            <Card key={inv.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{inv.asset_name}</CardTitle>
                <div className="text-sm text-muted-foreground">{inv.asset_type}</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(inv.current_value || (inv.quantity * inv.purchase_price)).toFixed(2)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
