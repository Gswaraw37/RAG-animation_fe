/**
 * Generate UUID v4 with fallback for older browsers
 * @returns {string} UUID v4 string
 */
export const generateUUID = () => {
  // Check if crypto.randomUUID is available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (error) {
      console.warn('crypto.randomUUID failed, using fallback:', error);
    }
  }
  
  // Fallback UUID v4 generator for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Generate short UUID (8 characters) for display purposes
 * @returns {string} Short UUID string
 */
export const generateShortUUID = () => {
  return generateUUID().split('-')[0];
};

/**
 * Validate if string is a valid UUID
 * @param {string} uuid - UUID string to validate
 * @returns {boolean} True if valid UUID
 */
export const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};
