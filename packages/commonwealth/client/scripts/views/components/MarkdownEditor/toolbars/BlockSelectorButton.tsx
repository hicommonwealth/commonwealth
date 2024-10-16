import { currentBlockType$, useCellValue } from 'commonwealth-mdxeditor';
import React, { useCallback } from 'react';
import { CWHeadingButton } from 'views/components/MarkdownEditor/toolbars/CWHeadingButton';
import { blockTypeToIconName } from 'views/components/MarkdownEditor/toolbars/blockTypeToIconName';
import CWPopover, {
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';
import './BlockSelectorButton.scss';

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
