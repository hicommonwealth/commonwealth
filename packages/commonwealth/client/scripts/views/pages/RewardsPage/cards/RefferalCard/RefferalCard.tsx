import React from 'react';

import RewardsCard from '../../RewardsCard';

import './RefferalCard.scss';

interface RefferalCardProps {
  onSeeAllClick: () => void;
}

const RefferalCard = ({ onSeeAllClick }: RefferalCardProps) => {
  return (
    <RewardsCard
      title="Referrals"
      description="Track your referral rewards"
      icon="userSwitch"
      onSeeAllClick={onSeeAllClick}
    >
      <div className="RefferalCard">Referral Card Body</div>
    </RewardsCard>
  );
};

export default RefferalCard;
