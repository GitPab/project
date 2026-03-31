// CSV Input Sanitization and Validation
// Prevents injection attacks and validates data integrity

// Dangerous patterns that could indicate injection attempts
const DANGEROUS_PATTERNS = [
  // SQL injection patterns
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/i,
  /(--|;|\/\*|\*\/)/,
  // Command injection
  /[;&|`$(){}[\]\\]/,
  // HTML/JS injection
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  // Path traversal
  /\.\.[\/\\]/,
  // Null bytes
  /\x00/,
];

// Maximum field lengths to prevent DoS
const MAX_FIELD_LENGTHS: Record<string, number> = {
  name: 200,
  name_korean: 200,
  country: 100,
  address: 500,
  area: 100,
  notes: 2000,
  email: 255,
  phone: 50,
};

// Allowed characters for different field types
const FIELD_PATTERNS: Record<string, RegExp> = {
  name: /^[\p{L}\p{N}\s\-'()]+$/u,
  name_korean: /^[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\s\-'()]+$/u,
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^[\d\s\-+()]+$/,
  ranking: /^\d+$/,
  fee: /^[\d,\.\s]+$/,
  url: /^https?:\/\/.+/,
};

export interface SanitizationResult {
  isValid: boolean;
  sanitizedValue: string;
  errors: string[];
  warnings: string[];
}

/**
 * Sanitize a single CSV field value
 */
export function sanitizeField(
  value: string,
  fieldName: string,
  fieldType: string = 'text'
): SanitizationResult {
  const result: SanitizationResult = {
    isValid: true,
    sanitizedValue: value,
    errors: [],
    warnings: [],
  };

  // Handle null/undefined
  if (value == null) {
    result.sanitizedValue = '';
    return result;
  }

  // Convert to string
  let sanitized = String(value).trim();

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(sanitized)) {
      result.errors.push(`Field "${fieldName}" contains potentially dangerous characters`);
      result.isValid = false;
      // Remove dangerous characters
      sanitized = sanitized.replace(pattern, '');
    }
  }

  // Check field length
  const maxLength = MAX_FIELD_LENGTHS[fieldName] || 1000;
  if (sanitized.length > maxLength) {
    result.warnings.push(`Field "${fieldName}" truncated to ${maxLength} characters`);
    sanitized = sanitized.substring(0, maxLength);
  }

  // Validate against field pattern
  const pattern = FIELD_PATTERNS[fieldType] || FIELD_PATTERNS[fieldName];
  if (pattern && sanitized && !pattern.test(sanitized)) {
    // For non-critical fields, just warn
    if (fieldType === 'text' || fieldType === 'notes') {
      result.warnings.push(`Field "${fieldName}" contains unusual characters`);
    } else {
      result.errors.push(`Field "${fieldName}" has invalid format`);
      result.isValid = false;
    }
  }

  // Additional sanitization
  sanitized = sanitized
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' '); // Normalize whitespace

  result.sanitizedValue = sanitized;
  return result;
}

/**
 * Validate and sanitize a complete CSV row
 */
export function sanitizeCSVRow(
  row: Record<string, string>,
  fieldMappings: Record<string, { type?: string; required?: boolean }>
): { isValid: boolean; sanitizedRow: Record<string, string>; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const sanitizedRow: Record<string, string> = {};

  for (const [fieldName, config] of Object.entries(fieldMappings)) {
    const value = row[fieldName] || '';
    const result = sanitizeField(value, fieldName, config.type || 'text');

    sanitizedRow[fieldName] = result.sanitizedValue;
    errors.push(...result.errors);
    warnings.push(...result.warnings);

    // Check required fields
    if (config.required && !result.sanitizedValue) {
      errors.push(`Required field "${fieldName}" is empty`);
    }
  }

  return {
    isValid: errors.length === 0,
    sanitizedRow,
    errors,
    warnings,
  };
}

/**
 * Detect CSV injection attempts in the entire file
 */
export function detectInjectionAttempts(csvData: string[][]): string[] {
  const issues: string[] = [];
  const suspiciousPatterns = [
    /^[=+\-@]/, // Formula injection (Excel)
    /\|\s*cmd\s*\|/i, // Command piping
    /powershell|cmd\.exe/i, // Windows commands
    /bash|sh\s+-c/i, // Unix commands
  ];

  for (let rowIndex = 0; rowIndex < csvData.length; rowIndex++) {
    const row = csvData[rowIndex];
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const cell = String(row[colIndex] || '');
      
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(cell)) {
          issues.push(`Row ${rowIndex + 1}, Column ${colIndex + 1}: Potential formula/command injection detected`);
        }
      }

      // Check for very long strings (possible buffer overflow attempt)
      if (cell.length > 10000) {
        issues.push(`Row ${rowIndex + 1}, Column ${colIndex + 1}: Excessively long value (${cell.length} chars)`);
      }
    }
  }

  return issues;
}

/**
 * Preprocess CSV content to neutralize formula injection
 */
export function neutralizeFormulaInjection(value: string): string {
  if (!value) return value;
  
  // Prefix dangerous starting characters with apostrophe to neutralize formulas
  const dangerousStarts = ['=', '+', '-', '@'];
  const str = String(value);
  
  if (dangerousStarts.some(char => str.startsWith(char))) {
    return `"${str}"`; // Quote the value
  }
  
  return value;
}

/**
 * Main validation function for CSV import
 */
export function validateCSVImport(
  csvData: string[][],
  options: {
    maxRows?: number;
    maxFileSize?: number;
    requiredHeaders?: string[];
  } = {}
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file size (approximate)
  const fileSize = JSON.stringify(csvData).length;
  if (options.maxFileSize && fileSize > options.maxFileSize) {
    errors.push(`File size exceeds maximum of ${options.maxFileSize} bytes`);
  }

  // Check row count
  const maxRows = options.maxRows || 10000;
  if (csvData.length > maxRows) {
    errors.push(`File exceeds maximum of ${maxRows} rows`);
  }

  // Check for empty file
  if (csvData.length === 0 || csvData[0].length === 0) {
    errors.push('CSV file is empty');
  }

  // Check required headers
  if (options.requiredHeaders && csvData.length > 0) {
    const headers = csvData[0].map(h => h.toLowerCase().trim());
    for (const required of options.requiredHeaders) {
      if (!headers.includes(required.toLowerCase())) {
        errors.push(`Missing required column: ${required}`);
      }
    }
  }

  // Detect injection attempts
  const injectionIssues = detectInjectionAttempts(csvData);
  if (injectionIssues.length > 0) {
    warnings.push(...injectionIssues);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
