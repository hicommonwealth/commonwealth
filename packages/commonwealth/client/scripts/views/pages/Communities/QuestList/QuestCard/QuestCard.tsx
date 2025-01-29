import clsx from 'clsx';
import { calculateQuestTimelineLabel } from 'helpers/quest';
import React, { ReactNode } from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import './QuestCard.scss';

interface QuestCardProps {
  name: string;
  description: string;
  iconURL: string;
  xpPoints: number;
  startDate: Date;
  endDate: Date;
  className?: string;
  onCTAClick?: () => void;
  onLeaderboardClick?: () => void;
  onCardBodyClick?: () => void;
}

const MAX_CHARS_FOR_LABELS = 14;
const MAX_CHARS_FOR_DESCRIPTIONS = 24;

const QuestCard = ({
  name,
  description,
  iconURL,
  xpPoints,
  startDate,
  endDate,
  className,
  onCardBodyClick,
  onLeaderboardClick,
  onCTAClick,
}: QuestCardProps) => {
  const handleBodyClick = (e: React.MouseEvent) =>
    e.target === e.currentTarget && onCardBodyClick?.();

  const isNameTrimmed = name.length > MAX_CHARS_FOR_LABELS;
  const trimmedName = isNameTrimmed
    ? name.slice(0, MAX_CHARS_FOR_LABELS) + '...'
    : name;
  const isDescriptionTrimmed = description.length > MAX_CHARS_FOR_DESCRIPTIONS;
  const trimmedDescription = isDescriptionTrimmed
    ? description.slice(0, MAX_CHARS_FOR_DESCRIPTIONS) + '...'
    : description;

  const withOptionalTooltip = (
    children: ReactNode,
    content: string,
    shouldDisplay,
  ) => {
    if (!shouldDisplay) return children;

    return (
      <CWTooltip
        placement="bottom"
        content={content}
        renderTrigger={(handleInteraction) => (
          <span
            onMouseEnter={handleInteraction}
            onMouseLeave={handleInteraction}
          >
            {children}
          </span>
        )}
      />
    );
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={clsx('QuestCard', className)}
      onClick={handleBodyClick}
    >
      <img src={iconURL} className="image" onClick={handleBodyClick} />
      <div className="content">
        <div className="basic-info" onClick={handleBodyClick}>
          {withOptionalTooltip(
            <CWText className="text-dark" type="h4" fontWeight="regular">
              {trimmedName}
            </CWText>,
            name,
            isNameTrimmed,
          )}
          {withOptionalTooltip(
            <CWText className="text-light">{trimmedDescription}</CWText>,
            description,
            isDescriptionTrimmed,
          )}
        </div>
        {/* time label */}
        <CWText className="time-label" type="b1" fontWeight="semiBold">
          {calculateQuestTimelineLabel({ startDate, endDate })}
        </CWText>
        {/* ends on row */}
        <div className="xp-row">
          <CWTag type="proposal" label={`${xpPoints} XP`} />
          <CWButton
            iconLeft="upvote"
            label="Leaderboard"
            onClick={onLeaderboardClick}
            containerClassName="leaderboard-btn"
            buttonWidth="narrow"
            buttonType="secondary"
            buttonHeight="sm"
          />
        </div>
        {/* action cta */}
        <CWButton
          label="See Details"
          containerClassName="action-btn"
          buttonWidth="full"
          buttonType="secondary"
          buttonAlt="green"
          onClick={() => onCTAClick?.()}
        />
      </div>
    </div>
  );
};

export default QuestCard;
