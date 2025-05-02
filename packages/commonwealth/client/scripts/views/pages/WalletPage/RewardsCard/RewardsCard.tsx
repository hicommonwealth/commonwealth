import clsx from 'clsx';
import React from 'react';

import { CWCard } from 'views/components/component_kit/cw_card';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { IconName } from 'views/components/component_kit/cw_icons/cw_icon_lookup';
import { CWText } from 'views/components/component_kit/cw_text';

import './RewardsCard.scss';

interface RewardsCardProps {
  title: string;
  description?: string;
  icon: IconName;
  onSeeAllClick?: () => void;
  isAlreadySelected?: boolean;
  customAction?: React.ReactNode;
  children?: React.ReactNode;
}

const RewardsCard = ({
  title,
  description,
  icon,
  onSeeAllClick,
  isAlreadySelected = false,
  customAction,
  children,
}: RewardsCardProps) => {
  return (
    <CWCard className="RewardsCard">
      <div className="rewards-card-header">
        <CWIcon iconName={icon} />
        <CWText type="h4" fontWeight="bold">
          {title}
        </CWText>
        {customAction ? (
          customAction
        ) : onSeeAllClick ? (
          <CWText
            className={clsx('see-all-text', { disabled: isAlreadySelected })}
            onClick={isAlreadySelected ? undefined : onSeeAllClick}
            type="b2"
          >
            See all
          </CWText>
        ) : null}
      </div>
      {description && (
        <CWText className="rewards-card-description" type="b2">
          {description}
        </CWText>
      )}
      <div className="rewards-card-body">{children}</div>
    </CWCard>
  );
};

export default RewardsCard;
