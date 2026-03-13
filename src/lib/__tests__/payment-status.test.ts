import { describe, expect, it } from "vitest";

import { mergePolledPaymentStatus } from "@/lib/payment-status";

describe("mergePolledPaymentStatus", () => {
  it("progresses pending -> detected -> confirmed", () => {
    const detected = mergePolledPaymentStatus("pending", "detected");
    expect(detected).toBe("detected");

    const confirmed = mergePolledPaymentStatus(detected, "confirmed");
    expect(confirmed).toBe("confirmed");
  });

  it("keeps detected sticky when a later poll returns pending", () => {
    const next = mergePolledPaymentStatus("detected", "pending");
    expect(next).toBe("detected");
  });

  it("keeps confirmed sticky regardless of later poll status", () => {
    expect(mergePolledPaymentStatus("confirmed", "pending")).toBe("confirmed");
    expect(mergePolledPaymentStatus("confirmed", "detected")).toBe("confirmed");
  });
});
