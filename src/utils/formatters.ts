/**
 * Formatter utilities for UI metrics and cache stats
 */

/**
 * Format KV Cache GPU usage intelligently.
 * If value >= 0.1%, formats as standard percentage with 1 decimal place (e.g., 45.2%).
 * If value < 0.1%, converts to per mille (‰ - phần nghìn) so low metrics aren't rounded down to 0.0%.
 *
 * Examples:
 * - 45.213 -> "45.2%"
 * - 0.54 -> "0.5%"
 * - 0.004221635883905006 -> "0.042‰"
 */
export function formatKvCache(val?: number): string {
  if (val === undefined || val === null || isNaN(val)) return '0.0%'
  if (val === 0) return '0.0%'

  // If value is >= 0.1%, format as standard percentage
  if (val >= 0.1) {
    return `${val.toFixed(1)}%`
  }

  // If value is small (< 0.1%), convert to per mille (‰)
  // Note: 1% = 10‰ (per mille)
  const perMille = val * 10
  if (perMille >= 0.001) {
    // Format to up to 3 decimal places, removing trailing zeros
    const formatted = Number(perMille.toFixed(3)).toString()
    return `${formatted}‰`
  }

  // For extremely small numbers, show high-precision percentage
  return `${Number(val.toFixed(6)).toString()}%`
}
