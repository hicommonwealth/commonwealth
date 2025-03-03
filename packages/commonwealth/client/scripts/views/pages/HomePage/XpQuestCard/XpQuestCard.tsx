import commonLogo from 'assets/img/branding/common.svg';
import clsx from 'clsx';
import React, { ReactNode } from 'react';
import CWCountDownTimer from 'views/components/component_kit/CWCountDownTimer';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import './XpQuestCard.scss';

interface QuestCardProps {
  name: string;
  community_id?: string | undefined | null;
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

const QuestCard = ({
  name,
  iconURL,
  xpPoints,
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
        <div className="heading">
          <img src={commonLogo} alt="icon" className="info-icon" />
          <div className="basic-info" onClick={handleBodyClick}>
            {withOptionalTooltip(
              <CWText className="text-dark" type="h4" fontWeight="regular">
                {trimmedName}
              </CWText>,
              name,
              isNameTrimmed,
            )}
          </div>
          <CWCountDownTimer finishTime={endDate.toISOString()} isActive />
        </div>

        <CWDivider />
        <CWText type="h5" fontWeight="semiBold">
          Quest Rewards
        </CWText>

        <div className="quest-list">
          <div className="quest">
            <CWText fontWeight="medium">Complete All Tasks</CWText>
            <CWText fontWeight="medium">{xpPoints} XP</CWText>
          </div>
        </div>

        <div className="xp-row">
          <CWButton
            label="Leaderboard"
            onClick={onLeaderboardClick}
            buttonWidth="full"
            buttonType="secondary"
            buttonHeight="sm"
          />
          <CWButton
            label="Go to Quest"
            buttonWidth="full"
            buttonType="primary"
            buttonHeight="sm"
            onClick={() => onCTAClick?.()}
          />
        </div>
      </div>
    </div>
  );
};

export default QuestCard;
