import {
  linkDialogState$,
  removeLink$,
  switchFromPreviewToLinkEdit$,
  useCellValues,
  usePublisher,
} from 'commonwealth-mdxeditor';
import React from 'react';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';

export const CustomLinkEdit = () => {
  const [linkDialogState] = useCellValues(linkDialogState$);
  const removeLink = usePublisher(removeLink$);
  const switchFromPreviewToLinkEdit = usePublisher(
    switchFromPreviewToLinkEdit$,
  );

  if (linkDialogState.type !== 'edit') {
    return null;
  }

  // FIXME use SCSS
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <input type="text" value={linkDialogState.url} />

      <CWIconButton
        iconName="linkBreak"
        onClick={() => {
          console.log('FIXME: removing link');
          removeLink();
        }}
      />
    </div>
  );
};
