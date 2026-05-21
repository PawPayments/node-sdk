import { BaseResource } from "./_base.js";
import type { ListResult, NotificationListParams } from "../types.js";

export interface NotificationLog {
  id: string;
  invoice_id: string;
  url?: string | null;
  status_code?: number | null;
  attempt?: number;
  sent_at?: number | null;
  response_body?: string | null;
  [key: string]: unknown;
}

export interface WebhookProbeResult {
  url: string;
  status_code: number | null;
  delivered: boolean;
  error: string | null;
  [key: string]: unknown;
}

export class NotificationsResource extends BaseResource {
  list(params?: NotificationListParams): Promise<ListResult<NotificationLog>> {
    return this.client.requestList<NotificationLog>({
      method: "GET",
      path: "/api/v2/notifications",
      query: params as Record<string, unknown> | undefined,
    });
  }

  test(url?: string): Promise<WebhookProbeResult> {
    return this.client.request<WebhookProbeResult>({
      method: "POST",
      path: "/api/v2/notifications/test",
      body: url ? { url } : {},
    });
  }
}
