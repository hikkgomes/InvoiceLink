type RequiredEnvName = "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY" | "INVOICE_KEY_PEPPER";

function getRequiredEnv(name: RequiredEnvName): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required on the server runtime.`);
  }
  return value;
}

export function getSupabaseServerEnv() {
  return {
    url: getRequiredEnv("SUPABASE_URL"),
    serviceRoleKey: getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    invoiceKeyPepper: getRequiredEnv("INVOICE_KEY_PEPPER"),
  };
}

export function getInvoiceKeyPepper() {
  return getRequiredEnv("INVOICE_KEY_PEPPER");
}

export function getCoinMarketCapApiKey() {
  const value = process.env.COINMARKETCAP_API_KEY?.trim();
  return value ? value : null;
}

export function getCoinMarketCapApiBase() {
  const value = process.env.COINMARKETCAP_API_BASE?.trim();
  return value && value.length > 0 ? value : "https://pro-api.coinmarketcap.com";
}
