import React from 'react';

import { CWCard } from 'views/components/component_kit/cw_card';

import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWThreadAction } from 'views/components/component_kit/new_designs/cw_thread_action';

import ContestCountdown from '../ContestCountdown';

import './ContestCard.scss';

interface ContestCardProps {
  address: string;
  name: string;
  imageUrl?: string;
  finishDate: string;
  topics: { id?: number; name?: string }[];
  winners: { prize?: number; creator_address?: string }[];
  isAdmin: boolean;
  isActive: boolean;
  onFund: () => void;
}

const ContestCard = ({
  address,
  name,
  imageUrl,
  finishDate,
  topics,
  winners,
  isAdmin,
  isActive,
  onFund,
}: ContestCardProps) => {
  const navigate = useCommonNavigate();

  const handleCancelContest = () => {
    // TODO open warning modal
    console.log('Cancel contest');
  };

  const handleEditContest = () => {
    navigate(`/manage/contests/${address}`);
  };

  const handleLeaderboardClick = () => {
    // Leaderboard Button takes user to the Thread Listing Page, filtered by Contest + sorted by Upvote.
    // TODO open threads view with proper filter
    // navigate('/discussions');
    console.log('navigate to discussions');
  };

  const handleWinnersClick = () => {
    // Previous Winners button takes user to the Thread Listing Page, filtered by Contest.
    // TODO open threads view with proper filter
    // navigate('/discussions');
    console.log('navigate to discussions');
  };

  const handleShareClick = () => {
    // TODO open share popover
  };

  const handleFundClick = () => {
    onFund();
  };

  return (
    <CWCard className="ContestCard">
      {imageUrl && (
        <img src={imageUrl} alt="contest-image" className="contest-image" />
      )}
      <div className="contest-body">
        <div className="header-row">
          <CWText type="h3">{name}</CWText>
          <ContestCountdown finishTime={finishDate} isActive={isActive} />
        </div>
        <CWText className="topics">
          Topics: {topics.map(({ name: topicName }) => topicName).join(', ')}
        </CWText>
        <CWText className="prizes-header" fontWeight="bold">
          Current Prizes
        </CWText>
        <div className="prizes">
          {winners.map((winner, index) => (
            <div className="prize-row" key={winner.creator_address}>
              <CWText className="label">
                {moment.localeData().ordinal(index + 1)} Prize
              </CWText>
              <CWText fontWeight="bold">{winner.prize} ETH</CWText>
            </div>
          ))}
        </div>
        <div className="actions">
          <CWThreadAction
            label="Leaderboard"
            action="leaderboard"
            onClick={handleLeaderboardClick}
          />
          <CWThreadAction
            label="Winners"
            action="winners"
            onClick={handleWinnersClick}
          />
          <CWThreadAction
            label="Share"
            action="share"
            onClick={handleShareClick}
          />
          {isActive && (
            <CWThreadAction
              label="Fund"
              action="fund"
              onClick={handleFundClick}
            />
          )}
        </div>
      </div>
      {isAdmin && (
        <div className="contest-footer">
          <CWDivider />
          <div className="buttons">
            <CWButton
              containerClassName="cta-btn"
              label="Cancel contest"
              buttonType="destructive"
              onClick={handleCancelContest}
              disabled={!isActive}
            />
            <CWButton
              containerClassName="cta-btn"
              label="Edit contest"
              onClick={handleEditContest}
              disabled={!isActive}
            />
          </div>
        </div>
      )}
    </CWCard>
  );
};

export default ContestCard;
