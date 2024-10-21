import {
  linkDialogState$,
  removeLink$,
  useCellValues,
  usePublisher,
} from 'commonwealth-mdxeditor';
import React from 'react';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';

export const CustomLinkPreview = () => {
  const [linkDialogState] = useCellValues(linkDialogState$);
  const removeLink = usePublisher(removeLink$);

  if (linkDialogState.type !== 'preview') {
    return null;
  }

  // FIXME use SCSS
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <a href={linkDialogState.url}>{linkDialogState.url}</a>

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
