import React from 'react';

import RewardsCard from '../../RewardsCard';

import './ReferralCard.scss';

interface ReferralCardProps {
  onSeeAllClick: () => void;
}

const ReferralCard = ({ onSeeAllClick }: ReferralCardProps) => {
  return (
    <RewardsCard
      title="Referrals"
      description="Track your referral rewards"
      icon="userSwitch"
      onSeeAllClick={onSeeAllClick}
    >
      <div className="ReferralCard">Referral Card Body</div>
    </RewardsCard>
  );
};

export default ReferralCard;
