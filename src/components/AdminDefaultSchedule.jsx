import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';

const AdminDefaultSchedule = () => {
  const [templates, setTemplates] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    date: null, // null for seasonal templates, date for holiday templates
    template: {}
  });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [editMode, setEditMode] = useState(null);
  const [templateType, setTemplateType] = useState('seasonal'); // 'seasonal' or 'holiday'
  const [activeDay, setActiveDay] = useState('Monday');

  // Days of the week
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Shift types - simplified for this implementation
  const shiftTypes = ['Tasting Room', 'Offsite', 'Packaging', 'Off'];

  // Initialize template structure
  useEffect(() => {
    // Create an empty template with days of the week
    const emptyTemplate = {};
    daysOfWeek.forEach(day => {
      emptyTemplate[day] = [];
    });
    setNewTemplate(prev => ({ ...prev, template: emptyTemplate }));
  }, []);

  useEffect(() => {
    fetchTemplates();
    fetchEmployees();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .order('name');

      if (error) throw error;
      
      // Parse template JSON if needed
      const parsedData = data.map(item => {
        if (typeof item.template === 'string') {
          try {
            item.template = JSON.parse(item.template);
          } catch (e) {
            console.error('Error parsing template:', e);
            item.template = {};
          }
        }
        return item;
      });
      
      setTemplates(parsedData || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setError('Failed to load schedule templates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTemplate({ ...newTemplate, [name]: value });
  };

  const handleTemplateTypeChange = (e) => {
    const type = e.target.value;
    setTemplateType(type);
    
    // Reset date field based on template type
    if (type === 'seasonal') {
      setNewTemplate(prev => ({ ...prev, date: null }));
    } else {
      // Set a default date for holiday template
      setNewTemplate(prev => ({ ...prev, date: '' }));
    }
  };

  const handleDayClick = (day) => {
    setActiveDay(day);
  };

  const handleShiftChange = (day, empId, shift) => {
    // Create a deep copy of the current template
    const updatedTemplate = JSON.parse(JSON.stringify(newTemplate.template));
    
    // Check if employee already has a shift for this day
    const existingIndex = updatedTemplate[day].findIndex(item => item.employeeId === empId);
    
    if (existingIndex >= 0) {
      if (shift === 'Off') {
        // Remove the shift if "Off" is selected
        updatedTemplate[day].splice(existingIndex, 1);
      } else {
        // Update existing shift
        updatedTemplate[day][existingIndex].shift = shift;
      }
    } else if (shift !== 'Off') {
      // Add new shift if one doesn't exist and it's not "Off"
      updatedTemplate[day].push({
        employeeId: empId,
        shift: shift
      });
    }
    
    // Update the template state
    setNewTemplate(prev => ({
      ...prev,
      template: updatedTemplate
    }));
  };

  const saveTemplate = async (e) => {
    e.preventDefault();
    
    if (!newTemplate.name) {
      setError('Template name is required');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const templateToSave = {
        name: newTemplate.name,
        date: templateType === 'seasonal' ? null : newTemplate.date,
        template: newTemplate.template
      };

      const { data, error } = await supabase
        .from('holidays')
        .insert([templateToSave])
        .select();

      if (error) throw error;

      setTemplates([...templates, data[0]]);
      // Reset form
      const emptyTemplate = {};
      daysOfWeek.forEach(day => {
        emptyTemplate[day] = [];
      });
      
      setNewTemplate({
        name: '',
        date: templateType === 'seasonal' ? null : '',
        template: emptyTemplate
      });
      
      setSuccessMessage('Template saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving template:', error);
      setError('Failed to save template. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const updateTemplate = async (id) => {
    try {
      const templateToUpdate = templates.find(t => t.id === id);
      
      const { error } = await supabase
        .from('holidays')
        .update({
          name: templateToUpdate.name,
          date: templateToUpdate.date,
          template: templateToUpdate.template
        })
        .eq('id', id);

      if (error) throw error;
      
      setSuccessMessage('Template updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setEditMode(null);
    } catch (error) {
      console.error('Error updating template:', error);
      setError('Failed to update template. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const deleteTemplate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('holidays')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTemplates(templates.filter(t => t.id !== id));
      setSuccessMessage('Template deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting template:', error);
      setError('Failed to delete template. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEditTemplateChange = (id, field, value) => {
    setTemplates(
      templates.map(temp => (temp.id === id ? { ...temp, [field]: value } : temp))
    );
  };

  const handleEditShiftChange = (id, day, empId, shift) => {
    // Find the template being edited
    const templateToEdit = templates.find(t => t.id === id);
    if (!templateToEdit) return;
    
    // Create a deep copy of the template
    const updatedTemplate = JSON.parse(JSON.stringify(templateToEdit.template));
    
    // Check if employee already has a shift for this day
    const existingIndex = updatedTemplate[day].findIndex(item => item.employeeId === empId);
    
    if (existingIndex >= 0) {
      if (shift === 'Off') {
        // Remove the shift if "Off" is selected
        updatedTemplate[day].splice(existingIndex, 1);
      } else {
        // Update existing shift
        updatedTemplate[day][existingIndex].shift = shift;
      }
    } else if (shift !== 'Off') {
      // Add new shift if one doesn't exist and it's not "Off"
      updatedTemplate[day].push({
        employeeId: empId,
        shift: shift
      });
    }
    
    // Update the templates state
    setTemplates(
      templates.map(temp => 
        temp.id === id ? { ...temp, template: updatedTemplate } : temp
      )
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getEmployeeName = (id) => {
    const employee = employees.find(emp => emp.id === id);
    return employee ? employee.name : 'Unknown';
  };

  if (loading) {
    return <div className="p-4">Loading templates...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Default Schedules & Holiday Templates</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Create New Template</h3>
        <form onSubmit={saveTemplate} className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name*
              </label>
              <input
                type="text"
                name="name"
                value={newTemplate.name}
                onChange={handleInputChange}
                placeholder="e.g. Summer Schedule, Thanksgiving"
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Type
              </label>
              <select
                value={templateType}
                onChange={handleTemplateTypeChange}
                className="w-full p-2 border rounded"
              >
                <option value="seasonal">Seasonal (No Date)</option>
                <option value="holiday">Holiday (Specific Date)</option>
              </select>
            </div>
            {templateType === 'holiday' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Holiday Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={newTemplate.date || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required={templateType === 'holiday'}
                />
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <h4 className="font-medium mb-2">Define Schedule Template</h4>
            
            <div className="flex flex-wrap gap-2 mb-2">
              {daysOfWeek.map(day => (
                <button
                  key={day}
                  type="button"
                  className={`px-3 py-1 rounded ${
                    activeDay === day
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  onClick={() => handleDayClick(day)}
                >
                  {day}
                </button>
              ))}
            </div>
            
            <div className="bg-white p-4 border rounded">
              <h5 className="font-medium mb-2">{activeDay} Schedule</h5>
              <div className="overflow-x-auto">
                <table className="min-w-full border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 border text-left">Employee</th>
                      <th className="py-2 px-4 border text-left">Shift</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => {
                      // Find if employee has a shift for this day
                      const assignedShift = newTemplate.template[activeDay]?.find(
                        item => item.employeeId === employee.id
                      )?.shift || 'Off';
                      
                      return (
                        <tr key={employee.id}>
                          <td className="py-2 px-4 border">{employee.name}</td>
                          <td className="py-2 px-4 border">
                            <select
                              className="w-full p-1 border rounded"
                              value={assignedShift}
                              onChange={(e) => handleShiftChange(activeDay, employee.id, e.target.value)}
                            >
                              <option value="Off">Off</option>
                              {shiftTypes.filter(s => s !== 'Off').map(shift => (
                                <option key={shift} value={shift}>
                                  {shift}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
            >
              Save Template
            </button>
          </div>
        </form>
      </div>

      <h3 className="text-xl font-semibold mb-4">Existing Templates</h3>
      {templates.length === 0 ? (
        <div className="bg-gray-50 p-4 rounded text-center">
          No templates found. Create your first template above.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white p-4 border rounded shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-lg">
                  {editMode === template.id ? (
                    <input
                      type="text"
                      value={template.name}
                      onChange={(e) => handleEditTemplateChange(template.id, 'name', e.target.value)}
                      className="p-1 border rounded"
                    />
                  ) : (
                    template.name
                  )}
                </h4>
                <div>
                  {editMode === template.id ? (
                    <>
                      <button
                        onClick={() => updateTemplate(template.id)}
                        className="bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded mr-2 text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditMode(null)}
                        className="bg-gray-500 hover:bg-gray-600 text-white py-1 px-2 rounded text-sm"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditMode(template.id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded mr-2 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-sm"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Type:</span>{' '}
                {template.date ? 'Holiday' : 'Seasonal'}
                {template.date && (
                  <span className="ml-2">
                    <span className="font-medium">Date:</span>{' '}
                    {editMode === template.id ? (
                      <input
                        type="date"
                        value={template.date || ''}
                        onChange={(e) => handleEditTemplateChange(template.id, 'date', e.target.value)}
                        className="p-1 border rounded"
                      />
                    ) : (
                      formatDate(template.date)
                    )}
                  </span>
                )}
              </div>
              
              {editMode === template.id ? (
                <div className="mb-2">
                  <h5 className="font-medium mb-1">Edit Template</h5>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {daysOfWeek.map(day => (
                      <button
                        key={day}
                        type="button"
                        className={`px-2 py-1 rounded text-sm ${
                          activeDay === day
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        onClick={() => handleDayClick(day)}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  
                  <div className="bg-white p-2 border rounded">
                    <h6 className="font-medium mb-1 text-sm">{activeDay} Schedule</h6>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="py-1 px-2 border text-left">Employee</th>
                            <th className="py-1 px-2 border text-left">Shift</th>
                          </tr>
                        </thead>
                        <tbody>
                          {employees.map((employee) => {
                            const assignedShift = template.template[activeDay]?.find(
                              item => item.employeeId === employee.id
                            )?.shift || 'Off';
                            
                            return (
                              <tr key={employee.id}>
                                <td className="py-1 px-2 border">{employee.name}</td>
                                <td className="py-1 px-2 border">
                                  <select
                                    className="w-full p-1 border rounded text-sm"
                                    value={assignedShift}
                                    onChange={(e) => handleEditShiftChange(
                                      template.id, 
                                      activeDay, 
                                      employee.id, 
                                      e.target.value
                                    )}
                                  >
                                    <option value="Off">Off</option>
                                    {shiftTypes.filter(s => s !== 'Off').map(shift => (
                                      <option key={shift} value={shift}>
                                        {shift}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-2">
                  <h5 className="font-medium mb-1">Template Summary</h5>
                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {daysOfWeek.map(day => {
                      const dayShifts = template.template[day] || [];
                      const assignedCount = dayShifts.length;
                      
                      return (
                        <div key={day} className="bg-gray-50 p-1 rounded">
                          <div className="font-medium">{day.substring(0, 3)}</div>
                          <div>
                            {assignedCount} {assignedCount === 1 ? 'employee' : 'employees'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDefaultSchedule;