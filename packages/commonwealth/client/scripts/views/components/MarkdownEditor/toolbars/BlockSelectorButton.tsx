import ClickAwayListener from '@mui/base/ClickAwayListener';
import { currentBlockType$, useCellValue } from 'commonwealth-mdxeditor';
import React, { useCallback } from 'react';
import { HeadingButton } from 'views/components/MarkdownEditor/toolbars/HeadingButton';
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

  const iconName = blockTypeToIconName(currentBlockType);

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <div className="BlockSelectorButton">
        <button onClick={handleClick}>
          {iconName && <CWIcon iconName={iconName} />}
          {!iconName && <PlaceholderIcon />}

          <CWIcon iconName="caretDown" iconSize="xs" />
        </button>

        <CWPopover
          className="FormattingPopover"
          body={
            <div onMouseLeave={popoverProps.handleInteraction}>
              <HeadingButton blockType="p" onClick={handleFormatButtonClick} />
              <HeadingButton blockType="h1" onClick={handleFormatButtonClick} />
              <HeadingButton blockType="h2" onClick={handleFormatButtonClick} />
              <HeadingButton blockType="h3" onClick={handleFormatButtonClick} />
              <HeadingButton
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
