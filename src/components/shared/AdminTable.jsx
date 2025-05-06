import React from 'react';

/**
 * A reusable table component for admin sections
 * 
 * @param {Array} columns - Array of column definitions, each with label and optional style
 * @param {Array} data - Array of data items to display
 * @param {Function} renderRow - Function to render a table row given an item and index
 * @param {string} emptyMessage - Message to display when there's no data
 * @param {string} className - Additional CSS classes to add to the table
 */
const AdminTable = ({ 
  columns, 
  data, 
  renderRow, 
  emptyMessage = 'No data found.',
  className = ''
}) => {
  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full border-collapse ${className}`}>
        <thead>
          <tr className="bg-gray-100">
            {columns.map((column, index) => (
              <th 
                key={index} 
                className="py-2 px-4 border-b text-left"
                style={column.style || {}}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td 
                colSpan={columns.length} 
                className="text-center py-4 px-4 border-b"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => renderRow(item, index))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminTable;