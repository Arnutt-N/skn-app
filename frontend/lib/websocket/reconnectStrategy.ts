export interface ReconnectStrategy {
  getDelay(attempt: number): number;
  shouldRetry(attempt: number): boolean;
  reset(): void;
}

export class ExponentialBackoffStrategy implements ReconnectStrategy {
  private attempt = 0;

  constructor(
    private baseDelay: number = 1000,
    private maxDelay: number = 30000,
    private maxAttempts: number = 10,
    private jitter: boolean = true
  ) {}

  getDelay(attempt: number): number {
    const exponentialDelay = Math.min(
      this.baseDelay * Math.pow(2, attempt),
      this.maxDelay
    );

    if (this.jitter) {
      // Add random jitter (0-1000ms) to prevent thundering herd
      return exponentialDelay + Math.random() * 1000;
    }

    return exponentialDelay;
  }

  shouldRetry(attempt: number): boolean {
    return attempt < this.maxAttempts;
  }

  reset(): void {
    this.attempt = 0;
  }
}
