import { linkDialogState$, useCellValues } from 'commonwealth-mdxeditor';
import React from 'react';
import { CustomLinkEdit } from 'views/components/MarkdownEditor/CustomLinkEdit';
import { CustomLinkPreview } from 'views/components/MarkdownEditor/CustomLinkPreview';
import { useMarkdownEditorMode } from 'views/components/MarkdownEditor/useMarkdownEditorMode';

/**
 * We need to use a popover on desktop and no container no mobile.
 */
export const CustomLinkDialogForDesktop = () => {
  const [linkDialogState] = useCellValues(linkDialogState$);

  const mode = useMarkdownEditorMode();

  if (linkDialogState.type === 'inactive') {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: linkDialogState.rectangle.top - linkDialogState.rectangle.height,
        left: linkDialogState.rectangle.left,
        backgroundColor: 'red',
      }}
    >
      {linkDialogState.type === 'preview' && <CustomLinkPreview />}
      {linkDialogState.type === 'edit' && <CustomLinkEdit />}
    </div>
  );
};
