import {
  cancelLinkEdit$,
  linkDialogState$,
  updateLink$,
  useCellValues,
  usePublisher,
} from 'commonwealth-mdxeditor';
import React, { useCallback, useState } from 'react';
import { IconButtonWithTooltip } from 'views/components/MarkdownEditor/customLinkDialog/IconButtonWithTooltip';
import './CustomLinkEdit.scss';

export const CustomLinkEdit = () => {
  const [linkDialogState] = useCellValues(linkDialogState$);
  const updateLink = usePublisher(updateLink$);

  const [link, setLink] = useState(
    linkDialogState.type == 'edit' ? linkDialogState.url : '',
  );

  const cancelLinkEdit = usePublisher(cancelLinkEdit$);
  const handleSave = useCallback(() => {
    updateLink({ url: link, title: link });
  }, [link, updateLink]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        handleSave();
        event.stopPropagation();
        event.preventDefault();
      }
    },
    [handleSave],
  );

  if (linkDialogState.type !== 'edit') {
    return null;
  }

  return (
    <div className="CustomLinkEdit">
      <input
        type="url"
        value={link}
        style={{ flexGrow: 1 }}
        autoFocus={true}
        placeholder="Enter link"
        onKeyDown={handleKeyDown}
        onChange={(event) => setLink(event.currentTarget.value)}
      />

      <IconButtonWithTooltip
        iconName="check"
        tooltip="Save"
        onClick={handleSave}
      />

      <IconButtonWithTooltip
        iconName="close"
        tooltip="Cancel"
        onClick={() => {
          cancelLinkEdit();
        }}
      />
    </div>
  );
};
