/**
 * server/odoo/modules/accounting.ts
 *
 * Accounting domain — invoices, payments, chart of accounts, journal entries.
 */

import { odooSearchRead } from "../helpers";
import type { Invoice, Payment, Account, JournalEntryLine } from "../types";

const INVOICE_FIELDS = [
  "name", "partner_id", "invoice_date", "invoice_date_due",
  "amount_total", "amount_residual", "state", "move_type",
  "currency_id", "payment_state", "ref", "narration",
];

const PAYMENT_FIELDS = [
  "name", "partner_id", "amount", "date", "state",
  "payment_type", "currency_id", "journal_id", "memo",
];

const ACCOUNT_FIELDS = [
  "name", "code", "account_type", "currency_id",
  "deprecated", "company_id",
];

const JOURNAL_LINE_FIELDS = [
  "name", "account_id", "debit", "credit", "date", "move_id",
];

export async function getInvoices(
  type: "in_invoice" | "out_invoice" | "all" = "all",
  limit = 50,
): Promise<Invoice[]> {
  const domain = type === "all" ? [] : [["move_type", "=", type]];
  return odooSearchRead<Invoice>("account.move", domain, INVOICE_FIELDS, {
    limit,
    order: "invoice_date desc",
  });
}

export async function getPayments(limit = 50): Promise<Payment[]> {
  return odooSearchRead<Payment>("account.payment", [], PAYMENT_FIELDS, {
    limit,
    order: "date desc",
  });
}

export async function getChartOfAccounts(limit = 200): Promise<Account[]> {
  return odooSearchRead<Account>("account.account", [], ACCOUNT_FIELDS, {
    limit,
    order: "code asc",
  });
}

export async function getJournalEntries(limit = 100): Promise<JournalEntryLine[]> {
  return odooSearchRead<JournalEntryLine>(
    "account.move.line",
    [["display_type", "=", false]], // exclude section/note lines
    JOURNAL_LINE_FIELDS,
    { limit, order: "date desc" },
  );
}
