"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import PredictionResult from "@/components/PredictionResult";
import ErrorMessage from "@/components/ErrorMessage";
import { AlertCircle, Loader2, Trash, ArrowRight, Sparkles } from "lucide-react"
import { Progress } from "@/components/ui/progress"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://backend-final-3x39.onrender.com"

export default function TextAnalysisPage() {
  const [text, setText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isExplaining, setIsExplaining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [characterCount, setCharacterCount] = useState(0)
  const [result, setResult] = useState<{ label: string; confidence: number } | null>(null)
  const [explanation, setExplanation] = useState<string | null>(null)

  useEffect(() => {
    setCharacterCount(text.length)
  }, [text])

  const handleClearText = () => {
    setText("")
    setResult(null)
    setError(null)
    setExplanation(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) {
      setError("Please enter some text to analyze")
      return
    }
    if (text.length < 20) {
      setError("Please enter at least 20 characters for more accurate analysis")
      return
    }

    setIsLoading(true)
    setError(null)
    setExplanation(null)
    setResult(null)

    try {
      const response = await fetch(`${BACKEND_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || `Server error: ${response.status}`)
      }

      const data = await response.json()
      setResult({
        label: data.prediction,
        confidence: data.confidence * 100,
      })

      setIsExplaining(true)
      const explainResponse = await fetch(`${BACKEND_URL}/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text }),
      })

      if (explainResponse.ok) {
        const expData = await explainResponse.json()
        setExplanation(expData.explanation)
      } else {
        setExplanation("Explanation request failed. Please try again.")
      }
    } catch (err: any) {
      console.error("❌ Error:", err)
      setError(
        err.message ||
          "Failed to connect to the prediction API. Ensure the Flask backend is running."
      )
    } finally {
      setIsExplaining(false)
      setIsLoading(false)
    }
  }

  const examples = [
    "I was at home all night watching TV. I didn't go anywhere near downtown.",
    "The project was delayed because we encountered unexpected technical issues that required additional research.",
    "I've never spoken with that person before. This is the first time I've heard their name.",
  ]

  const handleUseExample = (example: string) => {
    setText(example)
    setResult(null)
    setError(null)
    setExplanation(null)
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Text-based Deception Detection</h1>
      <p className="text-gray-600 mb-6">Enter a statement to analyze it for potential deceptive language patterns.</p>

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-medium text-blue-800 flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          How it works
        </h3>
        <p className="text-sm text-blue-800 mt-1">
          Our AI analyzes linguistic patterns, inconsistencies, and subtle language markers that correlate with deception.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label htmlFor="text-input" className="text-sm font-medium">Enter statement for analysis</label>
            <span className={`text-xs ${characterCount > 300 ? "text-green-600" : "text-gray-500"}`}>
              {characterCount} characters {characterCount < 20 ? "(min. 20 required)" : ""}
            </span>
          </div>

          <div className="relative">
            <Textarea
              id="text-input"
              placeholder="Enter a statement to analyze for deception..."
              className="min-h-[200px] p-4 pr-10"
              value={text}
              onChange={(e) => { setText(e.target.value); setError(null) }}
            />
            {text && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-8 w-8 p-0"
                onClick={handleClearText}
              >
                <Trash className="h-4 w-4" />
                <span className="sr-only">Clear text</span>
              </Button>
            )}
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {text.trim().split(/\s+/).filter(Boolean).length} words
            </div>
            {characterCount > 0 && (
              <div className="w-32">
                <Progress value={Math.min(100, (characterCount / 100) * 33.3)} className="h-1" />
              </div>
            )}
          </div>
        </div>

        <Button type="submit" className="flex-1" disabled={isLoading || text.length < 20}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              Analyze Text
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {error && <ErrorMessage message={error} className="mt-4" />}

      {result && (
        <div className="mt-6 space-y-6">
          <PredictionResult {...result} />
          {isExplaining ? (
            <div className="flex items-center space-x-2 text-gray-700 mt-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating explanation...</span>
            </div>
          ) : explanation ? (
            <Card className="p-4 border-l-4 border-blue-500 bg-blue-50">
              <h4 className="text-lg font-semibold flex items-center mb-2 text-blue-800">
                <Sparkles className="h-4 w-4 mr-2 text-blue-600" />
                AI Explanation
              </h4>
              <p className="text-gray-800 whitespace-pre-line">{explanation}</p>
            </Card>
          ) : null}
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Example statements you can try:</h3>
        <div className="grid gap-2">
          {examples.map((example, index) => (
            <Card
              key={index}
              className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => handleUseExample(example)}
            >
              <p className="text-sm">{example}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
