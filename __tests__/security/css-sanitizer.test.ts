/**
 * Security Tests for CSS Sanitizer
 * 
 * Tests that the CSS sanitizer properly blocks malicious CSS
 * and allows safe CSS through.
 */

import { 
  sanitizeCSS, 
  sanitizeCSSValue, 
  validateCSSVariable, 
  isAllowedCSSProperty,
  sanitizeCSSForApplication,
  sanitizeCSSProperty
} from '@/lib/css-sanitizer'

describe('CSS Sanitizer Security Tests', () => {
  
  describe('isAllowedCSSProperty', () => {
    it('should allow whitelisted CSS properties', () => {
      expect(isAllowedCSSProperty('--primary-color')).toBe(true)
      expect(isAllowedCSSProperty('--background-color')).toBe(true)
      expect(isAllowedCSSProperty('--text-primary')).toBe(true)
    })
    
    it('should reject non-whitelisted properties', () => {
      expect(isAllowedCSSProperty('--unknown-property')).toBe(false)
      expect(isAllowedCSSProperty('color')).toBe(false)
      expect(isAllowedCSSProperty('background')).toBe(false)
    })
    
    it('should handle case-insensitive property names', () => {
      expect(isAllowedCSSProperty('--PRIMARY-COLOR')).toBe(true)
      expect(isAllowedCSSProperty('--Primary-Color')).toBe(true)
    })
  })
  
  describe('sanitizeCSSValue', () => {
    it('should allow safe CSS values', () => {
      expect(sanitizeCSSValue('#3b82f6')).toBe('#3b82f6')
      expect(sanitizeCSSValue('rgba(0, 0, 0, 0.8)')).toBe('rgba(0, 0, 0, 0.8)')
      expect(sanitizeCSSValue('#ffffff')).toBe('#ffffff')
      expect(sanitizeCSSValue('16px')).toBe('16px')
    })
    
    it('should block expression() function', () => {
      expect(sanitizeCSSValue('expression(alert("XSS"))')).toBe('')
      expect(sanitizeCSSValue('expression(alert(1))')).toBe('')
      expect(sanitizeCSSValue('EXPRESSION(alert(1))')).toBe('') // Case insensitive
    })
    
    it('should block javascript: URLs', () => {
      expect(sanitizeCSSValue('url("javascript:alert(1)")')).toBe('')
      expect(sanitizeCSSValue('javascript:alert(1)')).toBe('')
      expect(sanitizeCSSValue('JAVASCRIPT:alert(1)')).toBe('') // Case insensitive
    })
    
    it('should block data: URLs with HTML', () => {
      expect(sanitizeCSSValue('url("data:text/html,<script>alert(1)</script>")')).toBe('')
      expect(sanitizeCSSValue('data:text/html,<script>alert(1)</script>')).toBe('')
    })
    
    it('should block @import statements', () => {
      expect(sanitizeCSSValue('@import url("evil.com/style.css")')).toBe('')
      expect(sanitizeCSSValue('@import "evil.com/style.css"')).toBe('')
    })
    
    it('should block vbscript: URLs', () => {
      expect(sanitizeCSSValue('vbscript:alert(1)')).toBe('')
    })
    
    it('should allow safe url() values', () => {
      expect(sanitizeCSSValue('url("/images/background.jpg")')).toBe('url("/images/background.jpg")')
      expect(sanitizeCSSValue('url("https://example.com/image.png")')).toBe('url("https://example.com/image.png")')
    })
  })
  
  describe('validateCSSVariable', () => {
    it('should validate safe CSS variables', () => {
      const result = validateCSSVariable('--primary-color: #3b82f6;')
      expect(result.valid).toBe(true)
      expect(result.property).toBe('--primary-color')
      expect(result.value).toBe('#3b82f6')
    })
    
    it('should reject dangerous CSS variables', () => {
      const result1 = validateCSSVariable('--primary-color: expression(alert("XSS"));')
      expect(result1.valid).toBe(false)
      expect(result1.error).toBeDefined()
      
      const result2 = validateCSSVariable('--background: url("javascript:alert(1)");')
      expect(result2.valid).toBe(false)
    })
    
    it('should reject non-whitelisted properties', () => {
      const result = validateCSSVariable('--unknown-property: #000;')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('not in whitelist')
    })
    
    it('should handle CSS without semicolon', () => {
      const result = validateCSSVariable('--primary-color: #3b82f6')
      expect(result.valid).toBe(true)
    })
  })
  
  describe('sanitizeCSS', () => {
    it('should sanitize safe CSS', () => {
      const css = `
        :root {
          --primary-color: #3b82f6;
          --background-color: #ffffff;
          --text-primary: #111827;
        }
      `
      const sanitized = sanitizeCSS(css)
      expect(sanitized).toContain('--primary-color: #3b82f6')
      expect(sanitized).toContain('--background-color: #ffffff')
      expect(sanitized).toContain('--text-primary: #111827')
    })
    
    it('should remove dangerous CSS', () => {
      const css = `
        :root {
          --primary-color: expression(alert("XSS"));
          --background: url("javascript:alert(1)");
          --text-primary: #111827;
        }
      `
      const sanitized = sanitizeCSS(css)
      expect(sanitized).not.toContain('expression')
      expect(sanitized).not.toContain('javascript')
      expect(sanitized).toContain('--text-primary: #111827') // Safe one should remain
    })
    
    it('should remove non-whitelisted properties', () => {
      const css = `
        :root {
          --primary-color: #3b82f6;
          --unknown-property: #000;
        }
      `
      const sanitized = sanitizeCSS(css)
      expect(sanitized).toContain('--primary-color')
      expect(sanitized).not.toContain('--unknown-property')
    })
  })
  
  describe('sanitizeCSSForApplication', () => {
    it('should return array of sanitized properties', () => {
      const css = `
        :root {
          --primary-color: #3b82f6;
          --background-color: #ffffff;
        }
      `
      const result = sanitizeCSSForApplication(css)
      expect(result).toHaveLength(2)
      expect(result[0].property).toBe('--primary-color')
      expect(result[0].value).toBe('#3b82f6')
    })
    
    it('should filter out dangerous CSS', () => {
      const css = `
        :root {
          --primary-color: expression(alert("XSS"));
          --background-color: #ffffff;
        }
      `
      const result = sanitizeCSSForApplication(css)
      expect(result).toHaveLength(1) // Only safe one
      expect(result[0].property).toBe('--background-color')
    })
  })
  
  describe('sanitizeCSSProperty', () => {
    it('should sanitize safe property-value pairs', () => {
      const result = sanitizeCSSProperty('primary-color', '#3b82f6')
      expect(result.valid).toBe(true)
      expect(result.property).toBe('--primary-color')
      expect(result.value).toBe('#3b82f6')
    })
    
    it('should reject dangerous values', () => {
      const result = sanitizeCSSProperty('primary-color', 'expression(alert(1))')
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })
    
    it('should reject non-whitelisted properties', () => {
      const result = sanitizeCSSProperty('unknown-property', '#000')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('not in whitelist')
    })
  })
  
  describe('Real-world attack scenarios', () => {
    it('should block XSS via expression()', () => {
      const malicious = '--primary-color: expression(alert(document.cookie));'
      const result = validateCSSVariable(malicious)
      expect(result.valid).toBe(false)
    })
    
    it('should block XSS via javascript: URL', () => {
      const malicious = '--background: url("javascript:alert(document.cookie)");'
      const result = validateCSSVariable(malicious)
      expect(result.valid).toBe(false)
    })
    
    it('should block XSS via data: URL', () => {
      const malicious = '--background: url("data:text/html,<script>alert(1)</script>");'
      const result = validateCSSVariable(malicious)
      expect(result.valid).toBe(false)
    })
    
    it('should block @import injection', () => {
      const malicious = '--background: @import url("evil.com/steal.css");'
      const result = validateCSSVariable(malicious)
      expect(result.valid).toBe(false)
    })
    
    it('should allow legitimate CSS values', () => {
      const safe = [
        '--primary-color: #3b82f6;',
        '--background-color: rgba(255, 255, 255, 0.9);',
        '--text-primary: #111827;',
        '--border-color: #e5e7eb;',
      ]
      
      for (const css of safe) {
        const result = validateCSSVariable(css)
        expect(result.valid).toBe(true)
      }
    })
  })
})

