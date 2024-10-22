import {
  cancelLinkEdit$,
  linkDialogState$,
  updateLink$,
  useCellValues,
  usePublisher,
} from 'commonwealth-mdxeditor';
import React, { useState } from 'react';
import { IconButtonWithTooltip } from 'views/components/MarkdownEditor/customLinkDialog/IconButtonWithTooltip';
import './CustomLinkEdit.scss';

export const CustomLinkEdit = () => {
  const [linkDialogState] = useCellValues(linkDialogState$);
  const updateLink = usePublisher(updateLink$);

  const [link, setLink] = useState(
    linkDialogState.type == 'edit' ? linkDialogState.url : '',
  );

  const cancelLinkEdit = usePublisher(cancelLinkEdit$);

  if (linkDialogState.type !== 'edit') {
    return null;
  }
  return (
    <div className="CustomLinkEdit">
      <input
        type="text"
        value={link}
        style={{ flexGrow: 1 }}
        autoFocus={true}
        placeholder="Enter link"
        onChange={(event) => setLink(event.currentTarget.value)}
      />

      <IconButtonWithTooltip
        iconName="check"
        tooltip="Save"
        onClick={() => {
          updateLink({ url: link, title: link });
        }}
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
