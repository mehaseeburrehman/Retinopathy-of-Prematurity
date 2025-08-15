import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 })
    }

    console.log(`📤 Forwarding to Python API: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`)

    // Forward to Python API - NO FALLBACK
    const pythonFormData = new FormData()
    pythonFormData.append("file", file)

    const response = await fetch("http://localhost:8000/predict", {
      method: "POST",
      body: pythonFormData,
      // Add timeout
      signal: AbortSignal.timeout(30000), // 30 second timeout
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Python API error (${response.status}):`, errorText)

      if (response.status === 503) {
        return NextResponse.json(
          {
            error: "Model not loaded",
            message: "The AI model is not properly loaded. Please check the Python API logs.",
            details: "Make sure your model file is in the python-api directory and the API started successfully.",
          },
          { status: 503 },
        )
      }

      throw new Error(`Python API error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log(`✅ Prediction successful: ${result.topPrediction?.class}`)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("❌ API Route Error:", error)

    // Check if it's a connection error
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      return NextResponse.json(
        {
          error: "Python API not available",
          message: "Cannot connect to the Python API server.",
          details: "Make sure the Python API is running on http://localhost:8000",
          solution: "Run: cd python-api && python main.py",
        },
        { status: 503 },
      )
    }

    // Check if it's a timeout
    if (error.name === "TimeoutError") {
      return NextResponse.json(
        {
          error: "Prediction timeout",
          message: "The prediction took too long to complete.",
          details: "The model might be processing a complex image or there's a performance issue.",
        },
        { status: 408 },
      )
    }

    return NextResponse.json(
      {
        error: "Prediction failed",
        message: error.message || "Unknown error occurred",
        details: "Check the Python API logs for more information.",
      },
      { status: 500 },
    )
  }
}
