// Development Auth Bypass
// Untuk testing UI tanpa backend member-auth

// Check if we're in dev mode (localhost)
export const DEV_MODE = import.meta.env.DEV && window.location.hostname === 'localhost';

export function createDevToken(email: string): string {
  return `dev-token-${email}-${Date.now()}`;
}

export function createDevUser(email: string, name: string) {
  return {
    id: Math.floor(Math.random() * 10000),
    email,
    name,
    mobilePhone: "081234567890",
    hasRDN: false,
    emailVerified: false,
  };
}

// Default dev user untuk quick login
export const DEV_USER = {
  email: "demo@andaralab.id",
  password: "demo1234",
  name: "Demo User",
};
