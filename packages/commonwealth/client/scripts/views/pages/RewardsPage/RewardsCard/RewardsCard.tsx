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
  children?: React.ReactNode;
}

const RewardsCard = ({
  title,
  description,
  icon,
  onSeeAllClick,
  children,
}: RewardsCardProps) => {
  return (
    <CWCard className="RewardsCard">
      <div className="rewards-card-header">
        <CWIcon iconName={icon} />
        <CWText type="h4" fontWeight="bold">
          {title}
        </CWText>
        {onSeeAllClick && (
          <CWText className="see-all-text" onClick={onSeeAllClick} type="b2">
            See all
          </CWText>
        )}
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
