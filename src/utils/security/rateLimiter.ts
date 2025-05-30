
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (identifier: string) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private static instances = new Map<string, RateLimiter>();
  private requests = new Map<string, RateLimitEntry>();

  constructor(private config: RateLimitConfig) {}

  static getInstance(name: string, config: RateLimitConfig): RateLimiter {
    if (!this.instances.has(name)) {
      this.instances.set(name, new RateLimiter(config));
    }
    return this.instances.get(name)!;
  }

  checkLimit(identifier: string): { allowed: boolean; resetTime?: number; remaining?: number } {
    const key = this.config.keyGenerator ? this.config.keyGenerator(identifier) : identifier;
    const now = Date.now();
    
    // Clean up expired entries
    this.cleanup(now);

    const entry = this.requests.get(key);
    
    if (!entry) {
      // First request
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs
      });
      return { 
        allowed: true, 
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs
      };
    }

    if (now > entry.resetTime) {
      // Window has expired, reset
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs
      });
      return { 
        allowed: true, 
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs
      };
    }

    if (entry.count >= this.config.maxRequests) {
      // Rate limit exceeded
      return { 
        allowed: false, 
        resetTime: entry.resetTime,
        remaining: 0
      };
    }

    // Increment count
    entry.count++;
    this.requests.set(key, entry);
    
    return { 
      allowed: true, 
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  private cleanup(now: number) {
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// Pre-configured rate limiters
export const chatRateLimiter = RateLimiter.getInstance('chat', {
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
});

export const apiRateLimiter = RateLimiter.getInstance('api', {
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
});
