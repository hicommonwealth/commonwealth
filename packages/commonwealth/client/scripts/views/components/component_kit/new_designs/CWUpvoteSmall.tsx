import React from 'react';

import { getClasses } from 'views/components/component_kit/helpers';
import { CWThreadAction } from 'views/components/component_kit/new_designs/cw_thread_action';
import CWPopover, {
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';

interface CWUpvoteSmallProps {
  voteCount: number;
  disabled: boolean;
  selected: boolean;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  popoverContent: JSX.Element;
  isThreadArchived?: boolean;
  tooltipText?: string;
}

const CWUpvoteSmall = ({
  voteCount,
  onClick,
  selected,
  disabled,
  popoverContent,
  tooltipText = '',
  isThreadArchived,
}: CWUpvoteSmallProps) => {
  const popoverProps = usePopover();
  const handleClick = (e) => {
    if (disabled) {
      return;
    }

    onClick?.(e);
  };

  return (
    <>
      <div
        className={getClasses<{ disabled?: boolean }>({ disabled })}
        onMouseEnter={popoverProps.handleInteraction}
        onMouseLeave={popoverProps.handleInteraction}
      >
        {voteCount > 0 && !disabled ? (
          <>
            <CWThreadAction
              action="upvote"
              isThreadArchived={isThreadArchived}
              selected={selected}
              label={String(voteCount)}
              disabled={disabled}
              onClick={handleClick}
            />
            <CWPopover body={popoverContent} {...popoverProps} />
          </>
        ) : (
          <CWThreadAction
            action="upvote"
            isThreadArchived={isThreadArchived}
            selected={selected}
            label={String(voteCount)}
            disabled={disabled}
            tooltipText={tooltipText}
            onClick={handleClick}
          />
        )}
      </div>
    </>
  );
};

export default CWUpvoteSmall;
