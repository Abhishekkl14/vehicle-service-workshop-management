import { Badge } from "@/components/ui/badge";
import { getStatusLabel, STATUS_VARIANTS } from "@/utils/status";
import { cn } from "@/lib/utils";

const VARIANT_MAP = {
  success: "bg-emerald-100 text-emerald-800 border-emerald-200",
  warning: "bg-amber-100 text-amber-800 border-amber-200",
  destructive: "bg-red-100 text-red-800 border-red-200",
  default: "bg-blue-100 text-blue-800 border-blue-200",
  secondary: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function StatusBadge({
  status,
  entityType = "booking",
  className,
  customVariant,
  customLabel,
}) {
  const variantKey =
    customVariant ?? STATUS_VARIANTS[status?.toLowerCase()] ?? "secondary";
  const label = customLabel ?? getStatusLabel(status);
  const colorClasses = VARIANT_MAP[variantKey] ?? VARIANT_MAP.secondary;

  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize font-medium text-xs px-2 py-0.5",
        colorClasses,
        className
      )}
    >
      {label}
    </Badge>
  );
}
