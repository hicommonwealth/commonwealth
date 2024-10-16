import { currentBlockType$, useCellValue } from 'commonwealth-mdxeditor';
import React, { useCallback } from 'react';
import { CWHeadingButton } from 'views/components/MarkdownEditor/toolbars/CWHeadingButton';
import { blockTypeToIcon } from 'views/components/MarkdownEditor/toolbars/blockTypeToIcon';
import CWPopover, {
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';
import './BlockSelectorButton.scss';

type BlockSelectorButtonProps = Readonly<{
  focus: () => void;
}>;

export const BlockSelectorButton = (props: BlockSelectorButtonProps) => {
  const { focus } = props;

  const formattingPopoverProps = usePopover();

  const currentBlockType = useCellValue(currentBlockType$);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
      formattingPopoverProps.handleInteraction(event);
      focus();
    },
    [focus, formattingPopoverProps],
  );

  const handleFormatButtonClick = useCallback(
    (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
      formattingPopoverProps.handleInteraction(event);
    },
    [formattingPopoverProps],
  );

  return (
    <div className="BlockSelectorButton">
      <button onClick={handleClick}>{blockTypeToIcon(currentBlockType)}</button>

      <CWPopover
        className="FormattingPopover"
        body={
          <div onMouseLeave={formattingPopoverProps.handleInteraction}>
            <CWHeadingButton blockType="p" onClick={handleFormatButtonClick} />
            <CWHeadingButton blockType="h1" onClick={handleFormatButtonClick} />
            <CWHeadingButton blockType="h2" onClick={handleFormatButtonClick} />
            <CWHeadingButton blockType="h3" onClick={handleFormatButtonClick} />
            <CWHeadingButton
              blockType="quote"
              onClick={handleFormatButtonClick}
            />
          </div>
        }
        {...formattingPopoverProps}
      />
    </div>
  );
};
