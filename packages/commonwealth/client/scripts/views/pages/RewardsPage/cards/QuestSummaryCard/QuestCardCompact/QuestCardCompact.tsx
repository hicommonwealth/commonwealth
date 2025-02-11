import clsx from 'clsx';
import React from 'react';
import CWCountDownTimer from 'views/components/component_kit/CWCountDownTimer';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { withTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import './QuestCardCompact.scss';

type QuestCardCompactProps = {
  name: string;
  communityIdOrIsGlobal: true | string;
  imageURL: string;
  endDate: string;
  isActive: boolean;
  onCTAClick: () => void;
};

const QuestCardCompact = ({
  communityIdOrIsGlobal,
  imageURL,
  endDate,
  name,
  isActive,
  onCTAClick,
}: QuestCardCompactProps) => {
  const MAX_CHARS_FOR_LABELS = isActive ? 12 : 8;

  const isNameTrimmed = name.length > MAX_CHARS_FOR_LABELS;
  const trimmedName = isNameTrimmed
    ? name.slice(0, MAX_CHARS_FOR_LABELS) + '...'
    : name;

  return (
    <div
      role="button"
      className={clsx('QuestCardCompact', isActive ? 'active' : 'ended')}
    >
      <div className="left">
        <img src={imageURL} className="image" />
        <div className="metdata">
          {withTooltip(
            <CWText type="h5" fontWeight="bold">
              {trimmedName}
            </CWText>,
            name,
            isNameTrimmed,
          )}
          <CWText type="caption">
            {typeof communityIdOrIsGlobal === 'string'
              ? `by ${communityIdOrIsGlobal}`
              : `Global`}
          </CWText>
          <CWCountDownTimer
            className="count-down"
            finishTime={endDate}
            isActive={isActive}
            labelPostfix={isActive ? 'left' : ''}
          />
        </div>
      </div>
      <CWButton
        buttonHeight="sm"
        buttonWidth="narrow"
        label={isActive ? 'Go' : 'Details'}
        onClick={onCTAClick}
      />
    </div>
  );
};

export default QuestCardCompact;
