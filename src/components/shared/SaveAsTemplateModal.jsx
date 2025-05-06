import React from 'react';
import AdminModal from '../shared/AdminModal';
import FormInput from '../shared/FormInput';
import FormSelect from '../shared/FormSelect';

/**
 * Modal for saving the current schedule as a template
 */
const SaveAsTemplateModal = ({
  show,
  onClose,
  saveAsTemplateData,
  onChange,
  onSave,
  templates
}) => {
  return (
    <AdminModal
      show={show}
      onClose={onClose}
      title="Save Schedule as Template"
      onSave={onSave}
      saveButtonText="Save as Template"
    >
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            id="overwriteExisting"
            name="overwriteExisting"
            checked={saveAsTemplateData.overwriteExisting}
            onChange={onChange}
            className="mr-2"
          />
          <label htmlFor="overwriteExisting" className="text-sm font-medium text-gray-700">
            Update existing template
          </label>
        </div>
        
        {saveAsTemplateData.overwriteExisting ? (
          <FormSelect
            label="Select Template to Update"
            name="existingTemplateId"
            value={saveAsTemplateData.existingTemplateId || ''}
            onChange={onChange}
            options={templates.map(template => ({
              value: template.id,
              label: template.name
            }))}
            required={true}
          />
        ) : (
          <FormInput
            label="New Template Name"
            name="name"
            value={saveAsTemplateData.name || ''}
            onChange={onChange}
            placeholder="e.g. Summer Schedule, Standard Week"
            required={true}
          />
        )}
        
        <p className="mt-2 text-sm text-gray-500">
          This will save the current employee schedule as a template that can be applied to future weeks.
          Only regular shifts will be included (event shifts are not saved in templates).
        </p>
      </div>
    </AdminModal>
  );
};

export default SaveAsTemplateModal;