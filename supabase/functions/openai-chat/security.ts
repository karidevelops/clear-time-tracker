
export const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

interface RateLimitState {
  [key: string]: {
    count: number;
    resetTime: number;
  }
}

const rateLimitState: RateLimitState = {};
const RATE_LIMIT_REQUESTS = 10;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

export function checkRateLimit(userId: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  const userKey = `chat_${userId}`;
  
  // Clean up expired entries
  Object.keys(rateLimitState).forEach(key => {
    if (now > rateLimitState[key].resetTime) {
      delete rateLimitState[key];
    }
  });

  const userState = rateLimitState[userKey];
  
  if (!userState) {
    rateLimitState[userKey] = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    };
    return { allowed: true };
  }

  if (now > userState.resetTime) {
    rateLimitState[userKey] = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    };
    return { allowed: true };
  }

  if (userState.count >= RATE_LIMIT_REQUESTS) {
    return { allowed: false, resetTime: userState.resetTime };
  }

  userState.count++;
  return { allowed: true };
}

export function validateChatInput(input: any): { valid: boolean; error?: string; sanitized?: any } {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'Invalid request format' };
  }

  const { messages, userId, appData } = input;

  // Validate messages
  if (!Array.isArray(messages)) {
    return { valid: false, error: 'Messages must be an array' };
  }

  if (messages.length === 0) {
    return { valid: false, error: 'Messages array cannot be empty' };
  }

  if (messages.length > 50) {
    return { valid: false, error: 'Too many messages in conversation' };
  }

  // Validate each message
  for (const message of messages) {
    if (!message || typeof message !== 'object') {
      return { valid: false, error: 'Invalid message format' };
    }

    if (!message.role || !['user', 'assistant', 'system'].includes(message.role)) {
      return { valid: false, error: 'Invalid message role' };
    }

    if (!message.content || typeof message.content !== 'string') {
      return { valid: false, error: 'Invalid message content' };
    }

    if (message.content.length > 2000) {
      return { valid: false, error: 'Message content too long' };
    }

    // Check for suspicious content
    if (containsSuspiciousContent(message.content)) {
      return { valid: false, error: 'Message contains invalid content' };
    }
  }

  // Validate userId
  if (!userId || typeof userId !== 'string') {
    return { valid: false, error: 'User ID is required' };
  }

  // Sanitize messages
  const sanitizedMessages = messages.map(msg => ({
    ...msg,
    content: sanitizeContent(msg.content)
  }));

  return {
    valid: true,
    sanitized: {
      messages: sanitizedMessages,
      userId,
      appData: appData || {}
    }
  };
}

function containsSuspiciousContent(content: string): boolean {
  const suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi
  ];

  return suspiciousPatterns.some(pattern => pattern.test(content));
}

function sanitizeContent(content: string): string {
  return content
    .replace(/[<>'"&]/g, (char) => {
      const map: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return map[char] || char;
    })
    .trim();
}

export function logSecurityEvent(event: {
  type: string;
  userId?: string;
  details: string;
  severity: 'low' | 'medium' | 'high';
}) {
  console.warn('Security Event:', {
    ...event,
    timestamp: new Date().toISOString()
  });
}
