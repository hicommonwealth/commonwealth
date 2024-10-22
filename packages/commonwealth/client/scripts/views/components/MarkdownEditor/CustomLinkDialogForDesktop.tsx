import { linkDialogState$, useCellValues } from 'commonwealth-mdxeditor';
import React, { useCallback, useEffect, useMemo } from 'react';
import { CustomLinkEdit } from 'views/components/MarkdownEditor/CustomLinkEdit';
import { CustomLinkPreview } from 'views/components/MarkdownEditor/CustomLinkPreview';
import CWPopover, {
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';
import './CustomLinkDialogForDesktop.scss';

/**
 * We need to use a popover on desktop and no container no mobile.
 */
export const CustomLinkDialogForDesktop = () => {
  const popoverProps = usePopover();

  const [linkDialogState] = useCellValues(linkDialogState$);

  // this is needed because we have to dispatch popover base on its position on
  // the screen.
  const getBoundingClientRect = useCallback((): DOMRect => {
    const x = linkDialogState.rectangle!.left;
    const y = linkDialogState.rectangle!.top;
    const height = linkDialogState.rectangle!.height;
    const width = linkDialogState.rectangle!.width;

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
  }, [linkDialogState.rectangle]);

  const anchorEl = useMemo(() => {
    return { getBoundingClientRect };
  }, [getBoundingClientRect]);

  useEffect(() => {
    if (linkDialogState.type === 'inactive') {
      popoverProps.dispose();
      return;
    }

    popoverProps.setAnchorEl(anchorEl);
  }, [anchorEl, getBoundingClientRect, linkDialogState.type, popoverProps]);

  if (linkDialogState.type === 'inactive') {
    return null;
  }

  return (
    <CWPopover
      {...popoverProps}
      className="CustomLinkDialogForDesktopPopover"
      body={
        <div className="CustomLinkDialogForDesktop">
          {linkDialogState.type === 'preview' && <CustomLinkPreview />}
          {linkDialogState.type === 'edit' && <CustomLinkEdit />}
        </div>
      }
    />
  );
};
