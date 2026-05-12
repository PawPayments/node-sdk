import type { PawPayments } from "../client.js";

export class BaseResource {
  constructor(protected readonly client: PawPayments) {}
}
