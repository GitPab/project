// CSV Input Sanitization and Validation
// Prevents injection attacks and validates data integrity

// Dangerous patterns that could indicate injection attempts
const DANGEROUS_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/i,
  /(--|;|\/\*|\*\/)/,
  /[;&|`$(){}[\]\\]/,
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /\.\.[/\\]/,
  /\x00/, // eslint-disable-line no-control-regex
];

// Maximum field lengths to prevent DoS
const MAX_FIELD_LENGTHS = {
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
const FIELD_PATTERNS = {
  name: /^[\p{L}\p{N}\s\-'()]+$/u,
  name_korean: /^[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\s\-'()]+$/u,
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^[\d\s\-+()]+$/,
  ranking: /^\d+$/,
  fee: /^[\d,.\s]+$/,
  url: /^https?:\/\/.+/,
};

export function sanitizeField(value, fieldName, fieldType = 'text') {
  const result = {
    isValid: true,
    sanitizedValue: value,
    errors: [],
    warnings: [],
  };

  if (value == null) {
    result.sanitizedValue = '';
    return result;
  }

  let sanitized = String(value).trim();

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(sanitized)) {
      result.errors.push(`Field "${fieldName}" contains potentially dangerous characters`);
      result.isValid = false;
      sanitized = sanitized.replace(pattern, '');
    }
  }

  const maxLength = MAX_FIELD_LENGTHS[fieldName] || 1000;
  if (sanitized.length > maxLength) {
    result.warnings.push(`Field "${fieldName}" truncated to ${maxLength} characters`);
    sanitized = sanitized.substring(0, maxLength);
  }

  const pattern = FIELD_PATTERNS[fieldType] || FIELD_PATTERNS[fieldName];
  if (pattern && sanitized && !pattern.test(sanitized)) {
    if (fieldType === 'text' || fieldType === 'notes') {
      result.warnings.push(`Field "${fieldName}" contains unusual characters`);
    } else {
      result.errors.push(`Field "${fieldName}" has invalid format`);
      result.isValid = false;
    }
  }

  sanitized = sanitized
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ');

  result.sanitizedValue = sanitized;
  return result;
}

export function sanitizeCSVRow(row, fieldMappings) {
  const errors = [];
  const warnings = [];
  const sanitizedRow = {};

  for (const [fieldName, config] of Object.entries(fieldMappings)) {
    const value = row[fieldName] || '';
    const result = sanitizeField(value, fieldName, config.type || 'text');

    sanitizedRow[fieldName] = result.sanitizedValue;
    errors.push(...result.errors);
    warnings.push(...result.warnings);

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

export function detectInjectionAttempts(csvData) {
  const issues = [];
  const suspiciousPatterns = [
    /^[=+\-@]/,
    /\|\s*cmd\s*\|/i,
    /powershell|cmd\.exe/i,
    /bash|sh\s+-c/i,
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

      if (cell.length > 10000) {
        issues.push(`Row ${rowIndex + 1}, Column ${colIndex + 1}: Excessively long value (${cell.length} chars)`);
      }
    }
  }

  return issues;
}

export function neutralizeFormulaInjection(value) {
  if (!value) return value;
  
  const dangerousStarts = ['=', '+', '-', '@'];
  const str = String(value);
  
  if (dangerousStarts.some(char => str.startsWith(char))) {
    return `"${str}"`;
  }
  
  return value;
}

export function validateCSVImport(csvData, options = {}) {
  const errors = [];
  const warnings = [];

  const fileSize = JSON.stringify(csvData).length;
  if (options.maxFileSize && fileSize > options.maxFileSize) {
    errors.push(`File size exceeds maximum of ${options.maxFileSize} bytes`);
  }

  const maxRows = options.maxRows || 10000;
  if (csvData.length > maxRows) {
    errors.push(`File exceeds maximum of ${maxRows} rows`);
  }

  if (csvData.length === 0 || csvData[0].length === 0) {
    errors.push('CSV file is empty');
  }

  if (options.requiredHeaders && csvData.length > 0) {
    const headers = csvData[0].map(h => h.toLowerCase().trim());
    for (const required of options.requiredHeaders) {
      if (!headers.includes(required.toLowerCase())) {
        errors.push(`Missing required column: ${required}`);
      }
    }
  }

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
