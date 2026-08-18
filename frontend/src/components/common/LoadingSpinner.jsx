import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoadingSpinner({
  message = "Loading...",
  size = 30,
  className,
}) {
  return (
    <div className={cn("booking-details-loading", className)}>
      <LoaderCircle size={size} className="animate-spin" />
      {message && <p>{message}</p>}
    </div>
  );
}
