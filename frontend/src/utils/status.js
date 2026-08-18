const STATUS_MAP = {
  booking: {
    CONFIRMED: "confirmed",
    APPROVED: "confirmed",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
    REJECTED: "cancelled",
    PENDING: "pending",
    default: "pending",
  },
  workOrder: {
    COMPLETED: "completed",
    IN_PROGRESS: "in-progress",
    SUBMITTED_FOR_APPROVAL: "pending",
    CANCELLED: "cancelled",
    REJECTED: "cancelled",
    default: "pending",
  },
  estimate: {
    APPROVED: "confirmed",
    REJECTED: "cancelled",
    default: "pending",
  },
  inspection: {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    CRITICAL: "critical",
    default: "neutral",
  },
  partType: {
    CONSUMABLE: "consumable",
    default: "pending",
  },
};

function mapStatus(status, profile) {
  if (!status) return profile.default;
  const upper = status.toUpperCase();
  return profile[upper] ?? profile.default;
}

export function getStatusClass(status, entityType = "booking") {
  const profile = STATUS_MAP[entityType] ?? STATUS_MAP.booking;
  return mapStatus(status, profile);
}

export function getWorkOrderStatusClass(status) {
  return getStatusClass(status, "workOrder");
}

export function getSeverityClass(severity) {
  return getStatusClass(severity, "inspection");
}

export function getStatusLabel(status) {
  if (!status) return "Unknown";
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const STATUS_VARIANTS = {
  confirmed: "success",
  completed: "success",
  "in-progress": "default",
  pending: "warning",
  cancelled: "destructive",
  rejected: "destructive",
  low: "secondary",
  medium: "warning",
  high: "destructive",
  critical: "destructive",
  neutral: "secondary",
  consumable: "default",
};
