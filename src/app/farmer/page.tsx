'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase, type Batch } from '@/lib/supabase'
import { generateBatchId, formatDate } from '@/lib/utils'
import { generateBatchHash } from '@/lib/blockchain'
import { QRCodeCanvas } from 'qrcode.react'
import { 
  Wheat, 
  MapPin, 
  Calendar, 
  Package, 
  CheckCircle,
  Loader2,
  Download
} from 'lucide-react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { createCropBatch } from './create-crop'
import { logTraceEvent } from '@/app/event/log-trace'
import jsQR from 'jsqr'

interface BatchFormData {
  cropName: string
  location: string
  harvestDate: string
  quantity: string
  unit: string
}

export default function FarmerPage() {
  const [formData, setFormData] = useState<BatchFormData>({
    cropName: '',
    location: '',
    harvestDate: '',
    quantity: '',
    unit: 'kg'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdBatch, setCreatedBatch] = useState<Batch | null>(null)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleInputChange = (field: keyof BatchFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Generate unique batch ID
      const batchId = generateBatchId()
      
      // Create batch data
      const batchData = {
        batch_id: batchId,
        farmer_id: '550e8400-e29b-41d4-a716-446655440001', // Demo farmer ID
        crop_name: formData.cropName,
        location: formData.location,
        harvest_date: formData.harvestDate,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        qr_code: `${window.location.origin}/consumer/${batchId}`,
        status: 'active' as const
      }

      // Generate blockchain hash (for future blockchain integration)
      generateBatchHash({
        batchId,
        cropName: formData.cropName,
        location: formData.location,
        harvestDate: formData.harvestDate,
        quantity: parseFloat(formData.quantity),
        farmerId: '550e8400-e29b-41d4-a716-446655440001'
      })

      // Insert into Supabase
      const { data, error: insertError } = await supabase
        .from('batches')
        .insert([batchData])
        .select()
        .single()

      if (insertError) throw insertError

      // (Optional) create initial harvest event
      const { error: eventError } = await supabase
        .from('trace_events')
        .insert([
          {
            batch_id: batchId,
            event_type: 'harvest',
            actor_id: '550e8400-e29b-41d4-a716-446655440001',
            actor_role: 'farmer',
            location: formData.location,
            timestamp: new Date().toISOString(),
            notes: 'Initial harvest event'
          }
        ])

      if (eventError) {
        console.error('Error creating harvest event:', eventError)
      }

      setCreatedBatch(data)

      // Reset form
      setFormData({
        cropName: '',
        location: '',
        harvestDate: '',
        quantity: '',
        unit: 'kg'
      })

    } catch (err) {
      console.error('Error creating batch:', err)
      setError(err instanceof Error ? err.message : 'Failed to create batch')
    } finally {
      setIsSubmitting(false)
    }
  }

  const downloadQR = () => {
    if (!createdBatch) return
    
    const canvas = document.getElementById('qr-code') as HTMLCanvasElement
    if (canvas) {
      const link = document.createElement('a')
      link.download = `batch-${createdBatch.batch_id}-qr.png`
      link.href = canvas.toDataURL()
      link.click()
    }
  }

  const handleScan = async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, canvas.width, canvas.height)

    if (code) {
      console.log('✅ Scanned QR value:', code.data)

      try {
        await logTraceEvent(code.data, { 
          event_type: 'Harvested', 
          location: 'Farm A' 
        })
        console.log('Trace event logged successfully')
      } catch (err) {
        console.error('Error logging trace event:', err)
      }
    } else {
      console.log('⚠️ No QR code detected in frame')
    }
  }

  if (createdBatch) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
          <h1 className="text-3xl font-bold text-gray-900">Batch Created Successfully!</h1>
          <p className="text-lg text-gray-600">
            Your crop batch has been registered and is ready for tracking.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Batch Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Batch ID</label>
                <p className="text-lg font-mono bg-gray-100 p-2 rounded">{createdBatch.batch_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Crop</label>
                <p className="text-lg">{createdBatch.crop_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Location</label>
                <p className="text-lg">{createdBatch.location}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Harvest Date</label>
                <p className="text-lg">{formatDate(createdBatch.harvest_date)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Quantity</label>
                <p className="text-lg">{createdBatch.quantity} {createdBatch.unit}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>QR Code</CardTitle>
              <CardDescription>
                Share this QR code with supply chain partners for tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="flex justify-center">
                <QRCodeCanvas
                  id="qr-code"
                  value={createdBatch.qr_code}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>
              <Button onClick={downloadQR} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download QR Code
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button 
            onClick={() => setCreatedBatch(null)}
            variant="outline"
          >
            Create Another Batch
          </Button>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['farmer']}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center space-y-4 mb-8">
          <Wheat className="w-16 h-16 text-green-600 mx-auto" />
          <h1 className="text-3xl font-bold text-gray-900">Create New Crop Batch</h1>
          <p className="text-lg text-gray-600">
            Register your agricultural produce for blockchain tracking
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Batch Information</CardTitle>
            <CardDescription>
              Fill in the details of your crop batch to start tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Crop Name *
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Organic Tomatoes"
                  value={formData.cropName}
                  onChange={(e) => handleInputChange('cropName', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Farm Location *
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Green Valley Farm, California"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Harvest Date *
                </label>
                <Input
                  type="date"
                  value={formData.harvestDate}
                  onChange={(e) => handleInputChange('harvestDate', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Package className="w-4 h-4 inline mr-1" />
                    Quantity *
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="100"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit
                  </label>
                  <select
                    className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="lbs">Pounds (lbs)</option>
                    <option value="tons">Tons</option>
                    <option value="boxes">Boxes</option>
                    <option value="crates">Crates</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Batch...
                  </>
                ) : (
                  <>
                    <Wheat className="w-4 h-4 mr-2" />
                    Create Batch
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
