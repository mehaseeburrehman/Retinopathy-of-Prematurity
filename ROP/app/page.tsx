"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, Brain, Shield, BarChart3, Award, AlertCircle } from "lucide-react"
import { useAuth } from "@/app/auth-context"

export default function HomePage() {
  const { user, login, signup, isLoading, isHydrated } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  })

  // Show loading during hydration
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If user is logged in, this will be handled by app-layout redirect
  if (user) {
    return null
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const result = await login(formData.email, formData.password)
      if (!result.success) {
        setError(result.error || "Login failed")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const result = await signup(formData.name, formData.email, formData.password)
      if (!result.success) {
        setError(result.error || "Signup failed")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <Eye className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            RetinalAI
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Advanced AI-powered retinal image analysis for ROP classification. Get accurate diagnoses with our
            state-of-the-art VGG16+SegNet model.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Features */}
          <div className="space-y-8">
            <div className="grid gap-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Brain className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">AI-Powered Analysis</h3>
                  <p className="text-gray-600">
                    Advanced VGG16+SegNet architecture trained specifically for ROP classification with high accuracy.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
                  <p className="text-gray-600">
                    Your medical images are processed securely with enterprise-grade privacy protection.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Detailed Reports</h3>
                  <p className="text-gray-600">
                    Comprehensive analysis with confidence scores and detailed classification results.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Clinical Grade</h3>
                  <p className="text-gray-600">
                    Developed with medical professionals for reliable ROP screening and diagnosis support.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Auth Forms */}
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Get Started</CardTitle>
              <CardDescription>Sign in or create an account to begin analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Input
                        type="email"
                        placeholder="Email address"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Input
                        type="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                      <Input
                        type="text"
                        placeholder="Full name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Input
                        type="email"
                        placeholder="Email address"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Input
                        type="password"
                        placeholder="Password (min 6 characters)"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
