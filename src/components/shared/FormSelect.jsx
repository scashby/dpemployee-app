import React from 'react';

/**
 * A reusable select/dropdown component
 * 
 * @param {string} label - Input label
 * @param {string} name - Select name
 * @param {string|array} value - Selected value(s)
 * @param {function} onChange - Function to handle select change
 * @param {array} options - Array of options, each with value and label
 * @param {boolean} required - Whether the select is required
 * @param {boolean} disabled - Whether the select is disabled
 * @param {string} className - Additional CSS classes
 * @param {string} error - Error message to display
 * @param {boolean} multiple - Whether multiple selection is allowed
 * @param {string} helpText - Help text to display below the select
 */
const FormSelect = ({
  label,
  name,
  value,
  onChange,
  options = [],
  required = false,
  disabled = false,
  className = '',
  error = '',
  multiple = false,
  helpText = ''
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        name={name}
        value={value || (multiple ? [] : '')}
        onChange={onChange}
        disabled={disabled}
        multiple={multiple}
        className={`w-full p-2 border rounded ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100' : ''}`}
        required={required}
      >
        {!multiple && <option value="">Select...</option>}
        
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {helpText && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default FormSelect;