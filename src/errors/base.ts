/** Fields used to construct a {@link HabboApiError}. */
export interface HabboApiErrorInit {
  /** HTTP status code returned by the API. */
  status: number;
  /** HTTP status text returned by the API. */
  statusText: string;
  /** Absolute URL that was requested. */
  url: string;
  /** Parsed response body (JSON when possible, otherwise raw text). */
  body: unknown;
  /** Machine-readable error code from the body (e.g. `"not-found"`), if any. */
  code?: string;
  /** Overrides the generated error message. */
  message?: string;
}

/**
 * Base error thrown when the Habbo API responds with a non-2xx status code.
 */
export class HabboApiError extends Error {
  /** HTTP status code returned by the API. */
  public readonly status: number;
  /** HTTP status text returned by the API. */
  public readonly statusText: string;
  /** Absolute URL that was requested. */
  public readonly url: string;
  /** Parsed response body (JSON when possible, otherwise raw text). */
  public readonly body: unknown;
  /** Machine-readable error code from the body (e.g. `"not-found"`), if any. */
  public readonly code?: string;

  constructor(init: HabboApiErrorInit) {
    super(
      init.message ??
        `Habbo API request failed: ${init.status} ${init.statusText} (${init.url})`,
    );
    this.name = new.target.name;
    this.status = init.status;
    this.statusText = init.statusText;
    this.url = init.url;
    this.body = init.body;
    this.code = init.code;
    // Restore the prototype chain (needed when targeting ES5/ES2015+ output).
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
