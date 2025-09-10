"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase, type Batch, type TraceEvent } from "@/lib/supabase";
import { formatDate, getStatusColor, getEventTypeIcon } from "@/lib/utils";
import {
  Package,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  MapPin,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

interface DashboardStats {
  totalBatches: number;
  activeBatches: number;
  recalledBatches: number;
  completedBatches: number;
  totalEvents: number;
}

export default function DashboardPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalBatches: 0,
    activeBatches: 0,
    recalledBatches: 0,
    completedBatches: 0,
    totalEvents: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [batchEvents, setBatchEvents] = useState<TraceEvent[]>([]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch batches
      const { data: batchesData, error: batchesError } = await supabase
        .from("batches")
        .select("*")
        .order("created_at", { ascending: false });

      if (batchesError) {
        throw batchesError;
      }

      setBatches(batchesData || []);

      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from("trace_events")
        .select("*")
        .order("timestamp", { ascending: false });

      if (eventsError) {
        console.error("Error fetching events:", eventsError);
      } else {
        setEvents(eventsData || []);
      }

      // Calculate stats
      const totalBatches = batchesData?.length || 0;
      const activeBatches =
        batchesData?.filter((b) => b.status === "active").length || 0;
      const recalledBatches =
        batchesData?.filter((b) => b.status === "recalled").length || 0;
      const completedBatches =
        batchesData?.filter((b) => b.status === "completed").length || 0;
      const totalEvents = eventsData?.length || 0;

      setStats({
        totalBatches,
        activeBatches,
        recalledBatches,
        completedBatches,
        totalEvents,
      });
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecallBatch = async (batchId: string) => {
    try {
      const { error } = await supabase
        .from("batches")
        .update({ status: "recalled" })
        .eq("batch_id", batchId);

      if (error) {
        throw error;
      }

      // Refresh data
      await fetchData();
      alert(`Batch ${batchId} has been recalled successfully!`);
    } catch (err) {
      console.error("Error recalling batch:", err);
      alert("Failed to recall batch");
    }
  };

  const fetchBatchEvents = async (batchId: string) => {
    try {
      const { data, error } = await supabase
        .from("trace_events")
        .select("*")
        .eq("batch_id", batchId)
        .order("timestamp", { ascending: true });

      if (error) {
        throw error;
      }

      setBatchEvents(data || []);
    } catch (err) {
      console.error("Error fetching batch events:", err);
    }
  };

  const handleViewBatch = (batch: Batch) => {
    setSelectedBatch(batch);
    fetchBatchEvents(batch.batch_id);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Retailer Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Monitor and manage your supply chain batches
          </p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBatches}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Batches
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.activeBatches}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recalled Batches
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.recalledBatches}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalEvents}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batches Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Batches</CardTitle>
          <CardDescription>
            Overview of all batches in your supply chain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Batch ID</th>
                  <th className="text-left py-3 px-4">Crop</th>
                  <th className="text-left py-3 px-4">Location</th>
                  <th className="text-left py-3 px-4">Harvest Date</th>
                  <th className="text-left py-3 px-4">Quantity</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr key={batch.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">
                      {batch.batch_id}
                    </td>
                    <td className="py-3 px-4">{batch.crop_name}</td>
                    <td className="py-3 px-4">{batch.location}</td>
                    <td className="py-3 px-4">
                      {formatDate(batch.harvest_date)}
                    </td>
                    <td className="py-3 px-4">
                      {batch.quantity} {batch.unit}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          batch.status
                        )}`}
                      >
                        {batch.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewBatch(batch)}
                        >
                          View
                        </Button>
                        {batch.status === "active" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRecallBatch(batch.batch_id)}
                          >
                            Recall
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Batch Details Modal */}
      {selectedBatch && (
        <Card>
          <CardHeader>
            <CardTitle>Batch Details: {selectedBatch.batch_id}</CardTitle>
            <CardDescription>
              Complete traceability information for this batch
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Batch Information</h3>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Crop
                    </label>
                    <p className="text-lg">{selectedBatch.crop_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Location
                    </label>
                    <p className="text-lg">{selectedBatch.location}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Harvest Date
                    </label>
                    <p className="text-lg">
                      {formatDate(selectedBatch.harvest_date)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Quantity
                    </label>
                    <p className="text-lg">
                      {selectedBatch.quantity} {selectedBatch.unit}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Status
                    </label>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        selectedBatch.status
                      )}`}
                    >
                      {selectedBatch.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="pt-4">
                  <h3 className="text-lg font-semibold mb-2">QR Code</h3>
                  <div className="flex items-center gap-4">
                    <div className="border-2 border-gray-200 rounded-lg p-3 bg-white">
                      {typeof window !== "undefined" && (
                        <QRCodeCanvas
                          id={`qr-${selectedBatch.batch_id}`}
                          value={selectedBatch.batch_id}
                          size={160}
                          level="M"
                          includeMargin={true}
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const canvas = document.getElementById(
                            `qr-${selectedBatch.batch_id}`
                          ) as HTMLCanvasElement | null;
                          if (canvas) {
                            const link = document.createElement("a");
                            link.download = `qr-${selectedBatch.batch_id}.png`;
                            link.href = canvas.toDataURL();
                            link.click();
                          }
                        }}
                      >
                        Download QR
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(
                            `/consumer/${selectedBatch.batch_id}`,
                            "_blank"
                          )
                        }
                      >
                        Open Consumer View
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    QR encodes the batch ID. Consumers can scan via Verify page.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Trace Events</h3>
                {batchEvents.length > 0 ? (
                  <div className="space-y-3">
                    {batchEvents.map((event) => (
                      <div key={event.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">
                              {getEventTypeIcon(event.event_type)}
                            </span>
                            <span className="font-medium capitalize">
                              {event.event_type}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDate(event.timestamp)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {event.location}
                          </div>
                          {event.notes && <p>{event.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    No events found for this batch
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setSelectedBatch(null)} variant="outline">
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recall Simulation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
            Recall Simulation
          </CardTitle>
          <CardDescription>
            Simulate a product recall to test the system&apos;s traceability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              In case of contamination or quality issues, you can instantly
              recall any active batch. This will mark the batch as recalled and
              notify all stakeholders in the supply chain.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-yellow-800 text-sm">
                <strong>Demo Mode:</strong> This is a simulation. In production,
                this would trigger automated notifications to all supply chain
                partners and consumers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
