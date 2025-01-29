import React, { useState } from 'react';
import { useInviteLinkModal } from 'state/ui/modals';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import {
  CWTab,
  CWTabsRow,
} from 'views/components/component_kit/new_designs/CWTabs';

import RewardsCard from '../../RewardsCard';
import Trend from '../Trend';

import './ReferralCard.scss';

enum ReferralTabs {
  Total = 'Total',
  XP = 'XP',
}

interface ReferralCardProps {
  onSeeAllClick: () => void;
  trendValue: number;
  totalEarnings: number;
  isLoading?: boolean;
}

const ReferralCard = ({
  onSeeAllClick,
  trendValue,
  totalEarnings,
  isLoading = false,
}: ReferralCardProps) => {
  const [currentTab, setCurrentTab] = useState<ReferralTabs>(
    ReferralTabs.Total,
  );
  const { setIsInviteLinkModalOpen } = useInviteLinkModal();

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
                ETH {totalEarnings}
              </CWText>
              {!isLoading && (trendValue || trendValue === 0) && (
                <Trend value={trendValue} />
              )}
            </div>
          )}
          {currentTab === ReferralTabs.XP && (
            <div className="xp-body">
              <CWText fontWeight="bold" type="h4">
                {123456} XP
              </CWText>
              {!isLoading && (trendValue || trendValue === 0) && (
                <Trend value={trendValue} />
              )}
            </div>
          )}
        </div>
        <div className="referral-card-footer">
          <CWButton
            onClick={() => setIsInviteLinkModalOpen(true)}
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
