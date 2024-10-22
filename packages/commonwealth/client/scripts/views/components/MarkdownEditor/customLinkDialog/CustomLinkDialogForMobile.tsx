import { linkDialogState$, useCellValues } from 'commonwealth-mdxeditor';
import React from 'react';
import { CustomLinkEdit } from 'views/components/MarkdownEditor/customLinkDialog/CustomLinkEdit';
import { CustomLinkPreview } from 'views/components/MarkdownEditor/customLinkDialog/CustomLinkPreview';

/**
 * We need to use a popover on desktop and no container no mobile.
 */
export const CustomLinkDialogForMobile = () => {
  const [linkDialogState] = useCellValues(linkDialogState$);

  if (linkDialogState.type === 'inactive') {
    return null;
  }

  return (
    <>
      {linkDialogState.type === 'preview' && <CustomLinkPreview />}
      {linkDialogState.type === 'edit' && <CustomLinkEdit />}
    </>
  );
};
