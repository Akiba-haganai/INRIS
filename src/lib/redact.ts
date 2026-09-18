/**
 * Redaction boundary for any text that will be sent to an external AI provider.
 *
 * Rules of use:
 *   - Every call to an LLM MUST pass user-supplied text through redactText()
 *     before it reaches the provider.
 *   - The full, unredacted text stays in the database for staff to read.
 *   - Every redaction run should be logged (see writeAuditLog) so we can
 *     reconstruct what the model actually saw.
 *
 * This is intentionally conservative. False positives are preferable to
 * false negatives.
 */

export interface RedactionResult {
  text: string
  redacted: {
    passport_number: number
    national_id: number
    email: number
    phone: number
    long_digit_string: number
  }
  touched: boolean
}

const PATTERNS: { key: keyof RedactionResult['redacted']; re: RegExp }[] = [
  // Passport numbers: common format = 1–2 letters + 6–8 digits
  { key: 'passport_number', re: /\b[A-Z]{1,2}\d{6,8}\b/g },
  // National ID: 6–10 digit sequences
  { key: 'national_id', re: /\b\d{6,10}\b/g },
  // Email
  { key: 'email', re: /[\w.+-]+@[\w-]+\.[\w.-]+/g },
  // Phone: any run of 8–15 digits with optional separators
  { key: 'phone', re: /\+?\d[\d\s().-]{7,14}\d/g },
  // Long contiguous digit string (catch-all)
  { key: 'long_digit_string', re: /\b\d{12,}\b/g },
]

export function redactText(input: string): RedactionResult {
  const counts: RedactionResult['redacted'] = {
    passport_number: 0,
    national_id: 0,
    email: 0,
    phone: 0,
    long_digit_string: 0,
  }

  let text = input
  for (const { key, re } of PATTERNS) {
    text = text.replace(re, (match) => {
      counts[key] += 1
      return `[REDACTED:${key.toUpperCase()}]`
    })
  }

  return {
    text,
    redacted: counts,
    touched: Object.values(counts).some((n) => n > 0),
  }
}
