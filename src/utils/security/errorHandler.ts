interface SecurityEvent {
  type: 'rate_limit' | 'invalid_input' | 'auth_failure' | 'suspicious_activity';
  userId?: string;
  userAgent?: string;
  ip?: string;
  details: string;
  timestamp: number;
}

export class SecurityLogger {
  private static events: SecurityEvent[] = [];
  private static readonly MAX_EVENTS = 1000;

  static logEvent(event: Omit<SecurityEvent, 'timestamp'>) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: Date.now()
    };

    this.events.push(securityEvent);
    
    // Keep only the last MAX_EVENTS
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Security Event:', securityEvent);
    }
  }

  static getRecentEvents(limit = 50): SecurityEvent[] {
    return this.events.slice(-limit);
  }

  static clearEvents() {
    this.events = [];
  }
}

export class SecureErrorHandler {
  static handleError(error: any, context: string): string {
    // Log the full error for debugging
    console.error(`Error in ${context}:`, error);
    
    // Log security event if it's a security-related error
    if (this.isSecurityError(error)) {
      SecurityLogger.logEvent({
        type: 'suspicious_activity',
        details: `Security error in ${context}: ${error.message}`,
      });
    }

    // Return generic error message to user
    return this.getGenericErrorMessage(error, context);
  }

  private static isSecurityError(error: any): boolean {
    const securityKeywords = [
      'unauthorized',
      'forbidden',
      'invalid token',
      'rate limit',
      'suspicious',
      'injection'
    ];

    const errorMessage = error.message?.toLowerCase() || '';
    return securityKeywords.some(keyword => errorMessage.includes(keyword));
  }

  private static getGenericErrorMessage(error: any, context: string): string {
    // Map specific contexts to user-friendly messages
    const contextMessages: Record<string, string> = {
      'chat': 'Unable to process your message. Please try again.',
      'auth': 'Authentication failed. Please check your credentials.',
      'time_entry': 'Unable to save time entry. Please try again.',
      'project': 'Unable to access project data. Please try again.',
      'client': 'Unable to access client data. Please try again.'
    };

    return contextMessages[context] || 'An unexpected error occurred. Please try again.';
  }
}
