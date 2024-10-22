import {
  linkDialogState$,
  removeLink$,
  useCellValues,
  usePublisher,
} from 'commonwealth-mdxeditor';
import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';

export const CustomLinkPreview = () => {
  const [linkDialogState] = useCellValues(linkDialogState$);
  const removeLink = usePublisher(removeLink$);

  if (linkDialogState.type !== 'preview') {
    return null;
  }

  // FIXME use SCSS
  return (
    <div style={{ display: 'flex', gap: 4, flexGrow: 1 }}>
      <a
        href={linkDialogState.url}
        target="_blank"
        style={{ flexGrow: 1 }}
        rel="noreferrer"
      >
        {linkDialogState.url}
      </a>

      <a href={linkDialogState.url} target="_blank" rel="noreferrer">
        <CWIcon iconName="arrowSquareOut" />
      </a>
    </div>
  );
};
