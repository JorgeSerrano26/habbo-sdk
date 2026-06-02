/** Error thrown when a request is aborted by timeout. */
export class HabboTimeoutError extends Error {
  public readonly url: string;
  public readonly timeoutMs: number;

  constructor(url: string, timeoutMs: number) {
    super(`Habbo API request timed out after ${timeoutMs}ms (${url})`);
    this.name = 'HabboTimeoutError';
    this.url = url;
    this.timeoutMs = timeoutMs;
    Object.setPrototypeOf(this, HabboTimeoutError.prototype);
  }
}
