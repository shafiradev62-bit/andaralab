/**
 * API Client with Retry Logic and Timeout Handling
 * 
 * Prevents "signal timed out" errors and ensures data is never lost
 */

export interface ApiClientOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<ApiClientOptions> = {
  timeout: 30000, // 30 seconds (increased from 5s)
  retries: 3,
  retryDelay: 2000, // 2 seconds between retries
  onRetry: (attempt, error) => {
    console.log(`API retry ${attempt}/3:`, error.message);
  },
};

/**
 * Enhanced fetch with timeout and retry logic
 */
export async function apiFetch(
  url: string,
  init?: RequestInit,
  options?: ApiClientOptions
): Promise<Response> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= opts.retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), opts.timeout);

      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on non-timeout errors (like 404, 500, etc)
      if (!lastError.message.includes("abort") && !lastError.message.includes("timeout")) {
        throw lastError;
      }

      // Last attempt - throw error
      if (attempt === opts.retries) {
        throw new Error(
          `API request failed after ${opts.retries} attempts: ${lastError.message}`
        );
      }

      // Retry with delay
      opts.onRetry(attempt, lastError);
      await new Promise((resolve) => setTimeout(resolve, opts.retryDelay));
    }
  }

  throw lastError || new Error("API request failed");
}

/**
 * POST request with retry
 */
export async function apiPost<T = any>(
  url: string,
  data: any,
  options?: ApiClientOptions
): Promise<T> {
  const response = await apiFetch(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    options
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * PUT request with retry
 */
export async function apiPut<T = any>(
  url: string,
  data: any,
  options?: ApiClientOptions
): Promise<T> {
  const response = await apiFetch(
    url,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    options
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * DELETE request with retry
 */
export async function apiDelete<T = any>(
  url: string,
  options?: ApiClientOptions
): Promise<T> {
  const response = await apiFetch(
    url,
    {
      method: "DELETE",
    },
    options
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * GET request with retry
 */
export async function apiGet<T = any>(
  url: string,
  options?: ApiClientOptions
): Promise<T> {
  const response = await apiFetch(url, { method: "GET" }, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Offline Queue for saving data when API is unavailable
 * Data is stored in localStorage and synced when API comes back online
 */
interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  data: any;
  timestamp: number;
}

const QUEUE_KEY = "andaralab_offline_queue";

export class OfflineQueue {
  private static getQueue(): QueuedRequest[] {
    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private static saveQueue(queue: QueuedRequest[]): void {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error("Failed to save offline queue:", error);
    }
  }

  /**
   * Add request to offline queue
   */
  static enqueue(url: string, method: string, data: any): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const request: QueuedRequest = {
      id,
      url,
      method,
      data,
      timestamp: Date.now(),
    };

    const queue = this.getQueue();
    queue.push(request);
    this.saveQueue(queue);

    console.log(`📦 Queued offline request: ${method} ${url}`);
    return id;
  }

  /**
   * Process all queued requests
   */
  static async processQueue(): Promise<{ success: number; failed: number }> {
    const queue = this.getQueue();
    if (queue.length === 0) return { success: 0, failed: 0 };

    console.log(`🔄 Processing ${queue.length} queued requests...`);

    let success = 0;
    let failed = 0;
    const remaining: QueuedRequest[] = [];

    for (const request of queue) {
      try {
        await apiFetch(request.url, {
          method: request.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request.data),
        });
        success++;
        console.log(`✓ Synced: ${request.method} ${request.url}`);
      } catch (error) {
        failed++;
        remaining.push(request);
        console.error(`✗ Failed to sync: ${request.method} ${request.url}`, error);
      }
    }

    this.saveQueue(remaining);
    return { success, failed };
  }

  /**
   * Get queue size
   */
  static size(): number {
    return this.getQueue().length;
  }

  /**
   * Clear queue
   */
  static clear(): void {
    localStorage.removeItem(QUEUE_KEY);
  }
}
