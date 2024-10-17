import React, { useCallback } from 'react';
import CWPopover, {
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';

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

  const handleFormatButtonClick = useCallback(
    (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
      popoverProps.handleInteraction(event);
    },
    [popoverProps],
  );

  return (
    <div className="BlockSelectorButton">
      {/*<button onClick={handleClick}>{blockTypeToIcon(currentBlockType)}</button>*/}

      <CWPopover
        className="FormattingPopover"
        body={<div onMouseLeave={popoverProps.handleInteraction}></div>}
        {...popoverProps}
      />
    </div>
  );
};
