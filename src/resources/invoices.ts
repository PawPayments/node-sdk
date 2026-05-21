import { BaseResource } from "./_base.js";
import type {
  CreateInvoiceParams,
  InvoiceListParams,
  InvoiceAddressFlow,
  ListResult,
  PayerInfo,
} from "../types.js";

export interface Invoice extends InvoiceAddressFlow {
  order_id: string;
  external_id?: string | null;
  status?: string | null;
  asset?: string | null;
  initial_asset?: string | null;
  type?: string | null;
  amount?: number | string | null;
  initial_amount?: number | string | null;
  fiat_amount?: number | string | null;
  initial_fiat_amount?: number | string | null;
  fiat_currency?: string | null;
  billing_type?: string | null;
  extra?: string | null;
  title?: string | null;
  description?: string | null;
  expires_at?: number | string | null;
  metadata?: Record<string, unknown> | null;
  fee_bearer?: string | null;
  underpay_tolerance?: number | null;
  accepted_coins?: string[] | null;
  excluded_coins?: string[] | null;
  on_paid_url?: string | null;
  on_cancel_url?: string | null;
  notify_url?: string | null;
  price_modifier?: number | null;
  original_amount?: number | string | null;
  payer_info?: PayerInfo | null;
  permanent_address_id?: string | null;
  user_id?: string | null;
  received_amount?: number | string | null;
  txid?: string | null;
  payment_url?: string | null;
  webhook_format?: string | null;
  created_at?: number | string | null;
  processed_at?: number | string | null;
  [key: string]: unknown;
}

export interface NotifyQueued {
  message: string;
  [key: string]: unknown;
}

export class InvoicesResource extends BaseResource {
  create(params: CreateInvoiceParams): Promise<Invoice> {
    return this.client.request<Invoice>({
      method: "POST",
      path: "/api/v2/invoices",
      body: params,
    });
  }

  get(orderId: string): Promise<Invoice> {
    return this.client.request<Invoice>({
      method: "GET",
      path: `/api/v2/invoices/${encodeURIComponent(orderId)}`,
    });
  }

  list(params?: InvoiceListParams): Promise<ListResult<Invoice>> {
    return this.client.requestList<Invoice>({
      method: "GET",
      path: "/api/v2/invoices",
      query: params as Record<string, unknown> | undefined,
    });
  }

  notify(orderId: string): Promise<NotifyQueued> {
    return this.client.request<NotifyQueued>({
      method: "POST",
      path: `/api/v2/invoices/${encodeURIComponent(orderId)}/notify`,
    });
  }
}
