import React from 'react';

import 'components/component_kit/new_designs/CWUpvoteSmall.scss';
import { getClasses } from 'views/components/component_kit/helpers';
import { CWTooltip } from 'views/components/component_kit/cw_popover/cw_tooltip';
import { CWThreadAction } from 'views/components/component_kit/new_designs/cw_thread_action';

interface CWUpvoteSmallProps {
  voteCount: number;
  disabled: boolean;
  selected: boolean;
  onMouseEnter: () => void;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  tooltipContent: JSX.Element;
}

const CWUpvoteSmall = ({
  voteCount,
  onMouseEnter,
  onClick,
  selected,
  disabled,
  tooltipContent,
}: CWUpvoteSmallProps) => {
  return (
    <div
      className={getClasses<{ disabled?: boolean }>({ disabled })}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      {voteCount > 0 ? (
        <CWTooltip
          content={tooltipContent}
          renderTrigger={(handleInteraction) => (
            <div
              onMouseEnter={handleInteraction}
              onMouseLeave={handleInteraction}
            >
              <CWThreadAction
                action="upvote"
                selected={selected}
                label={String(voteCount)}
              />
            </div>
          )}
        />
      ) : (
        <>
          <CWThreadAction
            action="upvote"
            selected={selected}
            label={String(voteCount)}
          />
        </>
      )}
    </div>
  );
};

export default CWUpvoteSmall;
