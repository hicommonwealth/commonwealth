import React from 'react';

import 'components/component_kit/new_designs/CWUpvoteSmall.scss';
import { getClasses } from 'views/components/component_kit/helpers';
import { CWTooltip } from 'views/components/component_kit/cw_popover/cw_tooltip';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';

interface CWUpvoteSmallProps {
  voteCount: number;
  disabled: boolean;
  selected: boolean;
  onMouseEnter: () => void;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
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
    <button
      className={getClasses<{ disabled?: boolean }>(
        { disabled },
        `CWUpvoteSmall ${selected ? ' has-reacted' : ''}`
      )}
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
              className="btn-container"
            >
              <CWIcon
                iconName="upvote"
                iconSize="small"
                {...(selected && { weight: 'fill' })}
              />
              <div
                className={`reactions-count ${selected ? ' has-reacted' : ''}`}
              >
                {voteCount}
              </div>
            </div>
          )}
        />
      ) : (
        <>
          <CWIcon iconName="upvote" iconSize="small" />
          <div className={`reactions-count ${selected ? ' has-reacted' : ''}`}>
            {voteCount}
          </div>
        </>
      )}
    </button>
  );
};

export default CWUpvoteSmall;
