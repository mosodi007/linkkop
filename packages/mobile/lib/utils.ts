/**
 * Masks a phone number for display on Discover (e.g. +1 *** *** 1234).
 * Keeps the country code (+ and 1–3 digits) and last 4 digits visible; the rest are masked.
 */
export function maskPhoneNumber(phone: string | null | undefined): string {
  if (!phone || typeof phone !== 'string') return '*** *** ****';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '*** *** ****';
  const last4 = digits.slice(-4);
  const countryMatch = phone.trim().match(/^\+\d{1,3}/);
  const countryCode = countryMatch ? countryMatch[0] : '';
  if (countryCode) {
    return `${countryCode} *** *** ${last4}`;
  }
  return `*** *** ${last4}`;
}
