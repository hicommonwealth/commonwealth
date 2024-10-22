import {
  linkDialogState$,
  switchFromPreviewToLinkEdit$,
  useCellValues,
  usePublisher,
} from 'commonwealth-mdxeditor';
import React from 'react';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import './CustomLinkPreview.scss';

export const CustomLinkPreview = () => {
  const [linkDialogState] = useCellValues(linkDialogState$);
  const switchFromPreviewToLinkEdit = usePublisher(
    switchFromPreviewToLinkEdit$,
  );

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

      <CWIconButton
        iconName="pencil"
        onClick={() => switchFromPreviewToLinkEdit()}
      />
    </div>
  );
};
