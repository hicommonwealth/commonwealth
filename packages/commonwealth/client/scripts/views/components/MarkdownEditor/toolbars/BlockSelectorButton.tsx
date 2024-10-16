import {
  BlockType,
  currentBlockType$,
  useCellValue,
} from 'commonwealth-mdxeditor';
import React, { useCallback } from 'react';
import { CWHeadingButton } from 'views/components/MarkdownEditor/toolbars/CWHeadingButton';
import CWPopover, {
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';

import './BlockSelectorButton.scss';

function blockTypeToIconName(blockType: BlockType) {
  switch (blockType) {
    case 'paragraph':
      return 'p';
    case 'quote':
      return 'q';
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
    case '':
      return blockType;
  }
}

export const BlockSelectorButton = () => {
  const formattingPopoverProps = usePopover();

  const currentBlockType = useCellValue(currentBlockType$);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
      formattingPopoverProps.handleInteraction(event);
    },
    [formattingPopoverProps],
  );

  return (
    <div className="BlockSelectorButton">
      <button onClick={formattingPopoverProps.handleInteraction}>
        {blockTypeToIconName(currentBlockType)}
      </button>

      <CWPopover
        className="FormattingPopover"
        body={
          <div onMouseLeave={formattingPopoverProps.handleInteraction}>
            <CWHeadingButton blockType="h1" onClick={handleClick} />
            <CWHeadingButton blockType="h2" onClick={handleClick} />
            <CWHeadingButton blockType="h3" onClick={handleClick} />
            <CWHeadingButton blockType="quote" onClick={handleClick} />
          </div>
        }
        {...formattingPopoverProps}
      />
    </div>
  );
};
