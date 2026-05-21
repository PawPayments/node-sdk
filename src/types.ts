export type FiatCurrency =
  | "USD"
  | "EUR"
  | "GBP"
  | "CAD"
  | "AUD"
  | "CHF"
  | "JPY"
  | "NZD"
  | "SGD"
  | "HKD"
  | "NGN"
  | "KRW"
  | "ILS"
  | "RON"
  | "ARS"
  | "INR"
  | "IDR"
  | "MXN"
  | "MYR"
  | "TRY"
  | "PLN"
  | "BRL"
  | "THB";
export type PayoutFiatCurrency = FiatCurrency | "native";
export type BillingType = "VARY" | "STATIC";
export type FeeBearer = "merchant" | "client";
export type WebhookFormat = "native_v2" | "cryptomus" | "heleket" | "nowpayments";
export type PermanentFamily =
  | "evm"
  | "bitcoin"
  | "litecoin"
  | "bitcoincash"
  | "tron"
  | "solana"
  | "xrp"
  | "ton";
export type SortField = "created_at" | "amount";
export type SortOrder = "asc" | "desc";
export type LedgerType = "income" | "payout" | "refund";

export interface Pagination {
  page: number;
  per_page: number;
  total: number;
  pages: number;
}

export interface ListResult<T> {
  items: T[];
  pagination: Pagination;
}

export interface PayerInfo {
  email?: string;
  name?: string;
  ip?: string;
}

export interface CreateInvoiceParams {
  amount: number | string;
  fiat_currency: FiatCurrency;
  billing_type: BillingType;
  asset?: string;
  chain?: string;
  extra?: string;
  notify_url?: string;
  ttl?: number;
  metadata?: Record<string, unknown>;
  title?: string;
  description?: string;
  underpay_tolerance?: number;
  accepted_coins?: string[];
  excluded_coins?: string[];
  on_paid_url?: string;
  on_cancel_url?: string;
  price_modifier?: number;
  fee_bearer?: FeeBearer;
  payer_info?: PayerInfo;
  webhook_format?: WebhookFormat;
  permanent_address?: boolean;
  user_id?: string;
}

export interface InvoiceListParams {
  page?: number;
  per_page?: number;
  sort?: SortField;
  order?: SortOrder;
  date_from?: string;
  date_to?: string;
  order_ids?: string[] | string;
  status?: string;
  asset?: string;
}

export interface InvoiceAddressFlow {
  address_to?: string | null;
  address_from?: string | null;
}

export interface CreatePayoutParams {
  address: string;
  amount: number | string;
  fiat_currency: PayoutFiatCurrency;
  asset: string;
  ref?: string;
}

export interface BatchPayoutItem {
  address: string;
  amount: number | string;
  fiat_currency: PayoutFiatCurrency;
  asset: string;
  ref?: string;
}

export interface PayoutListParams {
  page?: number;
  per_page?: number;
  sort?: SortField;
  order?: SortOrder;
  date_from?: string;
  date_to?: string;
  order_ids?: string[] | string;
  status?: string;
  asset?: string;
}

export interface LedgerListParams {
  page?: number;
  per_page?: number;
  date_from?: string;
  date_to?: string;
  type?: LedgerType;
}

export interface NotificationListParams {
  page?: number;
  per_page?: number;
  invoice_id?: string;
}

export interface CreatePermanentParams {
  user_id: string;
  /** Provide either `family` or `asset` (or both). */
  family?: PermanentFamily;
  /** Asset ticker (e.g. `usdt_trc20`). Used to infer `family` when omitted. */
  asset?: string;
  notify_url?: string;
  metadata?: Record<string, unknown>;
}

export interface PermanentListParams {
  page?: number;
  per_page?: number;
  user_id?: string;
  family?: PermanentFamily;
  active?: boolean;
}

export interface RatesParams {
  base?: FiatCurrency;
  assets?: string[] | string;
}

export interface RequestOptions {
  uniqId?: string;
  signal?: AbortSignal;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json };
