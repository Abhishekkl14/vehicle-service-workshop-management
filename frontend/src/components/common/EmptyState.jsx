import { cn } from "@/lib/utils";

export default function EmptyState({
  icon: Icon,
  message = "No data found",
  className,
}) {
  return (
    <div className={cn("empty-state", className)}>
      {Icon && <Icon size={48} />}
      <p>{message}</p>
    </div>
  );
}
