import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';

import './CastVoteSection.scss';

export type CastVoteProps = {
  disableVoteButton: boolean;
  timeRemaining: string;
  tooltipErrorMessage: string;
  onVoteCast: (selectedOption?: string, isSelected?: boolean) => void;
  isRevoting?: boolean;
};

export const CastVoteSection = ({
  disableVoteButton,
  onVoteCast,
  timeRemaining,
  tooltipErrorMessage,
  isRevoting = false,
}: CastVoteProps) => {
  const buttonLabel = isRevoting ? 'Update Vote' : 'Vote';

  return (
    <div className="CastVoteSection">
      {disableVoteButton ? (
        <CWTooltip
          placement="top"
          content={tooltipErrorMessage ?? 'Select an option to vote.'}
          renderTrigger={(handleInteraction) => (
            <div
              onMouseEnter={handleInteraction}
              onMouseLeave={handleInteraction}
            >
              <CWButton
                label={buttonLabel}
                buttonType="primary"
                buttonHeight="sm"
                disabled={disableVoteButton}
                onClick={() => onVoteCast()}
              />
            </div>
          )}
        />
      ) : (
        <CWButton
          label={buttonLabel}
          buttonType="primary"
          buttonHeight="sm"
          disabled={disableVoteButton}
          onClick={() => onVoteCast()}
        />
      )}
      <CWText className="time-remaining-text" type="caption">
        {timeRemaining}
      </CWText>
    </div>
  );
};
