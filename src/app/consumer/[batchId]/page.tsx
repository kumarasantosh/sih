"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase, type Batch, type TraceEvent } from "@/lib/supabase";
import {
  formatDate,
  getEventTypeIcon,
  getStatusColor,
  computeTraceEventsSha256,
} from "@/lib/utils";
import { getRecord } from "@/lib/blockchain";
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Clock,
  Thermometer,
  Droplets,
  FileText,
  ExternalLink,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default function ConsumerBatchPage() {
  const params = useParams();
  const batchId = params.batchId as string;

  const [batch, setBatch] = useState<Batch | null>(null);
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [computedHash, setComputedHash] = useState<string | null>(null);
  const [blockchainProof, setBlockchainProof] = useState<{
    success: boolean;
    hash?: string;
    timestamp?: number;
    sender?: string;
    txHash?: string;
    blockNumber?: number;
    error?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBatchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch batch data
      const { data: batchData, error: batchError } = await supabase
        .from("batches")
        .select("*")
        .eq("batch_id", batchId)
        .single();

      if (batchError) {
        throw new Error("Batch not found");
      }

      setBatch(batchData);

      // Fetch trace events
      const { data: eventsData, error: eventsError } = await supabase
        .from("trace_events")
        .select("*")
        .eq("batch_id", batchId)
        .order("timestamp", { ascending: true });

      if (eventsError) {
        console.error("Error fetching events:", eventsError);
      } else {
        const list = eventsData || [];
        setEvents(list);
        // compute deterministic SHA-256 of trace
        if (list.length > 0) {
          const hash = computeTraceEventsSha256(list);
          setComputedHash(hash);
        } else {
          setComputedHash(null);
        }
      }

      // Fetch blockchain proof
      const blockchainResult = await getRecord(batchId);
      if (blockchainResult.success) {
        setBlockchainProof(blockchainResult);
      }
    } catch (err) {
      console.error("Error fetching batch data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch batch data"
      );
    } finally {
      setIsLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    if (batchId) {
      fetchBatchData();
    }
  }, [batchId, fetchBatchData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <AlertTriangle className="w-16 h-16 text-red-600 mx-auto" />
        <h1 className="text-3xl font-bold text-gray-900">Batch Not Found</h1>
        <p className="text-lg text-gray-600">
          The batch ID you&apos;re looking for doesn&apos;t exist or has been
          removed.
        </p>
        <Link href="/verify">
          <Button className="bg-green-600 hover:bg-green-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Verification
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Shield className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Product Verification
          </h1>
        </div>
        <p className="text-lg text-gray-600">
          Verified blockchain traceability for batch {batch.batch_id}
        </p>
        <Link href="/verify">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Verify Another Product
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Product Information */}
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Batch ID
              </label>
              <p className="text-lg font-mono bg-gray-100 p-2 rounded">
                {batch.batch_id}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Crop</label>
              <p className="text-lg">{batch.crop_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Origin
              </label>
              <p className="text-lg">{batch.location}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Harvest Date
              </label>
              <p className="text-lg">{formatDate(batch.harvest_date)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Quantity
              </label>
              <p className="text-lg">
                {batch.quantity} {batch.unit}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Status
              </label>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                  batch.status
                )}`}
              >
                {batch.status.toUpperCase()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Blockchain Proof */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2 text-green-600" />
              Blockchain Proof
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {blockchainProof ? (
              <>
                {computedHash &&
                blockchainProof.hash &&
                computedHash.toLowerCase() ===
                  blockchainProof.hash.toLowerCase() ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span className="font-medium">
                      Blockchain Proof Verified
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    <span className="font-medium">Data Integrity Mismatch</span>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Computed Off-chain Hash (SHA-256)
                  </label>
                  <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">
                    {computedHash || "Not available"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    On-chain Anchored Hash
                  </label>
                  <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">
                    {blockchainProof.hash || "Not available"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Transaction Hash
                  </label>
                  <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">
                    {blockchainProof.txHash || "Not available"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Block Number
                  </label>
                  <p className="text-sm">
                    {blockchainProof.blockNumber || "Not available"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Timestamp
                  </label>
                  <p className="text-sm">
                    {blockchainProof.timestamp
                      ? formatDate(new Date(blockchainProof.timestamp * 1000))
                      : "Not available"}
                  </p>
                </div>
                {(batch.blockchain_tx_hash || blockchainProof.txHash) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      window.open(
                        `https://mumbai.polygonscan.com/tx/${
                          batch.blockchain_tx_hash || blockchainProof.txHash
                        }`,
                        "_blank"
                      )
                    }
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on PolygonScan
                  </Button>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Blockchain proof not available
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/verify">
              <Button variant="outline" className="w-full">
                Verify Another Product
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.print()}
            >
              Print Certificate
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                const url = window.location.href;
                navigator.clipboard.writeText(url);
                alert("Link copied to clipboard!");
              }}
            >
              Share Link
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Supply Chain Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Supply Chain Timeline</CardTitle>
          <CardDescription>
            Complete journey of this product from farm to table
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <div className="space-y-6">
              {events.map((event) => (
                <div key={event.id} className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">
                        {getEventTypeIcon(event.event_type)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-medium text-gray-900 capitalize">
                        {event.event_type}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {formatDate(event.timestamp)}
                      </span>
                    </div>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {event.location}
                      </div>
                      {event.temperature && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Thermometer className="w-4 h-4 mr-2" />
                          {event.temperature}°C
                        </div>
                      )}
                      {event.humidity && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Droplets className="w-4 h-4 mr-2" />
                          {event.humidity}%
                        </div>
                      )}
                      {event.notes && (
                        <div className="flex items-start text-sm text-gray-600">
                          <FileText className="w-4 h-4 mr-2 mt-0.5" />
                          {event.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                No trace events found for this batch
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Food Safety Notice */}
      {batch.status === "recalled" && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Product Recall Notice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-800">
              This product has been recalled due to safety concerns. Please do
              not consume and contact the retailer for a refund or replacement.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
