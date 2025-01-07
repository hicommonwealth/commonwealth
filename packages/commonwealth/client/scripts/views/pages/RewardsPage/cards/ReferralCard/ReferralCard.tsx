import React, { useState } from 'react';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import {
  CWTab,
  CWTabsRow,
} from 'views/components/component_kit/new_designs/CWTabs';

import RewardsCard from '../../RewardsCard';

import clsx from 'clsx';
import './ReferralCard.scss';

enum ReferralTabs {
  Total = 'Total',
  XP = 'XP',
}

interface ReferralCardProps {
  onSeeAllClick: () => void;
}

const ReferralCard = ({ onSeeAllClick }: ReferralCardProps) => {
  const [currentTab, setCurrentTab] = useState<ReferralTabs>(
    ReferralTabs.Total,
  );

  const trendValue = 1;

  return (
    <RewardsCard
      title="Referrals"
      description="Track your referral rewards"
      icon="userSwitch"
      onSeeAllClick={onSeeAllClick}
    >
      <div className="ReferralCard">
        <CWTabsRow>
          {Object.values(ReferralTabs).map((tab) => (
            <CWTab
              key={tab}
              label={tab}
              isSelected={currentTab === tab}
              onClick={() => setCurrentTab(tab)}
            />
          ))}
        </CWTabsRow>
        <div className="referral-card-body">
          {currentTab === ReferralTabs.Total && (
            <div className="total-body">
              <CWText fontWeight="bold" type="h4">
                ${(1234.56).toLocaleString()}
              </CWText>
              {(trendValue || trendValue === 0) && (
                <div
                  className={clsx('trend', {
                    'trend-up': trendValue > 0,
                    'trend-down': trendValue < 0,
                  })}
                >
                  <CWIcon
                    iconName="triangle"
                    weight="fill"
                    className="trend-icon"
                    iconSize="small"
                  />
                  <CWText type="b2" fontWeight="medium" className="percentage">
                    {trendValue}%
                  </CWText>
                  <CWText type="b2" className="from-last-month">
                    from last month
                  </CWText>
                </div>
              )}
            </div>
          )}
          {currentTab === ReferralTabs.XP && (
            <div className="xp-body">
              <CWText fontWeight="bold" type="h4">
                {123456} XP
              </CWText>
              {(trendValue || trendValue === 0) && (
                <div
                  className={clsx('trend', {
                    'trend-up': trendValue > 0,
                    'trend-down': trendValue < 0,
                  })}
                >
                  <CWIcon
                    iconName="triangle"
                    weight="fill"
                    className="trend-icon"
                    iconSize="small"
                  />
                  <CWText type="b2" fontWeight="medium" className="percentage">
                    {trendValue}%
                  </CWText>
                  <CWText type="b2" className="from-last-month">
                    from last month
                  </CWText>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="referral-card-footer">
          <CWButton
            onClick={onSeeAllClick}
            buttonWidth="full"
            label="Share Referral Link"
            buttonHeight="sm"
          />
        </div>
      </div>
    </RewardsCard>
  );
};

export default ReferralCard;
