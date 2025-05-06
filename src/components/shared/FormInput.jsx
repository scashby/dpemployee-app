import React from 'react';

/**
 * A reusable form input component
 * 
 * @param {string} label - Input label
 * @param {string} type - Input type (text, email, password, etc.)
 * @param {string} name - Input name
 * @param {string} value - Input value
 * @param {function} onChange - Function to handle input change
 * @param {boolean} required - Whether the input is required
 * @param {string} placeholder - Input placeholder
 * @param {boolean} disabled - Whether the input is disabled
 * @param {string} className - Additional CSS classes
 * @param {string} error - Error message to display
 */
const FormInput = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  required = false,
  placeholder = '',
  disabled = false,
  className = '',
  error = ''
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        type={type}
        name={name}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full p-2 border rounded ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100' : ''}`}
        required={required}
      />
      
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default FormInput;