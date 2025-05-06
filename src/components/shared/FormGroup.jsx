import React from 'react';

/**
 * A container component for form inputs with consistent styling
 * Can be used to group related inputs or create a consistent form layout
 * 
 * @param {ReactNode} children - Form input components to display
 * @param {string} title - Optional group title
 * @param {string} description - Optional group description
 * @param {string} className - Additional CSS classes
 */
const FormGroup = ({
  children,
  title = null,
  description = null,
  className = ''
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      {title && (
        <h3 className="text-lg font-medium text-gray-800 mb-2">{title}</h3>
      )}
      
      {description && (
        <p className="text-sm text-gray-600 mb-3">{description}</p>
      )}
      
      <div className="bg-white p-4 border border-gray-200 rounded-md">
        {children}
      </div>
    </div>
  );
};

export default FormGroup;