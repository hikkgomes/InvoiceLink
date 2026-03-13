export type InvoiceStatus =
  | "pending"
  | "detected"
  | "confirmed"
  | "quote_expired"
  | "invoice_expired"
  | "error"
  | "refreshing";

export type PolledPaymentStatus = "pending" | "detected" | "confirmed";

export function mergePolledPaymentStatus(
  current: InvoiceStatus,
  polled: PolledPaymentStatus,
): InvoiceStatus {
  if (polled === "confirmed") return "confirmed";
  if (polled === "detected") return current === "confirmed" ? "confirmed" : "detected";
  if (current === "detected" || current === "confirmed") return current;
  return "pending";
}
