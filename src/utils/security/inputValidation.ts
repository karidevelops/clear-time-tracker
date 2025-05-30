
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

export class InputValidator {
  private static readonly MAX_MESSAGE_LENGTH = 2000;
  private static readonly MAX_DESCRIPTION_LENGTH = 500;
  private static readonly ALLOWED_HTML_TAGS = ['br', 'p', 'strong', 'em'];

  static validateChatMessage(message: string): ValidationResult {
    if (!message || typeof message !== 'string') {
      return { isValid: false, error: 'Message is required' };
    }

    const trimmed = message.trim();
    if (trimmed.length === 0) {
      return { isValid: false, error: 'Message cannot be empty' };
    }

    if (trimmed.length > this.MAX_MESSAGE_LENGTH) {
      return { isValid: false, error: `Message too long (max ${this.MAX_MESSAGE_LENGTH} characters)` };
    }

    // Check for potential injection attempts
    if (this.containsSuspiciousContent(trimmed)) {
      return { isValid: false, error: 'Message contains invalid content' };
    }

    return { isValid: true, sanitized: this.sanitizeInput(trimmed) };
  }

  static validateTimeEntryDescription(description: string): ValidationResult {
    if (!description) {
      return { isValid: true, sanitized: '' };
    }

    if (typeof description !== 'string') {
      return { isValid: false, error: 'Description must be text' };
    }

    const trimmed = description.trim();
    if (trimmed.length > this.MAX_DESCRIPTION_LENGTH) {
      return { isValid: false, error: `Description too long (max ${this.MAX_DESCRIPTION_LENGTH} characters)` };
    }

    return { isValid: true, sanitized: this.sanitizeInput(trimmed) };
  }

  private static containsSuspiciousContent(input: string): boolean {
    const suspiciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:text\/html/gi,
      /vbscript:/gi
    ];

    return suspiciousPatterns.some(pattern => pattern.test(input));
  }

  private static sanitizeInput(input: string): string {
    return input
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
}
