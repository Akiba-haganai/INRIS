
export class RateLimiter {
  private map = new Map<string, { count: number; expiresAt: number }>()

  constructor(public maxTokens: number, public windowMs: number) {}

  check(id: string): boolean {
    const now = Date.now()
    const record = this.map.get(id)

    if (!record || record.expiresAt < now) {
      this.map.set(id, { count: 1, expiresAt: now + this.windowMs })
      return true
    }

    if (record.count >= this.maxTokens) {
      return false
    }

    record.count++
    return true
  }

  // Optional: clear expired to prevent memory leaks in long-running processes
  cleanup() {
    const now = Date.now()
    for (const [key, record] of this.map.entries()) {
      if (record.expiresAt < now) {
        this.map.delete(key)
      }
    }
  }
}

// Global instances for the Edge/Node process
export const chatRateLimit = new RateLimiter(10, 60 * 1000) // 10 requests per minute
export const analyzeRateLimit = new RateLimiter(20, 60 * 1000) // 20 requests per minute
