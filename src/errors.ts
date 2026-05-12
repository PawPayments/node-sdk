export interface ApiErrorDetail {
  field?: string;
  message?: string;
  [key: string]: unknown;
}

export class PawPaymentsApiError extends Error {
  public readonly code: string;
  public readonly httpStatus: number | null;
  public readonly details: ApiErrorDetail[] | null;

  constructor(
    message: string,
    code: string = "UNKNOWN",
    httpStatus: number | null = null,
    details: ApiErrorDetail[] | null = null,
    options?: { cause?: unknown },
  ) {
    super(message, options as ErrorOptions | undefined);
    this.name = "PawPaymentsApiError";
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
    Object.setPrototypeOf(this, PawPaymentsApiError.prototype);
  }
}
