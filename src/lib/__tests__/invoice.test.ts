import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";

import { JWT_SECRET } from "@/lib/constants";
import { signInvoice, type InvoicePayload, verifyInvoice } from "@/lib/invoice";

function makeInvoicePayload(overrides: Partial<InvoicePayload> = {}): InvoicePayload {
  const nowMs = Date.now();
  const invoiceExpiresAt = nowMs + 60_000;
  return {
    amountFiat: 100,
    currency: "USD",
    description: "Test invoice",
    address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    amountSats: 100_000,
    amountUsd: 100,
    invoiceCreatedAt: nowMs,
    quoteExpiresAt: nowMs + 600_000,
    invoiceExpiresAt,
    iat: Math.floor(nowMs / 1000),
    exp: Math.floor(invoiceExpiresAt / 1000),
    ...overrides,
  };
}

describe("verifyInvoice", () => {
  it("returns valid for a v2 token", async () => {
    const payload = makeInvoicePayload();
    const token = await signInvoice(payload);

    const result = await verifyInvoice(token);
    expect(result.status).toBe("valid");
    if (result.status === "valid") {
      expect(result.payload.amountSats).toBe(payload.amountSats);
      expect(result.payload.invoiceCreatedAt).toBe(payload.invoiceCreatedAt);
      expect(result.payload.quoteExpiresAt).toBe(payload.quoteExpiresAt);
    }
  });

  it("returns expired for an expired token", async () => {
    const nowMs = Date.now();
    const payload = makeInvoicePayload({
      invoiceCreatedAt: nowMs - 120_000,
      quoteExpiresAt: nowMs - 60_000,
      invoiceExpiresAt: nowMs - 1_000,
      iat: Math.floor((nowMs - 120_000) / 1000),
      exp: Math.floor((nowMs - 1_000) / 1000),
    });
    const token = await signInvoice(payload);

    const result = await verifyInvoice(token);
    expect(result.status).toBe("expired");
  });

  it("returns invalid for tampered token", async () => {
    const payload = makeInvoicePayload();
    const token = await signInvoice(payload);
    const tampered = `${token}x`;

    const result = await verifyInvoice(tampered);
    expect(result.status).toBe("invalid");
  });

  it("rejects ms-based legacy exp/iat claims", async () => {
    const nowMs = Date.now();
    const key = new TextEncoder().encode(JWT_SECRET);
    const token = await new SignJWT({
      ...makeInvoicePayload(),
      // Legacy bug: milliseconds in JWT claims
      iat: nowMs,
      exp: nowMs + 60_000,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .sign(key);

    const result = await verifyInvoice(token);
    expect(result.status).toBe("invalid");
  });
});
