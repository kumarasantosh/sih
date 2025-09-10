import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Wheat, 
  Truck, 
  Search, 
  BarChart3, 
  Shield, 
  Clock,
  Users,
  Globe
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
          Blockchain Supply Chain
          <span className="text-green-600 block">Transparency</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Track agricultural produce from farm to table with immutable blockchain records. 
          Ensure food safety, build consumer trust, and enable instant recalls.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/farmer">
            <Button size="lg" className="bg-green-600 hover:bg-green-700">
              <Wheat className="w-5 h-5 mr-2" />
              Start as Farmer
            </Button>
          </Link>
          <Link href="/verify">
            <Button size="lg" variant="outline">
              <Search className="w-5 h-5 mr-2" />
              Verify Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <Wheat className="w-8 h-8 text-green-600" />
            <CardTitle>Batch Creation</CardTitle>
            <CardDescription>
              Farmers create crop batches with QR codes for tracking
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <Truck className="w-8 h-8 text-blue-600" />
            <CardTitle>Trace Events</CardTitle>
            <CardDescription>
              Log events at each stage of the supply chain
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <Shield className="w-8 h-8 text-purple-600" />
            <CardTitle>Blockchain Proof</CardTitle>
            <CardDescription>
              Immutable records anchored to Polygon blockchain
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <Search className="w-8 h-8 text-orange-600" />
            <CardTitle>Consumer Verification</CardTitle>
            <CardDescription>
              Scan QR codes to verify product authenticity
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Benefits Section */}
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-6 h-6 mr-2 text-green-600" />
              Instant Recalls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              When contamination is detected, instantly trace all affected batches 
              and notify consumers within minutes, not days.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-6 h-6 mr-2 text-blue-600" />
              Multi-Stakeholder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Farmers, aggregators, retailers, and consumers all participate 
              in a transparent, trustless system.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="w-6 h-6 mr-2 text-purple-600" />
              Global Standards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Built on open standards and blockchain technology, 
              ensuring interoperability across supply chains.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-6 h-6 mr-2 text-orange-600" />
              Analytics Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Real-time insights into supply chain performance, 
              quality metrics, and traceability data.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Demo Section */}
      <div className="text-center space-y-6 bg-white rounded-lg p-8 shadow-sm">
        <h2 className="text-3xl font-bold text-gray-900">Ready to Demo?</h2>
        <p className="text-lg text-gray-600">
          Experience the full supply chain transparency flow
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/farmer">
            <Button size="lg" className="bg-green-600 hover:bg-green-700">
              Create Your First Batch
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline">
              View Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}