/**
 * Input Validator
 * Validates user inputs to prevent security vulnerabilities and ensure data integrity
 */

export interface ValidationResult {
  valid: boolean
  error?: string
}

// Dangerous keywords that could be used in injection attacks
const DANGEROUS_KEYWORDS = [
  'javascript:',
  'onerror=',
  'onload=',
  'onclick=',
  'eval(',
  'exec(',
  'function(',
  '<script',
  '</script>',
  'expression(',
  'vbscript:',
  'data:text/html',
  '@import',
  'url(',
  'import(',
  'require(',
]

// Maximum lengths for inputs
const MAX_THEME_PROMPT_LENGTH = 2000
const MAX_COLOR_LENGTH = 50 // Increased to accommodate longer RGB/RGBA and CSS variable formats

/**
 * Validates a theme prompt string
 * Checks for:
 * - Maximum length
 * - Dangerous keywords that could be used for injection
 * - Basic sanity checks
 */
export function validateThemePrompt(prompt: string): ValidationResult {
  if (!prompt || typeof prompt !== 'string') {
    return {
      valid: false,
      error: 'Prompt must be a non-empty string'
    }
  }

  // Check length
  if (prompt.length > MAX_THEME_PROMPT_LENGTH) {
    return {
      valid: false,
      error: `Prompt must be ${MAX_THEME_PROMPT_LENGTH} characters or less`
    }
  }

  // Check for dangerous keywords (case-insensitive)
  const lowerPrompt = prompt.toLowerCase()
  for (const keyword of DANGEROUS_KEYWORDS) {
    if (lowerPrompt.includes(keyword.toLowerCase())) {
      return {
        valid: false,
        error: `Prompt contains potentially dangerous content: ${keyword}`
      }
    }
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<[^>]*script/gi,
    /javascript\s*:/gi,
    /on\w+\s*=/gi, // onerror=, onclick=, etc.
  ]

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(prompt)) {
      return {
        valid: false,
        error: 'Prompt contains potentially dangerous content'
      }
    }
  }

  return { valid: true }
}

/**
 * Validates a color string (hex format)
 * Accepts formats: #RRGGBB, #RGB, rgb(r,g,b), rgba(r,g,b,a)
 */
export function validateColor(color: string): ValidationResult {
  if (!color || typeof color !== 'string') {
    return {
      valid: false,
      error: 'Color must be a non-empty string'
    }
  }

  const trimmedColor = color.trim()

  // CSS variable validation (var(--variable-name))
  // Check CSS variables first as they can be longer than MAX_COLOR_LENGTH
  const cssVarPattern = /^var\(--[a-zA-Z0-9-]+\)$/
  if (cssVarPattern.test(trimmedColor)) {
    // CSS variables are safe - the pattern ensures it's a valid CSS variable format
    // We don't need to check for dangerous keywords here because the pattern
    // only allows alphanumeric characters and hyphens in the variable name
    return { valid: true }
  }

  // Check length (after CSS variable check, as CSS variables can be longer)
  if (color.length > MAX_COLOR_LENGTH) {
    return {
      valid: false,
      error: `Color must be ${MAX_COLOR_LENGTH} characters or less`
    }
  }

  // Hex color validation (#RRGGBB or #RGB)
  const hexPattern = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/
  if (hexPattern.test(trimmedColor)) {
    return { valid: true }
  }

  // RGB/RGBA validation (rgb(255, 255, 255) or rgba(255, 255, 255, 1))
  const rgbPattern = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/
  if (rgbPattern.test(trimmedColor)) {
    return { valid: true }
  }

  // Check for dangerous content
  const lowerColor = trimmedColor.toLowerCase()
  for (const keyword of DANGEROUS_KEYWORDS) {
    if (lowerColor.includes(keyword.toLowerCase())) {
      return {
        valid: false,
        error: `Color contains potentially dangerous content: ${keyword}`
      }
    }
  }

  return {
    valid: false,
    error: 'Color must be in hex format (#RRGGBB or #RGB), rgb(), rgba(), or var(--variable)'
  }
}

/**
 * Validates an image file
 * Checks for:
 * - File type (only images)
 * - File size (max 10MB)
 * - File name safety
 */
export function validateImageFile(file: File): ValidationResult {
  if (!file || !(file instanceof File)) {
    return {
      valid: false,
      error: 'File must be a valid File object'
    }
  }

  // Check file type
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ]

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    }
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB in bytes
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum of 10MB`
    }
  }

  // Check file name for dangerous characters
  const dangerousChars = /[<>:"|?*\x00-\x1f]/
  if (dangerousChars.test(file.name)) {
    return {
      valid: false,
      error: 'File name contains invalid characters'
    }
  }

  // Check file name length
  if (file.name.length > 255) {
    return {
      valid: false,
      error: 'File name is too long (max 255 characters)'
    }
  }

  return { valid: true }
}

/**
 * Validates an image URL
 * Checks for:
 * - Valid URL format
 * - Allowed protocols (http, https, data)
 * - No dangerous content
 */
export function validateImageUrl(url: string): ValidationResult {
  if (!url || typeof url !== 'string') {
    return {
      valid: false,
      error: 'URL must be a non-empty string'
    }
  }

  const trimmedUrl = url.trim()

  // Check for dangerous keywords
  const lowerUrl = trimmedUrl.toLowerCase()
  for (const keyword of DANGEROUS_KEYWORDS) {
    if (lowerUrl.includes(keyword.toLowerCase())) {
      return {
        valid: false,
        error: `URL contains potentially dangerous content: ${keyword}`
      }
    }
  }

  // Validate URL format
  try {
    const urlObj = new URL(trimmedUrl)
    
    // Only allow http, https, and data URLs
    const allowedProtocols = ['http:', 'https:', 'data:']
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return {
        valid: false,
        error: `Protocol ${urlObj.protocol} is not allowed. Only http, https, and data URLs are allowed`
      }
    }

    // For data URLs, validate the format
    if (urlObj.protocol === 'data:') {
      const dataUrlPattern = /^data:image\/(jpeg|jpg|png|gif|webp|svg\+xml);base64,/
      if (!dataUrlPattern.test(trimmedUrl)) {
        return {
          valid: false,
          error: 'Data URL must be a valid base64-encoded image'
        }
      }
    }

    return { valid: true }
  } catch (e) {
    // If URL parsing fails, check if it's a relative path (allowed for local images)
    if (trimmedUrl.startsWith('/') || trimmedUrl.startsWith('./') || trimmedUrl.startsWith('../')) {
      // Validate relative path doesn't contain dangerous patterns
      if (!/\.\./.test(trimmedUrl) || trimmedUrl.startsWith('../')) {
        // Allow relative paths but validate they don't go too far up
        const depth = (trimmedUrl.match(/\.\.\//g) || []).length
        if (depth > 3) {
          return {
            valid: false,
            error: 'Relative path goes too far up the directory tree'
          }
        }
        return { valid: true }
      }
    }

    return {
      valid: false,
      error: 'Invalid URL format'
    }
  }
}

/**
 * Sanitizes a string by removing dangerous characters
 * Useful for sanitizing user input before display
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  // Remove null bytes and control characters (except newlines and tabs)
  let sanitized = input.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, '')
  
  // Remove potentially dangerous HTML tags
  sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '')
  sanitized = sanitized.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
  sanitized = sanitized.replace(/on\w+\s*=/gi, '') // Remove event handlers
  
  return sanitized
}

/**
 * Validates a general text input
 * Checks for length and dangerous content
 */
export function validateTextInput(
  text: string,
  maxLength: number = 1000,
  fieldName: string = 'Text'
): ValidationResult {
  if (!text || typeof text !== 'string') {
    return {
      valid: false,
      error: `${fieldName} must be a non-empty string`
    }
  }

  if (text.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} must be ${maxLength} characters or less`
    }
  }

  // Check for dangerous keywords
  const lowerText = text.toLowerCase()
  for (const keyword of DANGEROUS_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      return {
        valid: false,
        error: `${fieldName} contains potentially dangerous content`
      }
    }
  }

  return { valid: true }
}

