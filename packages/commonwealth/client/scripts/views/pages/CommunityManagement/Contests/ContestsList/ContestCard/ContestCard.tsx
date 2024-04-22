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
  id: number;
  name: string;
  imageUrl?: string;
  finishDate: string;
  topics: string[];
  payouts: number[];
  isAdmin: boolean;
  isActive: boolean;
}

const ContestCard = ({
  id,
  name,
  imageUrl,
  finishDate,
  topics,
  payouts,
  isAdmin,
  isActive,
}: ContestCardProps) => {
  const navigate = useCommonNavigate();

  const handleCancelContest = () => {
    // TODO open warning modal
    console.log('Cancel contest');
  };

  const handleEditContest = () => {
    navigate(`/manage/contests/${id}`);
  };

  const handleLeaderboardClick = () => {
    // TODO open threads view with proper filter
    // navigate('/discussions');
  };

  const handleWinnersClick = () => {
    // TODO open threads view with proper filter
    // navigate('/discussions');
  };

  const handleShareClick = () => {
    navigate('/manage/contests');
  };

  const handleFundClick = () => {
    // TODO open funding drawer
    console.log('open funding drawer');
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
        <CWText className="topics">Topics: {topics.join(', ')}</CWText>
        <CWText className="prizes-header" fontWeight="bold">
          Current Prizes
        </CWText>
        <div className="prizes">
          {payouts.map((payout, index) => (
            <div className="prize-row" key={index}>
              <CWText className="label">
                {moment.localeData().ordinal(index + 1)} Prize
              </CWText>
              <CWText fontWeight="bold">{payout} ETH</CWText>
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
          <CWThreadAction
            label="Fund"
            action="fund"
            onClick={handleFundClick}
          />
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
