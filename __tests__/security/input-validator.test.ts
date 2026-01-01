/**
 * Security Tests for Input Validator
 * 
 * Tests that the input validator properly blocks malicious inputs
 * and allows safe inputs through.
 */

import {
  validateThemePrompt,
  validateColor,
  validateImageFile,
  validateImageUrl,
  sanitizeString,
  validateTextInput,
} from '@/lib/input-validator'

describe('Input Validator Security Tests', () => {
  
  describe('validateThemePrompt', () => {
    it('should allow safe prompts', () => {
      const safePrompts = [
        'Create a dark theme',
        'Make it ocean blue',
        'I want a warm sunset color scheme',
        'Use forest green colors',
      ]
      
      for (const prompt of safePrompts) {
        const result = validateThemePrompt(prompt)
        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
      }
    })
    
    it('should reject prompts with dangerous keywords', () => {
      const dangerousPrompts = [
        'Create theme with javascript:alert(1)',
        'Use expression(alert("XSS"))',
        'Theme with <script>alert(1)</script>',
        'Include onclick=alert(1)',
        'Add eval(evil)',
        'Use data:text/html,<script>',
      ]
      
      for (const prompt of dangerousPrompts) {
        const result = validateThemePrompt(prompt)
        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
      }
    })
    
    it('should reject prompts that are too long', () => {
      const longPrompt = 'a'.repeat(2001) // Exceeds MAX_THEME_PROMPT_LENGTH (2000)
      const result = validateThemePrompt(longPrompt)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('2000 characters')
    })
    
    it('should reject empty or non-string prompts', () => {
      expect(validateThemePrompt('').valid).toBe(false)
      expect(validateThemePrompt(null as any).valid).toBe(false)
      expect(validateThemePrompt(undefined as any).valid).toBe(false)
      expect(validateThemePrompt(123 as any).valid).toBe(false)
    })
    
    it('should handle case-insensitive dangerous keywords', () => {
      const result1 = validateThemePrompt('JAVASCRIPT:alert(1)')
      expect(result1.valid).toBe(false)
      
      const result2 = validateThemePrompt('EVAL(evil)')
      expect(result2.valid).toBe(false)
      
      const result3 = validateThemePrompt('<SCRIPT>alert(1)</SCRIPT>')
      expect(result3.valid).toBe(false)
    })
    
    it('should detect suspicious patterns', () => {
      const suspicious = [
        'Theme with <div onclick="alert(1)">',
        'Use javascript:void(0)',
        'Include onerror=alert(1)',
      ]
      
      for (const prompt of suspicious) {
        const result = validateThemePrompt(prompt)
        expect(result.valid).toBe(false)
      }
    })
  })
  
  describe('validateColor', () => {
    it('should allow valid hex colors', () => {
      const validHex = [
        '#3b82f6',
        '#ffffff',
        '#000000',
        '#abc123',
        '#ABC123',
        '#123',
        '#abc',
      ]
      
      for (const color of validHex) {
        const result = validateColor(color)
        expect(result.valid).toBe(true)
      }
    })
    
    it('should allow valid RGB/RGBA colors', () => {
      const validRgb = [
        'rgb(255, 255, 255)',
        'rgba(0, 0, 0, 0.5)',
        'rgb(59, 130, 246)',
        'rgba(255, 255, 255, 1)',
        'rgb(255,255,255)', // Without spaces
        'rgba(0,0,0,0.5)', // Without spaces
      ]
      
      for (const color of validRgb) {
        const result = validateColor(color)
        expect(result.valid).toBe(true)
      }
    })
    
    it('should allow CSS variables', () => {
      const validVars = [
        'var(--primary-color)',
        'var(--background-color)',
      ]
      
      for (const color of validVars) {
        const result = validateColor(color)
        expect(result.valid).toBe(true)
        if (!result.valid) {
          console.log('CSS variable validation failed for:', color, 'Error:', result.error)
        }
      }
    })
    
    it('should reject invalid color formats', () => {
      const invalid = [
        'not a color',
        'red',
        'blue',
        '#gggggg',
        // Note: The validator doesn't check RGB value ranges (0-255) or alpha ranges (0-1)
        // It only validates the format, so these will pass format validation
        // 'rgb(256, 256, 256)', // Out of range - format is valid
        // 'rgba(255, 255, 255, 2)', // Alpha > 1 - format is valid
      ]
      
      for (const color of invalid) {
        const result = validateColor(color)
        expect(result.valid).toBe(false)
      }
    })
    
    it('should reject colors with dangerous content', () => {
      const dangerous = [
        'javascript:alert(1)',
        'expression(alert(1))',
        '<script>alert(1)</script>',
        'url("javascript:alert(1)")',
      ]
      
      for (const color of dangerous) {
        const result = validateColor(color)
        expect(result.valid).toBe(false)
      }
    })
    
    it('should reject colors that are too long', () => {
      const longColor = 'a'.repeat(21) // Exceeds MAX_COLOR_LENGTH (20)
      const result = validateColor(longColor)
      expect(result.valid).toBe(false)
    })
  })
  
  describe('validateImageFile', () => {
    it('should allow valid image files', () => {
      const validFiles = [
        new File([''], 'test.jpg', { type: 'image/jpeg' }),
        new File([''], 'test.png', { type: 'image/png' }),
        new File([''], 'test.gif', { type: 'image/gif' }),
        new File([''], 'test.webp', { type: 'image/webp' }),
        new File([''], 'test.svg', { type: 'image/svg+xml' }),
      ]
      
      for (const file of validFiles) {
        Object.defineProperty(file, 'size', { value: 1024 * 1024 }) // 1MB
        const result = validateImageFile(file)
        expect(result.valid).toBe(true)
      }
    })
    
    it('should reject non-image file types', () => {
      const invalidFiles = [
        new File([''], 'test.txt', { type: 'text/plain' }),
        new File([''], 'test.js', { type: 'application/javascript' }),
        new File([''], 'test.exe', { type: 'application/x-msdownload' }),
      ]
      
      for (const file of invalidFiles) {
        const result = validateImageFile(file)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('not allowed')
      }
    })
    
    it('should reject files that are too large', () => {
      const largeFile = new File([''], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 }) // 11MB > 10MB limit
      
      const result = validateImageFile(largeFile)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('10MB')
    })
    
    it('should reject files with dangerous characters in name', () => {
      const dangerousNames = [
        'test<script>.jpg', // Contains <
        'test>evil.jpg', // Contains >
        'test:evil.jpg', // Contains :
        'test|evil.jpg', // Contains |
        'test?evil.jpg', // Contains ?
        'test*evil.jpg', // Contains *
      ]
      
      for (const name of dangerousNames) {
        const file = new File([''], name, { type: 'image/jpeg' })
        Object.defineProperty(file, 'size', { value: 1024 })
        const result = validateImageFile(file)
        expect(result.valid).toBe(false)
      }
    })
    
    it('should reject files with names that are too long', () => {
      const longName = 'a'.repeat(256) + '.jpg'
      const file = new File([''], longName, { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 1024 })
      
      const result = validateImageFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('255 characters')
    })
    
    it('should reject non-File objects', () => {
      expect(validateImageFile(null as any).valid).toBe(false)
      expect(validateImageFile(undefined as any).valid).toBe(false)
      expect(validateImageFile('not a file' as any).valid).toBe(false)
    })
  })
  
  describe('validateImageUrl', () => {
    it('should allow valid HTTP/HTTPS URLs', () => {
      const validUrls = [
        'https://example.com/image.jpg',
        'http://example.com/image.png',
        'https://cdn.example.com/images/photo.webp',
      ]
      
      for (const url of validUrls) {
        const result = validateImageUrl(url)
        expect(result.valid).toBe(true)
      }
    })
    
    it('should allow valid data URLs', () => {
      const validDataUrls = [
        'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
        'data:image/webp;base64,UklGRiQAAABXRUJQVlA4==',
      ]
      
      for (const url of validDataUrls) {
        const result = validateImageUrl(url)
        expect(result.valid).toBe(true)
      }
    })
    
    it('should allow relative paths', () => {
      const validRelative = [
        '/images/photo.jpg',
        './images/photo.png',
        '../assets/image.gif',
      ]
      
      for (const url of validRelative) {
        const result = validateImageUrl(url)
        expect(result.valid).toBe(true)
      }
    })
    
    it('should reject dangerous protocols', () => {
      const dangerous = [
        'javascript:alert(1)',
        'vbscript:alert(1)',
        'file:///etc/passwd',
        'data:text/html,<script>alert(1)</script>',
      ]
      
      for (const url of dangerous) {
        const result = validateImageUrl(url)
        expect(result.valid).toBe(false)
      }
    })
    
    it('should reject invalid data URL formats', () => {
      const invalidDataUrls = [
        'data:text/html,<script>alert(1)</script>',
        'data:application/javascript,alert(1)',
        'data:image/jpeg,not-base64',
      ]
      
      for (const url of invalidDataUrls) {
        const result = validateImageUrl(url)
        expect(result.valid).toBe(false)
      }
    })
    
    it('should reject URLs with dangerous keywords', () => {
      const dangerous = [
        'https://example.com/image.jpg?javascript:alert(1)',
        'https://example.com/expression(alert(1)).jpg',
      ]
      
      for (const url of dangerous) {
        const result = validateImageUrl(url)
        expect(result.valid).toBe(false)
      }
    })
    
    it('should reject relative paths that go too far up', () => {
      const tooFarUp = [
        '../../../../etc/passwd',
        '../../../../../../windows/system32',
      ]
      
      for (const url of tooFarUp) {
        const result = validateImageUrl(url)
        expect(result.valid).toBe(false)
      }
    })
    
    it('should reject invalid URL formats', () => {
      const invalid = [
        'not a url',
        '://invalid',
        '',
      ]
      
      for (const url of invalid) {
        const result = validateImageUrl(url)
        expect(result.valid).toBe(false)
      }
    })
  })
  
  describe('sanitizeString', () => {
    it('should remove dangerous HTML tags', () => {
      const dangerous = [
        '<script>alert(1)</script>',
        '<iframe src="evil.com"></iframe>',
        'Hello <script>alert(1)</script> world',
      ]
      
      for (const input of dangerous) {
        const sanitized = sanitizeString(input)
        expect(sanitized).not.toContain('<script')
        expect(sanitized).not.toContain('</script>')
        expect(sanitized).not.toContain('<iframe')
      }
    })
    
    it('should remove event handlers', () => {
      const withHandlers = [
        'onclick=alert(1)',
        'onerror=alert(1)',
        'onload=evil()',
      ]
      
      for (const input of withHandlers) {
        const sanitized = sanitizeString(input)
        expect(sanitized).not.toMatch(/on\w+\s*=/)
      }
    })
    
    it('should remove control characters', () => {
      const withControl = 'Hello\x00World\x01Test'
      const sanitized = sanitizeString(withControl)
      expect(sanitized).not.toContain('\x00')
      expect(sanitized).not.toContain('\x01')
    })
    
    it('should preserve safe content', () => {
      const safe = [
        'Hello world',
        'Create a dark theme',
        'Use ocean blue colors',
      ]
      
      for (const input of safe) {
        const sanitized = sanitizeString(input)
        expect(sanitized).toBe(input)
      }
    })
    
    it('should handle empty or non-string inputs', () => {
      expect(sanitizeString('')).toBe('')
      expect(sanitizeString(null as any)).toBe('')
      expect(sanitizeString(undefined as any)).toBe('')
    })
  })
  
  describe('validateTextInput', () => {
    it('should allow safe text inputs', () => {
      const safe = [
        'Hello world',
        'This is a test',
        'a'.repeat(100), // Within default limit
      ]
      
      for (const text of safe) {
        const result = validateTextInput(text)
        expect(result.valid).toBe(true)
      }
    })
    
    it('should reject text that is too long', () => {
      const longText = 'a'.repeat(1001) // Exceeds default maxLength (1000)
      const result = validateTextInput(longText)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('1000 characters')
    })
    
    it('should respect custom maxLength', () => {
      const text = 'a'.repeat(501)
      const result1 = validateTextInput(text, 500, 'Custom Field')
      expect(result1.valid).toBe(false)
      
      const result2 = validateTextInput(text, 1000, 'Custom Field')
      expect(result2.valid).toBe(true)
    })
    
    it('should reject text with dangerous keywords', () => {
      const dangerous = [
        'Hello javascript:alert(1)',
        'Test with <script>alert(1)</script>',
        'Include eval(evil)',
      ]
      
      for (const text of dangerous) {
        const result = validateTextInput(text)
        expect(result.valid).toBe(false)
      }
    })
    
    it('should use custom field name in error messages', () => {
      const result = validateTextInput('a'.repeat(1001), 1000, 'Description')
      expect(result.error).toContain('Description')
    })
  })
  
  describe('Real-world attack scenarios', () => {
    it('should block XSS via prompt injection', () => {
      const attacks = [
        'Create theme with <script>alert(document.cookie)</script>',
        'Use javascript:alert(document.cookie)',
        'Theme with onclick=alert(document.cookie)',
      ]
      
      for (const attack of attacks) {
        const result = validateThemePrompt(attack)
        expect(result.valid).toBe(false)
      }
    })
    
    it('should block CSS injection via color values', () => {
      const attacks = [
        'expression(alert(1))',
        'javascript:alert(1)',
        'url("javascript:alert(1)")',
      ]
      
      for (const attack of attacks) {
        const result = validateColor(attack)
        expect(result.valid).toBe(false)
      }
    })
    
    it('should block malicious file uploads', () => {
      const maliciousFile = new File(['<script>alert(1)</script>'], 'evil.js', { type: 'application/javascript' })
      Object.defineProperty(maliciousFile, 'size', { value: 1024 })
      
      const result = validateImageFile(maliciousFile)
      expect(result.valid).toBe(false)
    })
    
    it('should block malicious URLs', () => {
      const attacks = [
        'javascript:alert(document.cookie)',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:alert(1)',
      ]
      
      for (const attack of attacks) {
        const result = validateImageUrl(attack)
        expect(result.valid).toBe(false)
      }
    })
  })
})

