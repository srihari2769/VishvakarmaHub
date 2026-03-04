export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true, message: '' };
}

export function validateRequired(value: string, fieldName: string): { valid: boolean; message: string } {
  if (!value || value.trim().length === 0) {
    return { valid: false, message: `${fieldName} is required` };
  }
  return { valid: true, message: '' };
}

export function validateMinLength(value: string, min: number, fieldName: string): { valid: boolean; message: string } {
  if (value.length < min) {
    return { valid: false, message: `${fieldName} must be at least ${min} characters` };
  }
  return { valid: true, message: '' };
}

export function validateMaxLength(value: string, max: number, fieldName: string): { valid: boolean; message: string } {
  if (value.length > max) {
    return { valid: false, message: `${fieldName} must be at most ${max} characters` };
  }
  return { valid: true, message: '' };
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateFundingGoal(amount: number): { valid: boolean; message: string } {
  if (amount < 10000) {
    return { valid: false, message: 'Funding goal must be at least ₹10,000' };
  }
  if (amount > 100000000) {
    return { valid: false, message: 'Funding goal cannot exceed ₹10,00,00,000' };
  }
  return { valid: true, message: '' };
}
