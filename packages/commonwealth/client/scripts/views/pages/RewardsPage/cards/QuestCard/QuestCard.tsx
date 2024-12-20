import React from 'react';

import RewardsCard from '../../RewardsCard';

import './QuestCard.scss';

interface QuestCardProps {
  onSeeAllClick: () => void;
}

const QuestCard = ({ onSeeAllClick }: QuestCardProps) => {
  return (
    <RewardsCard
      title="Quests"
      description="XP and tokens earned from your contests, bounties, and posted threads"
      icon="trophy"
      onSeeAllClick={onSeeAllClick}
    >
      <div className="QuestCard">Quest Card Body</div>
    </RewardsCard>
  );
};

export default QuestCard;
