// Utility functions for JWT token operations

/**
 * Decode JWT token and extract payload
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded payload or null if invalid
 */
export const decodeJWT = (token) => {
  try {
    if (!token) return null;
    
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace('Bearer ', '');
    
    // Split token into parts
    const parts = cleanToken.split('.');
    if (parts.length !== 3) return null;
    
    // Decode payload (middle part)
    const payload = parts[1];
    const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};

/**
 * Extract user ID from JWT token
 * @param {string} token - JWT token
 * @returns {number|null} - User ID or null if not found
 */
export const getUserIdFromToken = (token) => {
  const payload = decodeJWT(token);
  return payload?.userId || payload?.sub || payload?.id || null;
};

/**
 * Extract username from JWT token
 * @param {string} token - JWT token
 * @returns {string|null} - Username or null if not found
 */
export const getUsernameFromToken = (token) => {
  const payload = decodeJWT(token);
  return payload?.username || payload?.userName || null;
};

/**
 * Extract role from JWT token
 * @param {string} token - JWT token
 * @returns {string|null} - Role or null if not found
 */
export const getRoleFromToken = (token) => {
  const payload = decodeJWT(token);
  return payload?.role || payload?.roleName || null;
};

/**
 * Check if JWT token is expired
 * @param {string} token - JWT token
 * @returns {boolean} - True if expired, false otherwise
 */
export const isTokenExpired = (token) => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
};
