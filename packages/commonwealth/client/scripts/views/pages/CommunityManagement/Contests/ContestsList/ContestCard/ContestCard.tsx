import moment from 'moment';
import React from 'react';

import useUserActiveAccount from 'hooks/useUserActiveAccount';
import { useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import useCancelContestMutation from 'state/api/contests/cancelContest';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWThreadAction } from 'views/components/component_kit/new_designs/cw_thread_action';
import { SharePopover } from 'views/components/share_popover';
import { openConfirmation } from 'views/modals/confirmation_modal';

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
  const { activeAccount: hasJoinedCommunity } = useUserActiveAccount();

  const { mutateAsync: cancelContest } = useCancelContestMutation();

  const handleCancel = () => {
    cancelContest({
      contest_address: address,
      id: app.activeChainId(),
    }).catch((error) => {
      console.error('Failed to cancel contest: ', error);
    });
  };

  const handleCancelContest = () => {
    openConfirmation({
      title: 'You are about to end your contest',
      description:
        'Are you sure you want to cancel your contest? You cannot restart a contest once it has ended.',
      buttons: [
        {
          label: 'Keep contest',
          buttonType: 'secondary',
          buttonHeight: 'sm',
        },
        {
          label: 'Cancel contest',
          buttonType: 'destructive',
          buttonHeight: 'sm',
          onClick: handleCancel,
        },
      ],
    });
  };

  const handleEditContest = () => {
    navigate(`/manage/contests/${address}`);
  };

  const handleLeaderboardClick = () => {
    navigate(`/discussions?featured=mostLikes&contest=${name}`);
  };

  const handleWinnersClick = () => {
    navigate(`/discussions?contest=${name}`);
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
          {winners?.map((winner, index) => (
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

          <SharePopover
            customUrl="/contests"
            renderTrigger={(handleInteraction) => (
              <CWThreadAction
                action="share"
                label="Share"
                onClick={handleInteraction}
              />
            )}
          />

          {isActive && hasJoinedCommunity && (
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
