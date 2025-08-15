"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Search, Calendar, Filter, Eye, FileText } from "lucide-react"
import { usePredictions } from "@/app/predictions-context"
import { useAuth } from "@/app/auth-context"
import Image from "next/image"

export default function Records() {
  const { user, isLoading: authLoading } = useAuth()
  const { predictions, isLoading: predictionsLoading } = usePredictions()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterClass, setFilterClass] = useState("all")
  const [sortBy, setSortBy] = useState("newest")

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/")
    }
  }, [user, authLoading, router])

  // Show loading state
  if (authLoading || predictionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading records...</p>
        </div>
      </div>
    )
  }

  // Don't render if no user
  if (!user) {
    return null
  }

  const filteredPredictions = predictions
    .filter((pred) => {
      const matchesSearch =
        pred.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pred.topPrediction.class.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = filterClass === "all" || pred.topPrediction.class === filterClass
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      if (sortBy === "oldest") return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      if (sortBy === "confidence") return b.topPrediction.confidence - a.topPrediction.confidence
      return 0
    })

  const downloadCSV = () => {
    const headers = [
      "Date",
      "Image Name",
      "Diagnosis",
      "Confidence",
      "Healthy %",
      "Retinal Detachment %",
      "Type-1 %",
      "Type-2 %",
    ]
    const csvData = predictions.map((pred) => [
      pred.timestamp.toISOString().split("T")[0],
      pred.fileName || "Unknown",
      pred.topPrediction.class,
      `${(pred.topPrediction.confidence * 100).toFixed(1)}%`,
      `${(pred.predictions.find((p) => p.class === "Healthy")?.confidence * 100 || 0).toFixed(1)}%`,
      `${(pred.predictions.find((p) => p.class === "Retinal Detachment")?.confidence * 100 || 0).toFixed(1)}%`,
      `${(pred.predictions.find((p) => p.class === "Type-1")?.confidence * 100 || 0).toFixed(1)}%`,
      `${(pred.predictions.find((p) => p.class === "Type-2")?.confidence * 100 || 0).toFixed(1)}%`,
    ])

    const csvContent = [headers, ...csvData].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `retinal-analysis-records-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getClassColor = (className: string) => {
    const colors = {
      Healthy: "bg-green-500",
      "Retinal Detachment": "bg-red-500",
      "Type-1": "bg-yellow-500",
      "Type-2": "bg-orange-500",
    }
    return colors[className as keyof typeof colors] || "bg-gray-500"
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return "text-green-600"
    if (confidence > 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analysis Records</h1>
          <p className="text-gray-600">View and manage your retinal analysis history</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Analyses</p>
                  <p className="text-2xl font-bold">{predictions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-green-500 rounded-full" />
                <div>
                  <p className="text-sm text-gray-600">Healthy</p>
                  <p className="text-2xl font-bold">
                    {predictions.filter((p) => p.topPrediction.class === "Healthy").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-red-500 rounded-full" />
                <div>
                  <p className="text-sm text-gray-600">Detachment</p>
                  <p className="text-2xl font-bold">
                    {predictions.filter((p) => p.topPrediction.class === "Retinal Detachment").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-2xl font-bold">
                    {predictions.filter((p) => new Date(p.timestamp).getMonth() === new Date().getMonth()).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5" />
                <span>Filter & Search</span>
              </div>
              <Button
                onClick={downloadCSV}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                disabled={predictions.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search by filename or diagnosis..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by diagnosis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Diagnoses</SelectItem>
                  <SelectItem value="Healthy">Healthy</SelectItem>
                  <SelectItem value="Retinal Detachment">Retinal Detachment</SelectItem>
                  <SelectItem value="Type-1">Type-1</SelectItem>
                  <SelectItem value="Type-2">Type-2</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="confidence">Highest Confidence</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Records List */}
        <div className="space-y-4">
          {filteredPredictions.length === 0 ? (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="text-center py-12">
                <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No records found</h3>
                <p className="text-gray-500">
                  {predictions.length === 0
                    ? "Start by analyzing your first retinal image"
                    : "Try adjusting your search or filter criteria"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredPredictions.map((prediction, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-4 gap-6 items-center">
                    {/* Image Preview */}
                    <div className="relative w-full h-24 rounded-lg overflow-hidden bg-gray-100">
                      {prediction.imageUrl ? (
                        <Image
                          src={prediction.imageUrl || "/placeholder.svg"}
                          alt="Retinal scan"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Eye className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div>
                      <h3 className="font-medium mb-1">{prediction.fileName || "Unknown File"}</h3>
                      <p className="text-sm text-gray-500">
                        {prediction.timestamp.toLocaleDateString()} at {prediction.timestamp.toLocaleTimeString()}
                      </p>
                    </div>

                    {/* Diagnosis */}
                    <div className="text-center">
                      <Badge className={`${getClassColor(prediction.topPrediction.class)} text-white mb-2`}>
                        {prediction.topPrediction.class}
                      </Badge>
                      <p className={`font-bold text-lg ${getConfidenceColor(prediction.topPrediction.confidence)}`}>
                        {(prediction.topPrediction.confidence * 100).toFixed(1)}%
                      </p>
                    </div>

                    {/* All Predictions */}
                    <div className="space-y-1">
                      {prediction.predictions.slice(0, 3).map((pred: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{pred.class}</span>
                          <span className="font-medium">{(pred.confidence * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
