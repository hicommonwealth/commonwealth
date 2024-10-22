import {
  cancelLinkEdit$,
  linkDialogState$,
  removeLink$,
  updateLink$,
  useCellValues,
  usePublisher,
} from 'commonwealth-mdxeditor';
import React, { useState } from 'react';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import './CustomLinkEdit.scss';

export const CustomLinkEdit = () => {
  const [linkDialogState] = useCellValues(linkDialogState$);
  const removeLink = usePublisher(removeLink$);
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

      <CWIconButton
        iconName="check"
        onClick={() => {
          updateLink({ url: link, title: link });
        }}
      />

      <CWIconButton
        iconName="close"
        onClick={() => {
          cancelLinkEdit();
        }}
      />
    </div>
  );
};
