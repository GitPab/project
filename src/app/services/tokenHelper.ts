// Token helper - centralized token management
export const TOKEN_KEYS = {
  TOKEN: 'auth_token',
  USER: 'auth_user',
  ADMIN_TOKEN: 'adminToken',
  ADMIN_USER: 'adminUser'
};

// Get token from any available key
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEYS.TOKEN) || 
         localStorage.getItem(TOKEN_KEYS.ADMIN_TOKEN);
}

// Get user data from any available key
export function getUser(): any | null {
  const userStr = localStorage.getItem(TOKEN_KEYS.USER) || 
                  localStorage.getItem(TOKEN_KEYS.ADMIN_USER);
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
}

// Save token to all keys for compatibility
export function saveToken(token: string, user: any): void {
  localStorage.setItem(TOKEN_KEYS.TOKEN, token);
  localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(user));
  localStorage.setItem(TOKEN_KEYS.ADMIN_TOKEN, token);
  localStorage.setItem(TOKEN_KEYS.ADMIN_USER, JSON.stringify(user));
}

// Clear all token keys
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEYS.TOKEN);
  localStorage.removeItem(TOKEN_KEYS.USER);
  localStorage.removeItem(TOKEN_KEYS.ADMIN_TOKEN);
  localStorage.removeItem(TOKEN_KEYS.ADMIN_USER);
}
