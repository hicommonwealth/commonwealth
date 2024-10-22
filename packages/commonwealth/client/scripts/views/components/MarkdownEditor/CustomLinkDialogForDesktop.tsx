import PopperUnstyled from '@mui/base/Popper';
import { linkDialogState$, useCellValues } from 'commonwealth-mdxeditor';
import React from 'react';
import { CustomLinkEdit } from 'views/components/MarkdownEditor/CustomLinkEdit';
import { CustomLinkPreview } from 'views/components/MarkdownEditor/CustomLinkPreview';

/**
 * We need to use a popover on desktop and no container no mobile.
 */
export const CustomLinkDialogForDesktop = () => {
  const [linkDialogState] = useCellValues(linkDialogState$);

  if (linkDialogState.type === 'inactive') {
    return null;
  }

  const getBoundingClientRect = (): DOMRect => {
    const x = linkDialogState.rectangle.left;
    const y = linkDialogState.rectangle.top;
    const height = linkDialogState.rectangle.height;
    const width = linkDialogState.rectangle.width;

    const rect = {
      x,
      y,
      height,
      width,
      top: y,
      left: x,
      bottom: x + height,
      right: y + width,
    };

    const toJSON = () => JSON.stringify(rect);
    return { ...rect, toJSON };
  };

  return (
    <PopperUnstyled
      open={true}
      anchorEl={{ getBoundingClientRect }}
      modifiers={[
        {
          name: 'preventOverflow',
          options: {
            padding: 16,
          },
        },
      ]}
    >
      {linkDialogState.type === 'preview' && <CustomLinkPreview />}
      {linkDialogState.type === 'edit' && <CustomLinkEdit />}
    </PopperUnstyled>
  );
};
