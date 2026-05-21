import { PawPaymentsApiError } from "./errors.js";
import { AssetsResource } from "./resources/assets.js";
import { BalanceResource } from "./resources/balance.js";
import { InvoicesResource } from "./resources/invoices.js";
import { LedgerResource } from "./resources/ledger.js";
import { NotificationsResource } from "./resources/notifications.js";
import { PayoutsResource } from "./resources/payouts.js";
import { PermanentResource } from "./resources/permanent.js";
import { RatesResource } from "./resources/rates.js";
import type { Json, ListResult, Pagination, RequestOptions } from "./types.js";
import { DEFAULT_USER_AGENT } from "./version.js";

export interface PawPaymentsOptions {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
}

export interface RequestSpec {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
}

interface RawResponse {
  status: number;
  decoded: Record<string, unknown> | null;
}

export class PawPayments {
  public readonly baseUrl: string;
  public readonly timeoutMs: number;
  private readonly apiKey: string;
  private readonly fetchImpl: typeof fetch;

  public readonly assets: AssetsResource;
  public readonly rates: RatesResource;
  public readonly balance: BalanceResource;
  public readonly invoices: InvoicesResource;
  public readonly payouts: PayoutsResource;
  public readonly ledger: LedgerResource;
  public readonly notifications: NotificationsResource;
  public readonly permanent: PermanentResource;

  constructor(options: PawPaymentsOptions) {
    if (!options || !options.apiKey) {
      throw new Error("PawPayments: apiKey is required");
    }
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? "https://api.pawpayments.com").replace(/\/+$/, "");
    this.timeoutMs = options.timeoutMs ?? 30_000;
    const f = options.fetch ?? globalThis.fetch;
    if (!f) {
      throw new Error("PawPayments: global fetch is unavailable. Pass options.fetch or use Node 18+.");
    }
    this.fetchImpl = f.bind(globalThis);

    this.assets = new AssetsResource(this);
    this.rates = new RatesResource(this);
    this.balance = new BalanceResource(this);
    this.invoices = new InvoicesResource(this);
    this.payouts = new PayoutsResource(this);
    this.ledger = new LedgerResource(this);
    this.notifications = new NotificationsResource(this);
    this.permanent = new PermanentResource(this);
  }

  async request<T = Json>(spec: RequestSpec, options?: RequestOptions): Promise<T> {
    const { decoded } = await this._send(spec, options);
    if (decoded && "result" in decoded) return decoded["result"] as T;
    if (decoded && "data" in decoded) return decoded["data"] as T;
    return (decoded ?? {}) as T;
  }

  async requestList<T = Json>(spec: RequestSpec, options?: RequestOptions): Promise<ListResult<T>> {
    const { decoded } = await this._send(spec, options);
    const items = (decoded?.["result"] ?? decoded?.["data"] ?? []) as T[];
    const pagination = (decoded?.["pagination"] as Pagination | undefined) ?? {
      page: 1,
      per_page: items.length,
      total: items.length,
      pages: 1,
    };
    return { items, pagination };
  }

  private async _send(spec: RequestSpec, options?: RequestOptions): Promise<RawResponse> {
    const url = new URL(this.baseUrl + spec.path);
    if (spec.query) {
      for (const [key, value] of Object.entries(spec.query)) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) {
          if (value.length === 0) continue;
          url.searchParams.set(key, value.join(","));
        } else if (typeof value === "boolean") {
          url.searchParams.set(key, value ? "true" : "false");
        } else {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      "x-api-key": this.apiKey,
      Accept: "application/json",
      "User-Agent": DEFAULT_USER_AGENT,
      ...(spec.headers ?? {}),
    };
    if (options?.uniqId) headers["x-uniq-id"] = options.uniqId;

    const init: RequestInit = { method: spec.method, headers };
    if (spec.body !== undefined && spec.body !== null) {
      init.body = JSON.stringify(spec.body);
      headers["Content-Type"] = "application/json";
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    if (options?.signal) {
      if (options.signal.aborted) controller.abort();
      else options.signal.addEventListener("abort", () => controller.abort(), { once: true });
    }
    init.signal = controller.signal;

    let response: Response;
    try {
      response = await this.fetchImpl(url, init);
    } catch (err) {
      const e = err as Error;
      const isAbort = e?.name === "AbortError";
      throw new PawPaymentsApiError(
        isAbort ? `Request timed out after ${this.timeoutMs}ms` : `Network error: ${e.message}`,
        isAbort ? "TIMEOUT" : "NETWORK_ERROR",
        null,
        null,
        { cause: err },
      );
    } finally {
      clearTimeout(timer);
    }

    const text = await response.text();
    let decoded: Record<string, unknown> | null = null;
    if (text) {
      try {
        decoded = JSON.parse(text) as Record<string, unknown>;
      } catch {
        throw new PawPaymentsApiError(
          `Invalid JSON response (HTTP ${response.status})`,
          "INVALID_RESPONSE",
          response.status,
        );
      }
    }

    if (!response.ok || (decoded && decoded["ok"] === false)) {
      const err = decoded?.["error"];
      let code = "UNKNOWN";
      let message = `HTTP ${response.status}`;
      let details: Array<Record<string, unknown>> | null = null;
      if (err && typeof err === "object") {
        const e = err as Record<string, unknown>;
        code = String(e["code"] ?? code);
        message = String(e["message"] ?? message);
        if (Array.isArray(e["details"])) details = e["details"] as Array<Record<string, unknown>>;
      } else if (decoded) {
        code = String(decoded["code"] ?? err ?? code);
        message = String(decoded["message"] ?? err ?? message);
      }
      throw new PawPaymentsApiError(message, code, response.status, details);
    }

    return { status: response.status, decoded };
  }
}
