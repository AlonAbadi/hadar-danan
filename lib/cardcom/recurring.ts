/**
 * Cardcom recurring billing helper — wraps BillGoldService.AddUpdateRecurringOrder.
 *
 * Cardcom runs the recurring schedule natively. After the first payment via
 * LowProfile (Operation=2) we hand the token to AddUpdateRecurringOrder and
 * Cardcom takes over: it charges the saved card every interval and hits our
 * /api/cardcom/webhook IndicatorUrl on each charge.
 *
 * IMPORTANT — credential pairing:
 *   The legacy *.aspx interfaces (LowProfile, ChargeToken, BillGoldGetLowProfileIndicator)
 *   and BillGoldService.asmx share the SAME UserName/Password pair. This is the
 *   pair you get from the dashboard as "ApiName" / "ApiPassword" — Cardcom
 *   confusingly labels them both ways. The newer REST /api/v11/* endpoints are
 *   the only ones that need different auth.
 *
 * SOURCES (verified):
 *   - SOAP schema browser: https://secure.cardcom.solutions/Interface/BillGoldService.asmx?op=AddUpdateRecurringOrder
 *   - Operation strings: NewAndUpdate (single endpoint handles create + update)
 *
 * UNVERIFIED — TimeIntervalId numeric for monthly:
 *   Cardcom's product page lists weekly/monthly/bi-monthly/annual but no public
 *   source documents the enum. Industry convention puts monthly at 2. We log
 *   this on the first real call and verify in the Cardcom dashboard before
 *   trusting it. If wrong, change MONTHLY here and redeploy — no schema impact.
 */

const SOAP_URL = "https://secure.cardcom.solutions/Interface/BillGoldService.asmx";
const SOAP_NAMESPACE = "BillGoldService";

// VERIFY on first live charge: monthly billing interval code.
// Industry convention; will be confirmed against the resulting recurring row in
// the Cardcom dashboard before we ship to real customers.
export const TIME_INTERVAL_MONTHLY = 2;

// "Indefinite" — Cardcom takes the max int it can hold. 999 months ≈ 83 years,
// which is well past any realistic subscription lifetime and avoids hitting
// any signed-int boundary on the server side.
export const INDEFINITE_BILLS = 999;

// Tax invoice receipt (חשבונית מס קבלה) — what Cardcom issues on each charge.
export const DOC_TYPE_INVOICE_RECEIPT = 1;

// ILS
const COIN_ILS = 1;

// ── XML helpers ─────────────────────────────────────────────────────────────

function esc(s: string | number | undefined | null): string {
  if (s === undefined || s === null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function tagValue(xml: string, tag: string): string | null {
  // Tolerant to namespace prefixes: matches <tag>...</tag> with optional prefix
  const re = new RegExp(`<(?:[\\w-]+:)?${tag}>([\\s\\S]*?)</(?:[\\w-]+:)?${tag}>`);
  const m = xml.match(re);
  return m ? m[1].trim() : null;
}

// ── Create / activate a recurring order ─────────────────────────────────────

export interface CreateRecurringOrderInput {
  // For the Account block
  customerName:  string;
  customerEmail: string;
  customerPhone: string;

  // For the CreditCard block — these come from the LowProfile success response
  token:        string;
  validMonth:   number;
  validYear:    number;

  // For the recurring payment definition
  internalDescription: string;     // e.g. "Hive basic 59"
  amount:              number;     // ILS, integer
  nextDateToBill:      string;     // YYYY-MM-DD (today + 30 days for monthly)
  invoiceLineDescription: string;  // shown on each generated invoice

  // Identification we echo back when Cardcom calls our IndicatorUrl on each charge
  returnValue: string;             // we use the user_id here
}

export type CreateRecurringOrderResult =
  | { ok: true;  recurringId: number; accountId: number | null; isNew: boolean }
  | { ok: false; error: string;       responseCode?: string; raw?: string };

export async function createRecurringOrder(
  input: CreateRecurringOrderInput
): Promise<CreateRecurringOrderResult> {
  const terminal = process.env.CARDCOM_TERMINAL;
  const apiName  = process.env.CARDCOM_API_NAME;
  const apiPass  = process.env.CARDCOM_API_PASSWORD;

  if (!terminal || !apiName || !apiPass) {
    return { ok: false, error: "Cardcom credentials not fully configured" };
  }

  // Build the SOAP envelope. We use SOAP 1.1 — matches the schema browser doc.
  const body =
`<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <AddUpdateRecurringOrder xmlns="${SOAP_NAMESPACE}">
      <TerminalNumber>${esc(terminal)}</TerminalNumber>
      <UserName>${esc(apiName)}</UserName>
      <Password>${esc(apiPass)}</Password>
      <RecurringOrder>
        <Operation>NewAndUpdate</Operation>
        <Account>
          <FirstName>${esc(input.customerName)}</FirstName>
          <ContactName>${esc(input.customerName)}</ContactName>
          <Email>${esc(input.customerEmail)}</Email>
          <PhMobile>${esc(input.customerPhone)}</PhMobile>
          <InvoiceByMail>true</InvoiceByMail>
          <RecurringPaymentsActive>true</RecurringPaymentsActive>
        </Account>
        <CreditCard>
          <Token>${esc(input.token)}</Token>
          <Month>${esc(input.validMonth)}</Month>
          <Year>${esc(input.validYear)}</Year>
        </CreditCard>
        <RecurringPayments>
          <ExtRecurringPayments>
            <InternalDecription>${esc(input.internalDescription)}</InternalDecription>
            <NextDateToBill>${esc(input.nextDateToBill)}T00:00:00</NextDateToBill>
            <TotalNumOfBills>${INDEFINITE_BILLS}</TotalNumOfBills>
            <NumOfPaymentsAlreadyCharged>1</NumOfPaymentsAlreadyCharged>
            <IsActive>true</IsActive>
            <TimeIntervalId>${TIME_INTERVAL_MONTHLY}</TimeIntervalId>
            <FinalDebitCoinId>${COIN_ILS}</FinalDebitCoinId>
            <IsInvoiceCreate>true</IsInvoiceCreate>
            <DocTypeToCreate>${DOC_TYPE_INVOICE_RECEIPT}</DocTypeToCreate>
            <ReturnValue>${esc(input.returnValue)}</ReturnValue>
          </ExtRecurringPayments>
        </RecurringPayments>
      </RecurringOrder>
    </AddUpdateRecurringOrder>
  </soap:Body>
</soap:Envelope>`;

  let res: Response;
  try {
    res = await fetch(SOAP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction":   `"${SOAP_NAMESPACE}/AddUpdateRecurringOrder"`,
      },
      body,
    });
  } catch (e) {
    return { ok: false, error: `SOAP request failed: ${String(e)}` };
  }

  const xml = await res.text();
  const responseCode = tagValue(xml, "ResponseCode");
  const description  = tagValue(xml, "Description");
  const recurringId  = tagValue(xml, "RecurringId");
  const accountId    = tagValue(xml, "AccountId");
  const isNewRec     = tagValue(xml, "IsNewRecurring");

  if (responseCode !== "0" || !recurringId) {
    return {
      ok:           false,
      error:        description ?? "AddUpdateRecurringOrder failed",
      responseCode: responseCode ?? undefined,
      raw:          xml,
    };
  }

  return {
    ok:          true,
    recurringId: parseInt(recurringId, 10),
    accountId:   accountId ? parseInt(accountId, 10) : null,
    isNew:       isNewRec === "true",
  };
}

// ── Cancel a recurring order ────────────────────────────────────────────────

export type CancelRecurringResult =
  | { ok: true }
  | { ok: false; error: string; responseCode?: string; raw?: string };

export async function cancelRecurringOrder(recurringId: number): Promise<CancelRecurringResult> {
  const terminal = process.env.CARDCOM_TERMINAL;
  const apiName  = process.env.CARDCOM_API_NAME;
  const apiPass  = process.env.CARDCOM_API_PASSWORD;

  if (!terminal || !apiName || !apiPass) {
    return { ok: false, error: "Cardcom credentials not fully configured" };
  }

  // Update the existing recurring payment with IsActive=false. Cardcom keeps
  // the order row but stops charging.
  const body =
`<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <AddUpdateRecurringOrder xmlns="${SOAP_NAMESPACE}">
      <TerminalNumber>${esc(terminal)}</TerminalNumber>
      <UserName>${esc(apiName)}</UserName>
      <Password>${esc(apiPass)}</Password>
      <RecurringOrder>
        <Operation>NewAndUpdate</Operation>
        <RecurringPayments>
          <ExtRecurringPayments>
            <RecurringId>${recurringId}</RecurringId>
            <IsActive>false</IsActive>
          </ExtRecurringPayments>
        </RecurringPayments>
      </RecurringOrder>
    </AddUpdateRecurringOrder>
  </soap:Body>
</soap:Envelope>`;

  let res: Response;
  try {
    res = await fetch(SOAP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction":   `"${SOAP_NAMESPACE}/AddUpdateRecurringOrder"`,
      },
      body,
    });
  } catch (e) {
    return { ok: false, error: `SOAP cancel request failed: ${String(e)}` };
  }

  const xml = await res.text();
  const responseCode = tagValue(xml, "ResponseCode");
  const description  = tagValue(xml, "Description");

  if (responseCode !== "0") {
    return {
      ok:           false,
      error:        description ?? "Cancel failed",
      responseCode: responseCode ?? undefined,
      raw:          xml,
    };
  }

  return { ok: true };
}
