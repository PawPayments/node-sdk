import { BaseResource } from "./_base.js";
import type {
  CreateInvoiceParams,
  InvoiceListParams,
  ListResult,
  PayerInfo,
} from "../types.js";

export interface Invoice {
  order_id: string;
  status: string;
  amount: number | string;
  fiat_amount: number | string;
  fiat_currency: string;
  asset?: string;
  address?: string;
  payment_url?: string;
  external_id?: string;
  created_at?: number | string;
  expires_at?: number | string;
  metadata?: Record<string, unknown>;
  payer_info?: PayerInfo;
  permanent_address_id?: string | null;
  [key: string]: unknown;
}

export interface NotifyQueued {
  queued: boolean;
  invoice_id: string;
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
