import { BaseResource } from "./_base.js";
import type {
  CreatePermanentParams,
  ListResult,
  PermanentListParams,
} from "../types.js";

export interface PermanentAddress {
  id: string;
  user_id: string;
  family: string;
  address: string;
  asset?: string;
  notify_url?: string;
  metadata?: Record<string, unknown>;
  active: boolean;
  created_at?: number | string;
  [key: string]: unknown;
}

export interface PermanentDeactivated {
  id: string;
  active: false;
  [key: string]: unknown;
}

export class PermanentResource extends BaseResource {
  create(params: CreatePermanentParams): Promise<PermanentAddress> {
    return this.client.request<PermanentAddress>({
      method: "POST",
      path: "/api/v2/permanent",
      body: params,
    });
  }

  get(addressId: string): Promise<PermanentAddress> {
    return this.client.request<PermanentAddress>({
      method: "GET",
      path: `/api/v2/permanent/${encodeURIComponent(addressId)}`,
    });
  }

  list(params?: PermanentListParams): Promise<ListResult<PermanentAddress>> {
    return this.client.requestList<PermanentAddress>({
      method: "GET",
      path: "/api/v2/permanent",
      query: params as Record<string, unknown> | undefined,
    });
  }

  deactivate(addressId: string): Promise<PermanentDeactivated> {
    return this.client.request<PermanentDeactivated>({
      method: "DELETE",
      path: `/api/v2/permanent/${encodeURIComponent(addressId)}`,
    });
  }
}
