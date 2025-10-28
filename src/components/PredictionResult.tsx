import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PredictionResultProps {
  label: string;
  confidence: number;
  explanation?: string | null;
}

const PredictionResult = ({ label, confidence, explanation }: PredictionResultProps) => {
  const isDeceptive = label.toLowerCase() === "deceptive";
  const confidencePercent = Math.round(confidence);

  return (
    <Card className="p-6 space-y-6 shadow-md">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Prediction Result</h3>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDeceptive ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
            )}
            <div>
              <Badge
                variant={isDeceptive ? "destructive" : "default"}
                className={isDeceptive ? "" : "bg-success hover:bg-success/90"}
              >
                {label}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground">{confidencePercent}%</div>
            <div className="text-xs text-muted-foreground">Confidence</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Confidence Level</span>
            <span className="font-medium text-foreground">{confidencePercent}%</span>
          </div>
          <Progress value={confidence} className="h-2" />
        </div>
      </div>

      {explanation && (
        <div className="space-y-3 border-t pt-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-foreground">AI Explanation</h4>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {explanation}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default PredictionResult;
