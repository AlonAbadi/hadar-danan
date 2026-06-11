/**
 * Cardcom LowProfile helper — opens a hosted-payment session.
 *
 * For Hive subscriptions we use Operation=2 (charge + create token) so that on
 * success Cardcom returns a reusable Token we can hand to AddUpdateRecurringOrder.
 * For one-time products, /api/checkout still uses its own inline call with
 * Operation=1 — we don't refactor that to keep live billing untouched.
 *
 * Reference fields:
 * - Operation=1 → charge only
 * - Operation=2 → charge + tokenize  ← Hive uses this
 * - Operation=3 → tokenize without charging
 */

const LOWPROFILE_URL = "https://secure.cardcom.solutions/Interface/LowProfile.aspx";

export interface HiveLowProfileInput {
  purchaseId:    string;
  amount:        number;            // ILS, integer (59 or 149)
  productName:   string;            // displayed on Cardcom page
  customerName:  string;
  customerEmail: string;
  customerPhone: string;
  appUrl:        string;            // for redirect + indicator URLs
}

export type LowProfileResult =
  | { ok: true;  redirectUrl: string }
  | { ok: false; error: string; raw?: string };

export async function createHiveLowProfileSession(
  input: HiveLowProfileInput
): Promise<LowProfileResult> {
  const terminal = process.env.CARDCOM_TERMINAL;
  const apiName  = process.env.CARDCOM_API_NAME;
  const wt       = process.env.CARDCOM_WEBHOOK_TOKEN ?? "";

  if (!terminal || !apiName) {
    return { ok: false, error: "Cardcom credentials not configured" };
  }

  const params = new URLSearchParams({
    TerminalNumber: terminal,
    UserName:       apiName,
    SumToBill:      String(input.amount),
    CoinId:         "1",            // ILS
    Language:       "he",
    APILevel:       "10",
    Codepage:       "65001",
    Operation:      "2",            // charge + create token

    // Our purchase.id echoed back so the webhook can identify the row
    ReturnValue:    input.purchaseId,

    SuccessRedirectUrl: `${input.appUrl}/account?welcome=hive`,
    ErrorRedirectUrl:   `${input.appUrl}/hive?payment=failed`,
    IndicatorUrl:       `${input.appUrl}/api/cardcom/webhook?order=${input.purchaseId}&wt=${wt}`,

    ProductName:     input.productName,
    CardOwnerName:   input.customerName,
    CardOwnerEmail:  input.customerEmail,
    CardOwnerPhone:  input.customerPhone,

    ShowCardOwnerEmail:   "true",
    ReqCardOwnerEmail:    "true",
    ShowCardOwnerPhone:   "true",
    ReqCardOwnerPhone:    "true",
    ShowInvoiceHead:      "true",
    HideCreditCardUserId: "false",

    // Subscriptions don't split into installments — force a single payment
    MaxNumOfPayments:     "1",
    MinNumOfPayments:     "1",
    DefaultNumOfPayments: "1",
    CreditTipe:           "1",

    // Generate a tax-invoice-receipt for the first month immediately
    InvoiceHeadOperation:       "1",
    DocTypeToCreate:             "1",
    "InvoiceHead.CustName":      input.customerName,
    "InvoiceHead.SendByEmail":   "true",
    "InvoiceHead.Email":         input.customerEmail,
    "InvoiceHead.Language":      "he",
    "InvoiceHead.CoinID":        "1",
    "InvoiceLines.Description":  input.productName,
    "InvoiceLines.Price":        String(input.amount),
    "InvoiceLines.Quantity":     "1",
    "InvoiceLines.IsVatFree":    "false",
  });

  let res: Response;
  try {
    res = await fetch(LOWPROFILE_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    params.toString(),
    });
  } catch (e) {
    return { ok: false, error: `LowProfile POST failed: ${String(e)}` };
  }

  const text   = await res.text();
  const result = new URLSearchParams(text);
  const responseCode    = result.get("ResponseCode");
  const lowProfileCode  = result.get("LowProfileCode");

  if (responseCode !== "0" || !lowProfileCode) {
    return {
      ok:    false,
      error: `Cardcom LowProfile returned ResponseCode=${responseCode}`,
      raw:   text,
    };
  }

  return {
    ok: true,
    redirectUrl: `https://secure.cardcom.solutions/External/lowProfileClearing/${terminal}.aspx?LowProfileCode=${lowProfileCode}`,
  };
}

/**
 * Extract token + card-validity fields from a successful indicator response.
 * These are the fields we get back in the webhook after Operation=2 succeeds.
 *
 * Field names verified against the gasner/cardcom PHP SDK (production-grade,
 * parses live Cardcom responses): the token is NOT a top-level "Token" field
 * but lives under `ExtShvaParams.CardToken`, with masked display digits at
 * `ExtShvaParams.CardNumber5`.
 */
export interface TokenizedCardFields {
  token:        string | null;
  validMonth:   number | null;
  validYear:    number | null;
  last4Display: string | null;   // masked string from Cardcom — show as-is
}

export function extractTokenizedCardFields(data: Record<string, string>): TokenizedCardFields {
  // Cardcom flattens nested ExtShvaParams.X into "ExtShvaParams_X" in the
  // URL-encoded response. Some integrations also see "ExtShvaParams.X" with
  // a literal dot — handle both.
  const get = (k: string) =>
    data[k] ?? data[k.replace(/_/g, ".")] ?? data[k.replace(/\./g, "_")] ?? null;

  const token = get("ExtShvaParams_CardToken") || null;
  const validMonthRaw = data.CardValidityMonth;
  const validYearRaw  = data.CardValidityYear;
  const last4Display  = get("ExtShvaParams_CardNumber5");

  const validMonth = validMonthRaw ? parseInt(validMonthRaw, 10) : null;
  const validYear  = validYearRaw  ? parseInt(validYearRaw,  10) : null;

  return {
    token,
    validMonth: Number.isFinite(validMonth) ? validMonth : null,
    validYear:  Number.isFinite(validYear)  ? validYear  : null,
    last4Display,
  };
}
