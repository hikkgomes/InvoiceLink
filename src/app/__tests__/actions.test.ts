import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/invoice", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/invoice")>();
  return {
    ...actual,
    getBtcPrice: vi.fn(),
    signInvoice: vi.fn(),
    verifyInvoice: vi.fn(),
    listAddressTxidsBlockchair: vi.fn(),
    getTxDetailsBlockchair: vi.fn(),
    getHistoricalRateAtBlock: vi.fn(),
  };
});

import {
  checkPaymentStatusFiatMatch,
  createInvoice,
  parseInvoiceToken,
  refreshQuoteForToken,
} from "@/app/actions";
import type { CreateInvoiceState } from "@/app/actions";
import type { InvoicePayload } from "@/lib/invoice";
import * as invoice from "@/lib/invoice";

function makePayload(overrides: Partial<InvoicePayload> = {}): InvoicePayload {
  const nowMs = Date.now();
  const invoiceExpiresAt = nowMs + 7 * 24 * 60 * 60 * 1000;
  return {
    amountFiat: 100,
    currency: "USD",
    description: "Invoice",
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

const initialCreateInvoiceState: CreateInvoiceState = {
  error: null,
  details: {},
  token: null,
};

describe("actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refreshQuoteForToken preserves invoiceCreatedAt and invoiceExpiresAt", async () => {
    const oldPayload = makePayload({ quoteExpiresAt: Date.now() + 1_000 });
    vi.mocked(invoice.verifyInvoice).mockResolvedValue({ status: "valid", payload: oldPayload });
    vi.mocked(invoice.getBtcPrice)
      .mockResolvedValueOnce(100_000) // currency price
      .mockResolvedValueOnce(100_000); // usd price
    vi.mocked(invoice.signInvoice).mockResolvedValue("new-token");

    const result = await refreshQuoteForToken("old-token");

    expect("token" in result).toBe(true);
    if ("token" in result) {
      expect(result.token).toBe("new-token");
      expect(result.payload.invoiceCreatedAt).toBe(oldPayload.invoiceCreatedAt);
      expect(result.payload.invoiceExpiresAt).toBe(oldPayload.invoiceExpiresAt);
      expect(result.payload.quoteExpiresAt).toBeGreaterThan(oldPayload.quoteExpiresAt);
      expect(result.payload.exp).toBe(Math.floor(oldPayload.invoiceExpiresAt / 1000));
    }
  });

  it("refreshQuoteForToken maps expired verify result to invoice-expired error", async () => {
    vi.mocked(invoice.verifyInvoice).mockResolvedValue({ status: "expired" });

    const result = await refreshQuoteForToken("expired-token");

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("Invoice expired");
      expect(result.code).toBe("expired");
    }
  });

  it("refreshQuoteForToken masks upstream error details from user response", async () => {
    const oldPayload = makePayload();
    const sensitive = "upstream failure at https://api.coingecko.com host=internal";
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(invoice.verifyInvoice).mockResolvedValue({ status: "valid", payload: oldPayload });
    vi.mocked(invoice.getBtcPrice).mockRejectedValue(new Error(sensitive));

    const result = await refreshQuoteForToken("token");

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.code).toBe("refresh_failed");
      expect(result.error).toBe("Failed to refresh quote. Please try again.");
      expect(result.error).not.toContain("coingecko");
      expect(result.error).not.toContain("https://");
      expect(result.error).not.toContain("internal");
    }
    expect(errorSpy).toHaveBeenCalledWith("refreshQuoteForToken failed:", expect.any(Error));
  });

  it("createInvoice masks upstream error details from user response", async () => {
    const sensitive = "fetch failed https://api.coingecko.com status=503";
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(invoice.getBtcPrice).mockRejectedValue(new Error(sensitive));

    const formData = new FormData();
    formData.set("amount", "100");
    formData.set("currency", "USD");
    formData.set("address", "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh");
    formData.set("description", "Test");
    formData.set("expiresIn", "7");

    const result = await createInvoice(initialCreateInvoiceState, formData);

    expect(result.token).toBeNull();
    expect(result.error).toBe("Failed to create invoice. Please try again.");
    expect(result.error).not.toContain("coingecko");
    expect(result.error).not.toContain("https://");
    expect(result.error).not.toContain("503");
    expect(errorSpy).toHaveBeenCalledWith("createInvoice failed:", expect.any(Error));
  });

  it("parseInvoiceToken returns Invoice expired for expired JWTs", async () => {
    vi.mocked(invoice.verifyInvoice).mockResolvedValue({ status: "expired" });

    const result = await parseInvoiceToken("expired-token");
    expect(result).toEqual({ error: "Invoice expired" });
  });

  it("returns pending for unconfirmed dust transactions", async () => {
    const nowMs = Date.now();
    vi.mocked(invoice.listAddressTxidsBlockchair).mockResolvedValue(["dust-tx"]);
    vi.mocked(invoice.getTxDetailsBlockchair).mockResolvedValue({
      satsToAddress: 50,
      confirmed: false,
      time: nowMs,
    });

    const result = await checkPaymentStatusFiatMatch({
      address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      expectedSats: 100_000,
      usdAmount: 100,
      createdAt: nowMs - 10_000,
      invoiceExpiresAt: nowMs + 10_000,
    });

    expect(result.status).toBe("pending");
  });

  it("returns detected for matching unconfirmed amount", async () => {
    const nowMs = Date.now();
    vi.mocked(invoice.listAddressTxidsBlockchair).mockResolvedValue(["candidate-tx"]);
    vi.mocked(invoice.getTxDetailsBlockchair).mockResolvedValue({
      satsToAddress: 100_500,
      confirmed: false,
      time: nowMs,
    });

    const result = await checkPaymentStatusFiatMatch({
      address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      expectedSats: 100_000,
      usdAmount: 100,
      createdAt: nowMs - 10_000,
      invoiceExpiresAt: nowMs + 10_000,
    });

    expect(result).toEqual({ status: "detected", txid: "candidate-tx" });
  });

  it("returns confirmed for a fiat-matching confirmed payment", async () => {
    const nowMs = Date.now();
    vi.mocked(invoice.listAddressTxidsBlockchair).mockResolvedValue(["confirmed-tx"]);
    vi.mocked(invoice.getTxDetailsBlockchair).mockResolvedValue({
      satsToAddress: 100_000,
      confirmed: true,
      time: nowMs,
      blockId: 123,
    });
    vi.mocked(invoice.getHistoricalRateAtBlock).mockResolvedValue(100_000);

    const result = await checkPaymentStatusFiatMatch({
      address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      expectedSats: 100_000,
      usdAmount: 100,
      createdAt: nowMs - 10_000,
      invoiceExpiresAt: nowMs + 10_000,
    });

    expect(result).toEqual({ status: "confirmed", txid: "confirmed-tx" });
  });
});
