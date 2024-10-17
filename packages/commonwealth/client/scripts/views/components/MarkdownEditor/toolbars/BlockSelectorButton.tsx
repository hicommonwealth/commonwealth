import ClickAwayListener from '@mui/base/ClickAwayListener';
import { currentBlockType$, useCellValue } from 'commonwealth-mdxeditor';
import React, { useCallback } from 'react';
import { CWHeadingButton } from 'views/components/MarkdownEditor/toolbars/CWHeadingButton';
import { PlaceholderIcon } from 'views/components/MarkdownEditor/toolbars/PlaceholderIcon';
import { blockTypeToIconName } from 'views/components/MarkdownEditor/toolbars/blockTypeToIconName';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import CWPopover, {
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';
import './BlockSelectorButton.scss';

type BlockSelectorButtonProps = Readonly<{
  focus: () => void;
}>;

export const BlockSelectorButton = (props: BlockSelectorButtonProps) => {
  const { focus } = props;

  const popoverProps = usePopover();

  const currentBlockType = useCellValue(currentBlockType$);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
      popoverProps.handleInteraction(event);
      focus();
    },
    [focus, popoverProps],
  );

  const handleFormatButtonClick = useCallback(
    (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
      popoverProps.handleInteraction(event);
    },
    [popoverProps],
  );

  const handleClickAway = useCallback(() => {
    popoverProps.dispose();
  }, [popoverProps]);

  // FIXME what about list items that don't have an icon when you place the
  // cursor in the wrong block. No icon will be picked.  This happens for list
  // items.

  const iconName = blockTypeToIconName(currentBlockType);

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <div className="BlockSelectorButton">
        <button onClick={handleClick}>
          <div style={{ display: 'flex' }}>
            {iconName && <CWIcon iconName={iconName} />}
            {!iconName && <PlaceholderIcon />}
            <CWIcon iconName="caretDown" iconSize="xs" />
          </div>
        </button>

        <CWPopover
          className="FormattingPopover"
          body={
            <div onMouseLeave={popoverProps.handleInteraction}>
              <CWHeadingButton
                blockType="p"
                onClick={handleFormatButtonClick}
              />
              <CWHeadingButton
                blockType="h1"
                onClick={handleFormatButtonClick}
              />
              <CWHeadingButton
                blockType="h2"
                onClick={handleFormatButtonClick}
              />
              <CWHeadingButton
                blockType="h3"
                onClick={handleFormatButtonClick}
              />
              <CWHeadingButton
                blockType="quote"
                onClick={handleFormatButtonClick}
              />
            </div>
          }
          {...popoverProps}
        />
      </div>
    </ClickAwayListener>
  );
};
