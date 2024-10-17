import ClickAwayListener from '@mui/base/ClickAwayListener';
import { IS_STRIKETHROUGH } from 'commonwealth-mdxeditor';
import React, { useCallback } from 'react';
import { CWFormatButton } from 'views/components/MarkdownEditor/toolbars/CWFormatButton';
import { CWListButton } from 'views/components/MarkdownEditor/toolbars/CWListButton';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import CWPopover, {
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';

import { CWInsertCodeBlockButton } from 'views/components/MarkdownEditor/toolbars/CWInsertCodeBlockButton';
import { CWTableButton } from 'views/components/MarkdownEditor/toolbars/CWTableButton';
import './MobileOverflowButton.scss';

type MobileOverflowButtonProps = Readonly<{
  focus: () => void;
}>;

export const MobileOverflowButton = (props: MobileOverflowButtonProps) => {
  const { focus } = props;
  const popoverProps = usePopover();

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
      popoverProps.handleInteraction(event);
      focus();
    },
    [focus, popoverProps],
  );

  const handleClickAway = useCallback(() => {
    popoverProps.dispose();
  }, [popoverProps]);

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <div className="MobileOverflowButton">
        <button onClick={handleClick}>
          <CWIcon iconName="dotsHorizontal" />
        </button>

        <CWPopover
          className="MobileOverflowButtonPopover"
          body={
            <div onMouseLeave={popoverProps.handleInteraction}>
              <CWFormatButton
                format={IS_STRIKETHROUGH}
                formatName="strikethrough"
              />
              <CWInsertCodeBlockButton />
              <CWListButton listType="check" onClick={handleClick} />
              <CWTableButton />
            </div>
          }
          {...popoverProps}
        />
      </div>
    </ClickAwayListener>
  );
};
