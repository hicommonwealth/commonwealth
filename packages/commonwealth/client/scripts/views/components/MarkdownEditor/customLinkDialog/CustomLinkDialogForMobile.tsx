import { linkDialogState$, useCellValues } from 'commonwealth-mdxeditor';
import React from 'react';
import { CustomLinkEdit } from 'views/components/MarkdownEditor/customLinkDialog/CustomLinkEdit';
import { CustomLinkPreview } from 'views/components/MarkdownEditor/customLinkDialog/CustomLinkPreview';

/**
 * We don't use any type of container on mobile.
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
