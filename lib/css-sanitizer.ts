/**
 * CSS Sanitizer - Security utility for sanitizing CSS before application
 * 
 * This module provides functions to safely sanitize CSS, preventing:
 * - CSS injection attacks
 * - JavaScript execution via CSS
 * - Malicious URL injections
 * - Dangerous CSS functions
 */

/**
 * Whitelist of allowed CSS custom property names
 * Only CSS variables (--*) that are used in the theme system are allowed
 */
const ALLOWED_CSS_PROPERTIES = new Set([
  '--primary-color',
  '--secondary-color',
  '--background-color',
  '--surface-color',
  '--text-primary',
  '--text-secondary',
  '--border-color',
  '--header-bg',
  '--header-text',
  '--calendar-bg',
  '--event-default-color',
  '--gradient-start',
  '--gradient-end',
  '--text-size-base',
  '--text-size-sm',
  '--text-size-lg',
  '--text-size-xl',
  '--text-size-2xl',
  '--text-size-3xl',
  '--text-weight-normal',
  '--text-weight-medium',
  '--text-weight-semibold',
  '--text-weight-bold',
  '--text-3d-color',
])

/**
 * Dangerous patterns that should be blocked in CSS
 */
const DANGEROUS_PATTERNS = [
  // JavaScript execution
  /expression\s*\(/gi,
  /javascript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /vbscript\s*:/gi,
  
  // URL-based attacks
  /@import\s+url\s*\(/gi,
  /@import\s+["']/gi,
  /url\s*\(\s*["']?\s*javascript\s*:/gi,
  /url\s*\(\s*["']?\s*data\s*:\s*text\/html/gi,
  
  // Function-based attacks
  /calc\s*\(\s*expression/gi,
  /var\s*\(\s*--[^)]*expression/gi,
  
  // Script injection attempts
  /<script/gi,
  /<\/script>/gi,
  /on\w+\s*=/gi, // Event handlers like onclick=
]

/**
 * Validates if a CSS property name is allowed
 */
export function isAllowedCSSProperty(propertyName: string): boolean {
  // Must start with -- (CSS custom property)
  if (!propertyName.startsWith('--')) {
    return false
  }
  
  // Check against whitelist
  return ALLOWED_CSS_PROPERTIES.has(propertyName.toLowerCase())
}

/**
 * Sanitizes a CSS value by removing dangerous patterns
 * Returns empty string if dangerous content is detected
 */
export function sanitizeCSSValue(value: string): string {
  if (!value || typeof value !== 'string') {
    return ''
  }
  
  let sanitized = value.trim()
  
  // Check for dangerous patterns first - if found, return empty string (block entirely)
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(sanitized)) {
      console.warn('[CSS Sanitizer] Blocked dangerous CSS pattern:', pattern.toString())
      return '' // Block entirely if dangerous pattern found
    }
  }
  
  // Block @import statements
  if (/@import/gi.test(sanitized)) {
    console.warn('[CSS Sanitizer] Blocked @import statement')
    return ''
  }
  
  // Block expression() function (case-insensitive)
  if (/expression\s*\(/gi.test(sanitized)) {
    console.warn('[CSS Sanitizer] Blocked expression() function')
    return ''
  }
  
  // Block javascript: URLs (case-insensitive)
  if (/javascript\s*:/gi.test(sanitized)) {
    console.warn('[CSS Sanitizer] Blocked javascript: URL')
    return ''
  }
  
  // Block data: URLs with HTML content
  if (/data\s*:\s*text\/html/gi.test(sanitized)) {
    console.warn('[CSS Sanitizer] Blocked data:text/html URL')
    return ''
  }
  
  // Validate URL values - only allow http, https, or relative paths
  const urlMatch = sanitized.match(/url\s*\(\s*["']?([^"')]+)["']?\s*\)/gi)
  if (urlMatch) {
    for (const url of urlMatch) {
      const urlContent = url.replace(/url\s*\(\s*["']?|["']?\s*\)/gi, '')
      // Block javascript:, data:, and other dangerous protocols
      if (/^(javascript|data|vbscript|file):/gi.test(urlContent.trim())) {
        console.warn('[CSS Sanitizer] Blocked dangerous URL protocol:', urlContent)
        return ''
      }
    }
  }
  
  return sanitized.trim()
}

/**
 * Validates CSS variable format
 * CSS variables must match: --property-name: value;
 */
export function validateCSSVariable(cssVar: string): { valid: boolean; property?: string; value?: string; error?: string } {
  // Match CSS variable pattern: --property-name: value;
  const match = cssVar.match(/^\s*--([\w-]+)\s*:\s*(.+?)\s*;?\s*$/)
  
  if (!match) {
    return { valid: false, error: 'Invalid CSS variable format' }
  }
  
  const propertyName = `--${match[1]}`
  const value = match[2].trim()
  
  // Check if property is allowed
  if (!isAllowedCSSProperty(propertyName)) {
    return { valid: false, error: `Property ${propertyName} is not in whitelist` }
  }
  
  // Sanitize the value
  const sanitizedValue = sanitizeCSSValue(value)
  
  if (!sanitizedValue) {
    return { valid: false, error: 'CSS value contains dangerous content and was removed' }
  }
  
  return { valid: true, property: propertyName, value: sanitizedValue }
}

/**
 * Sanitizes a full CSS string containing CSS variables
 * Extracts and validates only CSS custom properties
 */
export function sanitizeCSS(css: string): string {
  if (!css || typeof css !== 'string') {
    return ''
  }
  
  // Extract CSS variables from the CSS string
  // Pattern: --property-name: value;
  const cssVarPattern = /--[\w-]+\s*:\s*[^;]+;?/g
  const matches = css.match(cssVarPattern) || []
  
  const sanitizedVars: string[] = []
  
  for (const match of matches) {
    const validation = validateCSSVariable(match)
    if (validation.valid && validation.property && validation.value) {
      sanitizedVars.push(`${validation.property}: ${validation.value};`)
    }
  }
  
  // Return sanitized CSS variables
  return sanitizedVars.join('\n')
}

/**
 * Sanitizes CSS for direct application via style.setProperty()
 * This is the main function to use when applying CSS variables
 */
export function sanitizeCSSForApplication(css: string): Array<{ property: string; value: string }> {
  if (!css || typeof css !== 'string') {
    return []
  }
  
  // Extract CSS variables
  const cssVarPattern = /--[\w-]+\s*:\s*[^;]+;?/g
  const matches = css.match(cssVarPattern) || []
  
  const sanitized: Array<{ property: string; value: string }> = []
  
  for (const match of matches) {
    const validation = validateCSSVariable(match)
    if (validation.valid && validation.property && validation.value) {
      sanitized.push({
        property: validation.property,
        value: validation.value
      })
    }
  }
  
  return sanitized
}

/**
 * Sanitizes a single CSS property-value pair
 * Use this when you have a specific property and value to sanitize
 */
export function sanitizeCSSProperty(propertyName: string, value: string): { valid: boolean; property?: string; value?: string; error?: string } {
  // Ensure property starts with --
  const fullPropertyName = propertyName.startsWith('--') ? propertyName : `--${propertyName}`
  
  // Validate property
  if (!isAllowedCSSProperty(fullPropertyName)) {
    return { valid: false, error: `Property ${fullPropertyName} is not in whitelist` }
  }
  
  // Sanitize value
  const sanitizedValue = sanitizeCSSValue(value)
  
  if (!sanitizedValue) {
    return { valid: false, error: 'CSS value contains dangerous content' }
  }
  
  return { valid: true, property: fullPropertyName, value: sanitizedValue }
}

/**
 * Test function to verify sanitizer works correctly
 * Returns true if all tests pass
 * 
 * Note: This is a simple test function. For comprehensive testing,
 * use the test suite in __tests__/security/css-sanitizer.test.ts
 */
export function testSanitizer(): boolean {
  const testCases = [
    // Safe CSS - should pass
    { input: '--primary-color: #3b82f6;', shouldPass: true },
    { input: '--background-color: #ffffff;', shouldPass: true },
    { input: '--text-primary: rgba(0, 0, 0, 0.8);', shouldPass: true },
    
    // Dangerous CSS - should be blocked
    { input: '--primary-color: expression(alert("XSS"));', shouldPass: false },
    { input: '--background-color: url("javascript:alert(1)");', shouldPass: false },
    { input: '--background-color: url("data:text/html,<script>alert(1)</script>");', shouldPass: false },
    { input: '--background-color: @import url("evil.com");', shouldPass: false },
    
    // Invalid properties - should be blocked
    { input: '--unknown-property: #000;', shouldPass: false },
    { input: 'color: red;', shouldPass: false }, // Not a CSS variable
  ]
  
  let allPassed = true
  const failures: string[] = []
  
  for (const testCase of testCases) {
    const validation = validateCSSVariable(testCase.input)
    const passed = testCase.shouldPass === validation.valid
    
    if (!passed) {
      const message = `Test failed: "${testCase.input}" - Expected ${testCase.shouldPass ? 'valid' : 'invalid'}, got ${validation.valid ? 'valid' : 'invalid'}`
      failures.push(message)
      console.error(message)
      allPassed = false
    }
  }
  
  if (allPassed) {
    console.log('✅ All CSS sanitizer tests passed!')
  } else {
    console.error(`❌ ${failures.length} test(s) failed:`)
    failures.forEach(f => console.error(`  - ${f}`))
  }
  
  return allPassed
}

