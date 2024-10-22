import { linkDialogState$, useCellValues } from 'commonwealth-mdxeditor';
import React from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import './CustomLinkPreview.scss';

export const CustomLinkPreview = () => {
  const [linkDialogState] = useCellValues(linkDialogState$);

  if (linkDialogState.type !== 'preview') {
    return null;
  }

  return (
    <div className="CustomLinkPreview">
      <a
        href={linkDialogState.url}
        target="_blank"
        className="MainLink"
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
