/**
 * Form validation utilities for SACMA
 * Provides reusable validation functions for costs, text, images, and phone numbers
 */

/**
 * Validate numeric cost inputs
 * Checks for: valid number, non-negative, whole numbers only
 */
export const validateCost = (value: number | string): string[] => {
  const errors: string[] = [];

  if (value === '' || value === null || value === undefined) {
    return errors; // Allow empty for optional fields
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    errors.push('Phải là số hợp lệ');
  } else {
    if (num < 0) {
      errors.push('Không thể là số âm');
    }
    // Check if it's a whole number (no decimals)
    if (!Number.isInteger(num) && num !== 0) {
      errors.push('Phải là số nguyên (không có phần thập phân)');
    }
  }

  return errors;
};

/**
 * Validate word count in text
 * Checks if text meets min/max word requirements
 */
export const validateWordCount = (
  text: string,
  min: number = 100,
  max: number = 250
): { isValid: boolean; count: number; errors: string[] } => {
  const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
  const count = words.length;
  const errors: string[] = [];

  if (count < min) {
    errors.push(`Mô tả phải có ít nhất ${min} từ (hiện tại: ${count} từ)`);
  }
  if (count > max) {
    errors.push(`Mô tả không được vượt quá ${max} từ (hiện tại: ${count} từ)`);
  }

  return {
    isValid: errors.length === 0,
    count,
    errors,
  };
};

/**
 * Validate image file
 * Checks: file type, file size, basic image validation
 */
export const validateImage = (file: File): string[] => {
  const errors: string[] = [];
  const maxSize = 5 * 1024 * 1024; // 5MB
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (!validTypes.includes(file.type)) {
    errors.push('Định dạng hình ảnh không được hỗ trợ. Chỉ hỗ trợ: JPEG, PNG, GIF, WebP');
  }

  if (file.size > maxSize) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    errors.push(`Kích thước hình ảnh không được vượt quá 5MB (hiện tại: ${sizeMB}MB)`);
  }

  if (file.size < 1024) {
    // Less than 1KB seems suspicious
    errors.push('Hình ảnh quá nhỏ hoặc không hợp lệ');
  }

  return errors;
};

/**
 * Validate Vietnamese phone number
 * Supports: +84, 0, or 84 prefix patterns
 */
export const validatePhoneNumber = (phone: string): string[] => {
  const errors: string[] = [];

  if (!phone || phone.trim().length === 0) {
    return errors; // Allow empty for optional fields
  }

  const trimmed = phone.trim();

  // Vietnamese phone patterns:
  // +84 9xx xxx xxxx, +84 8xx xxx xxxx
  // 09xx xxx xxxx, 08xx xxx xxxx
  // 84 9xx xxx xxxx, 84 8xx xxx xxxx
  const vietnamPhoneRegex = /^(?:\+84|0|84)(?:9|8)\d{8}$/;

  if (!vietnamPhoneRegex.test(trimmed.replace(/\s/g, ''))) {
    errors.push(
      'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (ví dụ: 0912345678 hoặc +84912345678)'
    );
  }

  return errors;
};

/**
 * Validate email address
 * Basic RFC 5322 compliant email validation
 */
export const validateEmail = (email: string): string[] => {
  const errors: string[] = [];

  if (!email || email.trim().length === 0) {
    return errors; // Allow empty for optional fields
  }

  // Basic email regex (not exhaustive, but good for most cases)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email.trim())) {
    errors.push('Địa chỉ email không hợp lệ');
  }

  return errors;
};

/**
 * Validate university name
 * Checks: not empty, min length
 */
export const validateUniversityName = (name: string): string[] => {
  const errors: string[] = [];
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    errors.push('Tên trường đại học không được để trống');
  } else if (trimmed.length < 3) {
    errors.push('Tên trường đại học phải có ít nhất 3 ký tự');
  } else if (trimmed.length > 100) {
    errors.push('Tên trường đại học không được vượt quá 100 ký tự');
  }

  return errors;
};

/**
 * Validate country name
 * Checks: not empty, basic format
 */
export const validateCountry = (country: string): string[] => {
  const errors: string[] = [];
  const trimmed = country.trim();

  if (trimmed.length === 0) {
    errors.push('Quốc gia không được để trống');
  } else if (trimmed.length < 2) {
    errors.push('Tên quốc gia không hợp lệ');
  } else if (trimmed.length > 50) {
    errors.push('Tên quốc gia không được vượt quá 50 ký tự');
  }

  return errors;
};

/**
 * Format validation error message for display
 * Takes array of errors and formats for UI
 */
export const formatValidationErrors = (errors: string[]): string => {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0];
  return errors.join(' • ');
};

/**
 * Combine multiple validation results
 * Merges errors from multiple validation functions
 */
export const combineValidationErrors = (
  ...errorArrays: (string[] | undefined)[]
): string[] => {
  return errorArrays
    .filter((arr): arr is string[] => arr !== undefined && arr.length > 0)
    .flat();
};

/**
 * Create field-level validation result
 * Standardized format for form field validation
 */
export interface FieldValidationResult {
  isValid: boolean;
  errors: string[];
  message: string; // Formatted error message for display
}

export const createFieldValidationResult = (errors: string[]): FieldValidationResult => {
  return {
    isValid: errors.length === 0,
    errors,
    message: formatValidationErrors(errors),
  };
};
