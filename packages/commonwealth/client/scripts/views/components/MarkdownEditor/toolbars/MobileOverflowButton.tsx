import ClickAwayListener from '@mui/base/ClickAwayListener';
import { IS_STRIKETHROUGH } from 'commonwealth-mdxeditor';
import React, { useCallback } from 'react';
import { FormatButton } from 'views/components/MarkdownEditor/toolbars/FormatButton';
import { ListButton } from 'views/components/MarkdownEditor/toolbars/ListButton';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import CWPopover, {
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';

import { InsertCodeBlockButton } from 'views/components/MarkdownEditor/toolbars/InsertCodeBlockButton';
import { TableButton } from 'views/components/MarkdownEditor/toolbars/TableButton';
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
              <FormatButton
                format={IS_STRIKETHROUGH}
                formatName="strikethrough"
              />
              <InsertCodeBlockButton />
              <ListButton listType="check" onClick={handleClick} />
              <TableButton />
            </div>
          }
          {...popoverProps}
        />
      </div>
    </ClickAwayListener>
  );
};
