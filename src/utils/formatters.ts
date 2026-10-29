/**
 * Formatter utilities for UI metrics and cache stats
 */

/**
 * Normalizes KV Cache GPU usage to a percentage number (0 - 100).
 * vLLM Prometheus metrics report `vllm:gpu_cache_usage_perc` as a ratio in [0, 1] (e.g., 0.05435 -> 5.435%).
 * If the value is already in the 0 - 100 range, it preserves it.
 */
export function getKvCachePercent(val?: number | null): number {
  if (val === undefined || val === null || isNaN(val) || val <= 0) return 0
  // vLLM raw metric: 1.0 = 100%, 0.05435... = 5.435%
  return val <= 1 ? val * 100 : val
}

/**
 * Format KV Cache GPU usage intelligently.
 * Handles:
 * - Decimal ratio [0, 1] from vLLM/Prometheus: 0.05435356200527708 -> "5.4%"
 * - Pre-scaled percentage (0 - 100): 58.4 -> "58.4%"
 *
 * Examples:
 * - 0.05435356200527708 -> "5.4%"
 * - 0.584 -> "58.4%"
 * - 58.4 -> "58.4%"
 * - 1.0 -> "100.0%"
 * - 0 -> "0.0%"
 */
export function formatKvCache(val?: number | null): string {
  if (val === undefined || val === null || isNaN(val) || val <= 0) return '0.0%'

  const percent = getKvCachePercent(val)

  // If between 0% and 0.1%, display with 2 decimal places so it's not 0.0%
  if (percent < 0.1) {
    return `${percent.toFixed(2)}%`
  }

  return `${percent.toFixed(1)}%`
}
