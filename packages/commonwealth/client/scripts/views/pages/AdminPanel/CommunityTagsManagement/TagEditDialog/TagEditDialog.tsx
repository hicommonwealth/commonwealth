import React, { useState } from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWResponsiveDialog } from 'views/components/component_kit/new_designs/CWResponsiveDialog';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';

import './TagEditDialog.scss';

interface TagEditDialogProps {
  tagId: number | null;
  tagName: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, name: string) => Promise<void>;
}

const TagEditDialog = ({
  tagId,
  tagName,
  isOpen,
  onClose,
  onSave,
}: TagEditDialogProps) => {
  const [name, setName] = useState(tagName);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    setName(tagName);
  }, [tagName]);

  const handleSave = async () => {
    if (!tagId) return;

    setIsSaving(true);
    try {
      await onSave(tagId, name.trim());
      onClose();
    } catch (error) {
      console.error('Error saving tag:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <CWResponsiveDialog
      open={isOpen}
      onClose={onClose}
      className="TagEditDialog"
    >
      <div className="tag-edit-container">
        <CWText type="h3" className="dialog-title">
          Edit Tag
        </CWText>

        <div className="form-container">
          <CWText type="caption" fontWeight="medium">
            Tag Name
          </CWText>
          <CWTextInput
            value={name}
            onInput={(e) => setName(e.target.value)}
            placeholder="Enter tag name"
            fullWidth
          />
        </div>

        <div className="actions-container">
          <CWButton label="Cancel" buttonType="secondary" onClick={onClose} />
          <CWButton
            label="Save"
            buttonType="primary"
            onClick={handleSave}
            disabled={!name.trim() || name.trim() === tagName || isSaving}
          />
        </div>
      </div>
    </CWResponsiveDialog>
  );
};

export default TagEditDialog;
