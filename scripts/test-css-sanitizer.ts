/**
 * Manual test script for CSS sanitizer
 * Run with: npx tsx scripts/test-css-sanitizer.ts
 */

import { 
  sanitizeCSS, 
  sanitizeCSSValue, 
  validateCSSVariable, 
  isAllowedCSSProperty,
  sanitizeCSSForApplication,
  testSanitizer
} from '../lib/css-sanitizer'

console.log('🧪 Testing CSS Sanitizer\n')

// Test 1: Safe CSS
console.log('Test 1: Safe CSS values')
const safeTests = [
  '--primary-color: #3b82f6;',
  '--background-color: #ffffff;',
  '--text-primary: rgba(0, 0, 0, 0.8);',
]

for (const test of safeTests) {
  const result = validateCSSVariable(test)
  console.log(`  ${result.valid ? '✅' : '❌'} ${test}`)
  if (!result.valid) {
    console.log(`     Error: ${result.error}`)
  }
}

// Test 2: Dangerous CSS
console.log('\nTest 2: Dangerous CSS (should be blocked)')
const dangerousTests = [
  '--primary-color: expression(alert("XSS"));',
  '--background: url("javascript:alert(1)");',
  '--color: url("data:text/html,<script>alert(1)</script>");',
  '--test: @import url("evil.com");',
]

for (const test of dangerousTests) {
  const result = validateCSSVariable(test)
  console.log(`  ${!result.valid ? '✅' : '❌'} ${test}`)
  if (result.valid) {
    console.log(`     WARNING: Dangerous CSS was allowed!`)
  } else {
    console.log(`     Blocked: ${result.error}`)
  }
}

// Test 3: Non-whitelisted properties
console.log('\nTest 3: Non-whitelisted properties (should be blocked)')
const invalidProps = [
  '--unknown-property: #000;',
  'color: red;', // Not a CSS variable
]

for (const test of invalidProps) {
  const result = validateCSSVariable(test)
  console.log(`  ${!result.valid ? '✅' : '❌'} ${test}`)
  if (result.valid) {
    console.log(`     WARNING: Invalid property was allowed!`)
  }
}

// Test 4: Full CSS sanitization
console.log('\nTest 4: Full CSS sanitization')
const fullCSS = `
  :root {
    --primary-color: #3b82f6;
    --background-color: expression(alert("XSS"));
    --text-primary: #111827;
    --unknown-property: #000;
  }
`

const sanitized = sanitizeCSS(fullCSS)
console.log('Original CSS:', fullCSS)
console.log('Sanitized CSS:')
console.log(sanitized)
console.log(`\n✅ Safe properties preserved: ${sanitized.includes('--primary-color') && sanitized.includes('--text-primary')}`)
console.log(`✅ Dangerous CSS removed: ${!sanitized.includes('expression')}`)
console.log(`✅ Invalid properties removed: ${!sanitized.includes('--unknown-property')}`)

// Test 5: Built-in test function
console.log('\nTest 5: Running built-in test function')
const allTestsPassed = testSanitizer()
console.log(`\n${allTestsPassed ? '✅' : '❌'} All tests: ${allTestsPassed ? 'PASSED' : 'FAILED'}`)

console.log('\n✨ CSS Sanitizer test complete!')

