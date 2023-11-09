import React from 'react';

import { CWTooltip } from 'views/components/component_kit/cw_popover/cw_tooltip';
import { getClasses } from 'views/components/component_kit/helpers';
import { CWThreadAction } from 'views/components/component_kit/new_designs/cw_thread_action';

interface CWUpvoteSmallProps {
  voteCount: number;
  disabled: boolean;
  selected: boolean;
  onMouseEnter: () => void;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  tooltipContent: JSX.Element;
  isThreadArchived?: boolean;
  tooltipText?: string;
}

const CWUpvoteSmall = ({
  voteCount,
  onMouseEnter,
  onClick,
  selected,
  disabled,
  tooltipContent,
  tooltipText = '',
  isThreadArchived,
}: CWUpvoteSmallProps) => {
  const handleClick = (e) => {
    if (disabled) {
      return;
    }

    onClick?.(e);
  };

  return (
    <div
      className={getClasses<{ disabled?: boolean }>({ disabled })}
      onMouseEnter={onMouseEnter}
      onClick={handleClick}
    >
      {voteCount > 0 && !disabled ? (
        // TODO swap it to be popover instead of tooltip
        <CWTooltip
          content={tooltipContent}
          renderTrigger={(handleInteraction) => (
            <div
              onMouseEnter={handleInteraction}
              onMouseLeave={handleInteraction}
            >
              <CWThreadAction
                action="upvote"
                isThreadArchived={isThreadArchived}
                selected={selected}
                label={String(voteCount)}
                disabled={disabled}
              />
            </div>
          )}
        />
      ) : (
        <>
          <CWThreadAction
            action="upvote"
            isThreadArchived={isThreadArchived}
            selected={selected}
            label={String(voteCount)}
            disabled={disabled}
            tooltipText={tooltipText}
          />
        </>
      )}
    </div>
  );
};

export default CWUpvoteSmall;
