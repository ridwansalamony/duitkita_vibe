export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidAmount(amount: unknown): boolean {
  return typeof amount === 'number' && !isNaN(amount) && amount > 0;
}
