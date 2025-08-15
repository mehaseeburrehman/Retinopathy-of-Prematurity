"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, Eye, Activity, Clock, CheckCircle, AlertCircle, Brain, Zap } from "lucide-react"
import { useAuth } from "@/app/auth-context"
import { usePredictions } from "@/app/predictions-context"
import Image from "next/image"

interface Prediction {
  class: string
  confidence: number
}

interface PredictionResult {
  predictions: Prediction[]
  topPrediction: Prediction
  success: boolean
  model_info?: any
}

const ROP_CLASSES = [
  { name: "Healthy", color: "bg-green-500", description: "No signs of ROP detected" },
  { name: "Type-1", color: "bg-yellow-500", description: "Type 1 ROP detected" },
  { name: "Type-2", color: "bg-orange-500", description: "Type 2 ROP detected" },
  { name: "Retinal Detachment", color: "bg-red-500", description: "Retinal detachment detected" },
]

export default function DashboardPage() {
  const { user, isLoading: authLoading, isHydrated } = useAuth()
  const { addPrediction, predictions, isLoading: predictionsLoading } = usePredictions()
  const router = useRouter()
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (isHydrated && !authLoading && !user) {
      router.push("/")
    }
  }, [user, authLoading, isHydrated, router])

  // Show loading state
  if (!isHydrated || authLoading || predictionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{!isHydrated ? "Loading..." : "Loading dashboard..."}</p>
        </div>
      </div>
    )
  }

  // Don't render if no user
  if (!user) {
    return null
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file")
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB")
        return
      }

      setSelectedImage(file)
      setError(null)
      setResult(null)

      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const analyzeImage = async () => {
    if (!selectedImage) {
      setError("Please select an image first")
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", selectedImage)

      const response = await fetch("/api/predict", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Prediction failed")
      }

      const data = await response.json()
      setResult(data)

      // Add to predictions context
      const predictionResult = {
        predictions: data.predictions,
        topPrediction: data.topPrediction,
        timestamp: new Date(),
        imageUrl: imagePreview!,
        fileName: selectedImage.name,
      }

      addPrediction(predictionResult)
    } catch (error: any) {
      console.error("Analysis error:", error)
      setError(error.message || "Failed to analyze image. Please make sure the Python API is running on port 8000.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return "text-green-600"
    if (confidence > 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  const getConfidenceIcon = (confidence: number) => {
    if (confidence > 0.8) return <CheckCircle className="w-4 h-4 text-green-600" />
    if (confidence > 0.6) return <AlertCircle className="w-4 h-4 text-yellow-600" />
    return <AlertCircle className="w-4 h-4 text-red-600" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">ROP Analysis Dashboard</h1>
          <p className="text-gray-600">Upload retinal images for AI-powered ROP classification</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-blue-600" />
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
                  <p className="text-sm text-gray-600">ROP Cases</p>
                  <p className="text-2xl font-bold">
                    {predictions.filter((p) => p.topPrediction.class !== "Healthy").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Avg Confidence</p>
                  <p className="text-2xl font-bold">
                    {predictions.length > 0
                      ? `${(
                          (predictions.reduce((sum, p) => sum + p.topPrediction.confidence, 0) / predictions.length) *
                            100
                        ).toFixed(0)}%`
                      : "0%"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Image Upload</span>
              </CardTitle>
              <CardDescription>Select a retinal image for ROP classification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => document.getElementById("file-input")?.click()}
              >
                {imagePreview ? (
                  <div className="space-y-4">
                    <div className="relative w-full h-48 rounded-lg overflow-hidden">
                      <Image
                        src={imagePreview || "/placeholder.svg"}
                        alt="Selected retinal image"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <p className="text-sm text-gray-600">{selectedImage?.name}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Eye className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium">Click to upload retinal image</p>
                      <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                    </div>
                  </div>
                )}
              </div>

              <input id="file-input" type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />

              {selectedImage && !isAnalyzing && (
                <Button
                  onClick={analyzeImage}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Analyze for ROP
                </Button>
              )}

              {isAnalyzing && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-blue-600 animate-spin" />
                    <span className="font-medium">Analyzing retinal image...</span>
                  </div>
                  <Progress value={70} className="w-full" />
                  <p className="text-sm text-gray-600 text-center">Processing with VGG16+SegNet model...</p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <div>
                    <p className="text-red-600 text-sm">{error}</p>
                    <p className="text-red-500 text-xs mt-1">
                      Make sure Python API is running: <code>cd python-api && python main.py</code>
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>ROP Classification Results</span>
              </CardTitle>
              <CardDescription>AI-powered ROP condition classification</CardDescription>
            </CardHeader>
            <CardContent>
              {!result ? (
                <div className="text-center py-12">
                  <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Upload and analyze an image to see ROP classification</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Top Prediction */}
                  <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">Primary Classification</h3>
                      {getConfidenceIcon(result.topPrediction.confidence)}
                    </div>
                    <div className="flex items-center space-x-3 mb-2">
                      <Badge
                        className={`${ROP_CLASSES.find((s) => s.name === result.topPrediction.class)?.color} text-white`}
                      >
                        {result.topPrediction.class}
                      </Badge>
                      <span className={`font-bold text-lg ${getConfidenceColor(result.topPrediction.confidence)}`}>
                        {(result.topPrediction.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {ROP_CLASSES.find((s) => s.name === result.topPrediction.class)?.description}
                    </p>
                  </div>

                  {/* All Predictions */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Detailed Classification</h4>
                    {result.predictions.map((pred: Prediction, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-3 h-3 rounded-full ${ROP_CLASSES.find((s) => s.name === pred.class)?.color}`}
                          />
                          <span className="font-medium">{pred.class}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress value={pred.confidence * 100} className="w-24" />
                          <span className="text-sm font-medium w-12 text-right">
                            {(pred.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-500 pt-4 border-t">
                    <Clock className="w-4 h-4" />
                    <span>Analyzed just now</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
