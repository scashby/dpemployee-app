import { useState } from 'react';

/**
 * Hook for managing error and success messages with auto-clear functionality
 * 
 * @param {number} duration - Time in ms before messages auto-clear (0 for no auto-clear)
 * @returns {Object} Message state and functions
 */
export const useMessages = (duration = 5000) => {
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Show error message with optional auto-clear
  const showError = (message) => {
    setError(message);
    if (message && duration > 0) {
      setTimeout(() => setError(null), duration);
    }
  };
  
  // Show success message with optional auto-clear
  const showSuccess = (message) => {
    setSuccessMessage(message);
    if (message && duration > 0) {
      setTimeout(() => setSuccessMessage(null), duration);
    }
  };
  
  // Clear all messages
  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };
  
  return {
    error,
    successMessage,
    showError,
    showSuccess,
    clearMessages
  };
};

export default useMessages;