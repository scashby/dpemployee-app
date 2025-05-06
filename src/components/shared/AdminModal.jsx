import React from 'react';

/**
 * A reusable modal component for admin sections
 *
 * @param {boolean} show - Whether the modal is visible
 * @param {function} onClose - Function to call when the modal is closed
 * @param {string} title - Modal title
 * @param {ReactNode} children - Modal content
 * @param {string} size - Modal size ('sm', 'md', 'lg', 'xl')
 * @param {function} onSave - Function to call when the primary action button is clicked
 * @param {string} saveButtonText - Text for the primary action button
 * @param {string} cancelButtonText - Text for the cancel button
 * @param {boolean} showFooter - Whether to show the footer with action buttons
 */
const AdminModal = ({
  show,
  onClose,
  title,
  children,
  size = 'md',
  onSave = null,
  saveButtonText = 'Save',
  cancelButtonText = 'Cancel',
  showFooter = true
}) => {
  if (!show) return null;

  // Determine modal width based on size
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };
  
  const modalSizeClass = sizeClasses[size] || sizeClasses.md;

  // Handle click on the background
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className={`bg-white p-6 rounded-lg w-full ${modalSizeClass}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-6">
          {children}
        </div>
        
        {showFooter && (
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-gray-300 rounded px-4 py-2 hover:bg-gray-100"
            >
              {cancelButtonText}
            </button>
            
            {onSave && (
              <button
                type="button"
                onClick={onSave}
                className="bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600"
              >
                {saveButtonText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminModal;