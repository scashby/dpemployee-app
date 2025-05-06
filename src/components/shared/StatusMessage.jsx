import React, { useEffect } from 'react';

/**
 * A reusable component for displaying error and success messages
 * 
 * @param {string} message - The message to display
 * @param {string} type - The type of message ('error' or 'success')
 * @param {function} onClear - Function to clear the message
 * @param {number} duration - Time in milliseconds before auto-clearing the message (0 for no auto-clear)
 */
const StatusMessage = ({ message, type, onClear, duration = 3000 }) => {
  useEffect(() => {
    if (message && duration > 0) {
      const timer = setTimeout(() => {
        onClear();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClear]);

  if (!message) return null;

  const classes = type === 'error' 
    ? 'my-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded'
    : 'my-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded';

  return (
    <div className={classes}>
      {message}
    </div>
  );
};

export default StatusMessage;