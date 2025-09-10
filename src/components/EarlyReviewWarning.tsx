import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function EarlyReviewWarning() {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Review Not Possible Yet</AlertTitle>
      <AlertDescription>
        Amazon's review system flags reviews left too early after purchase as
        potentially suspicious. Please wait at least 7 days after receiving your
        product before leaving a review. This helps ensure your review appears
        genuine and stays published.
      </AlertDescription>
    </Alert>
  );
}
