import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import PredictionResult from "@/components/PredictionResult";
import ErrorMessage from "@/components/ErrorMessage";
import { AlertCircle, Loader2, Trash2, ArrowRight, Sparkles, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Add this line at the top after imports
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://backend-final-3x39.onrender.com";

const TextAnalysis = () => {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [characterCount, setCharacterCount] = useState(0);
  const [result, setResult] = useState<{
    label: string;
    confidence: number;
  } | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);

  useEffect(() => {
    setCharacterCount(text.length);
  }, [text]);

  const handleClearText = () => {
    setText("");
    setResult(null);
    setError(null);
    setExplanation(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError("Please enter some text to analyze");
      return;
    }
    if (text.length < 20) {
      setError("Please enter at least 20 characters for more accurate analysis");
      return;
    }

    setIsLoading(true);
    setError(null);
    setExplanation(null);
    setResult(null);

    try {
      // Call Flask /predict endpoint
      const response = await fetch(`${BACKEND_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      setResult({
        label: data.prediction,
        confidence: data.confidence * 100,
      });

      // Call Flask /explain endpoint
      setIsExplaining(true);
      const explainResponse = await fetch(`${BACKEND_URL}/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text }),
      });

      if (explainResponse.ok) {
        const expData = await explainResponse.json();
        setExplanation(expData.explanation || "No explanation available.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to analyze text. Please try again.");
    } finally {
      setIsLoading(false);
      setIsExplaining(false);
    }
  };

  const exampleStatements = [
    "I was at home all night watching TV. I didn't go anywhere near downtown.",
    "The project was delayed because we encountered unexpected technical issues that required additional research.",
    "I've never spoken with that person before. This is the first time I've heard their name.",
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-foreground">Text-based Deception Detection</h2>
          <p className="text-muted-foreground">
            Enter a statement to analyze it for potential deceptive language patterns.
          </p>
        </div>

        <Alert className="border-primary/20 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm text-foreground">
            Our AI analyzes linguistic patterns, inconsistencies, and subtle language markers that correlate with deception.
          </AlertDescription>
        </Alert>

        <Card className="p-6 shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="text-input" className="text-sm font-medium text-foreground">
                  Enter statement for analysis
                </label>
                <span className="text-xs text-muted-foreground">
                  {characterCount} characters (min. 20 required)
                </span>
              </div>
              <Textarea
                id="text-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter a statement to analyze for deception..."
                className="min-h-[150px] resize-none"
                disabled={isLoading}
              />
              <div className="text-xs text-muted-foreground">
                {text.trim().split(/\s+/).filter(word => word.length > 0).length} words
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isLoading || text.length < 20}
                className="flex-1"
              >
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
              {text && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearText}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </Card>

        {error && <ErrorMessage message={error} />}

        {(result || isExplaining) && (
          <div className="space-y-4">
            {result && (
              <PredictionResult
                label={result.label}
                confidence={result.confidence}
                explanation={explanation}
              />
            )}
            {isExplaining && !explanation && (
              <Card className="p-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating AI explanation...</span>
                </div>
              </Card>
            )}
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Example statements you can try:</h3>
          <div className="space-y-2">
            {exampleStatements.map((statement, index) => (
              <button
                key={index}
                onClick={() => setText(statement)}
                className="w-full text-left p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-sm text-foreground"
              >
                {statement}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextAnalysis;
