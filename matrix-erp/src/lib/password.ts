import bcrypt from "bcryptjs";
import { DEFAULT_PASSWORD } from "./constants";

export const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 6 characters and include letters, numbers, and special characters (#, &, $, %, @, etc.).";

/** First-login password: exactly 6 digits, confirm must match. */
export function validateSixDigitPassword(password: string): string | null {
  if (!/^\d{6}$/.test(password)) {
    return "Password must be exactly 6 digits (0-9).";
  }
  if (password === DEFAULT_PASSWORD) {
    return "You cannot reuse the default password 1234.";
  }
  return null;
}

export function validateStrongPassword(password: string): string | null {
  if (password.length < 6) {
    return "Password must be at least 6 characters.";
  }
  if (!/[a-zA-Z]/.test(password)) {
    return "Password must include letters (A–Z / a–z).";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must include numbers (0–9).";
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    return "Password must include special characters (#, &, $, %, @, etc.).";
  }
  return null;
}

/** Default first-login password is allowed only until user changes it. */
export function isDefaultBootstrapPassword(password: string): boolean {
  return password === DEFAULT_PASSWORD;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
