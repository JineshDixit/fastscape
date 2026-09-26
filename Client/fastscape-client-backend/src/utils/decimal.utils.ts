/**
 * Decimal Utilities
 * Safe decimal operations for financial calculations
 * Avoids floating-point precision issues
 */

/**
 * Round a number to specified decimal places
 */
export const roundDecimal = (value: number, decimals: number = 2): number => {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
};

/**
 * Add two decimal numbers safely
 */
export const addDecimal = (a: number, b: number, decimals: number = 2): number => {
  return roundDecimal(a + b, decimals);
};

/**
 * Subtract two decimal numbers safely
 */
export const subtractDecimal = (a: number, b: number, decimals: number = 2): number => {
  return roundDecimal(a - b, decimals);
};

/**
 * Multiply two decimal numbers safely
 */
export const multiplyDecimal = (a: number, b: number, decimals: number = 2): number => {
  return roundDecimal(a * b, decimals);
};

/**
 * Divide two decimal numbers safely
 */
export const divideDecimal = (a: number, b: number, decimals: number = 2): number => {
  if (b === 0) {
    throw new Error('Division by zero');
  }
  return roundDecimal(a / b, decimals);
};

/**
 * Compare two decimal numbers with tolerance
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
export const compareDecimal = (a: number, b: number, delta: number = 0.01): number => {
  const diff = a - b;
  if (Math.abs(diff) < delta) {
    return 0; // Equal within tolerance
  }
  return diff > 0 ? 1 : -1;
};

/**
 * Check if two decimal numbers are equal within tolerance
 */
export const isEqualDecimal = (a: number, b: number, delta: number = 0.01): boolean => {
  return compareDecimal(a, b, delta) === 0;
};

/**
 * Check if a >= b within tolerance
 */
export const isGreaterOrEqualDecimal = (a: number, b: number, delta: number = 0.01): boolean => {
  return compareDecimal(a, b, delta) >= 0;
};

/**
 * Check if a > b within tolerance
 */
export const isGreaterDecimal = (a: number, b: number, delta: number = 0.01): boolean => {
  return compareDecimal(a, b, delta) > 0;
};

/**
 * Check if a <= b within tolerance
 */
export const isLessOrEqualDecimal = (a: number, b: number, delta: number = 0.01): boolean => {
  return compareDecimal(a, b, delta) <= 0;
};

/**
 * Check if a < b within tolerance
 */
export const isLessDecimal = (a: number, b: number, delta: number = 0.01): boolean => {
  return compareDecimal(a, b, delta) < 0;
};

/**
 * Convert amount to cents (for Stripe and other payment gateways)
 */
export const toCents = (amount: number): number => {
  return Math.round(amount * 100);
};

/**
 * Convert cents to amount
 */
export const fromCents = (cents: number): number => {
  return roundDecimal(cents / 100, 2);
};

/**
 * Calculate percentage of an amount
 */
export const calculatePercentage = (amount: number, percentage: number, decimals: number = 2): number => {
  return roundDecimal((amount * percentage) / 100, decimals);
};

/**
 * Format amount for display
 */
export const formatAmount = (amount: number, currency: string = 'USD', decimals: number = 2): string => {
  return `${currency} ${roundDecimal(amount, decimals).toFixed(decimals)}`;
};
