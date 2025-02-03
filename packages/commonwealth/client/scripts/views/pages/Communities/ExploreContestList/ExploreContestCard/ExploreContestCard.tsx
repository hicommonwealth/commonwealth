import clsx from 'clsx';
import moment from 'moment';
import React from 'react';

import commonLogo from 'assets/img/branding/common.svg';
import farcasterUrl from 'assets/img/farcaster.svg';
import { navigateToCommunity, useCommonNavigate } from 'navigation/helpers';
import { useGetContestBalanceQuery } from 'state/api/contests';
import { Skeleton } from 'views/components/Skeleton';
import { CWCommunityAvatar } from 'views/components/component_kit/cw_community_avatar';

import { CWText } from '../../../../components/component_kit/cw_text';
import { CWButton } from '../../../../components/component_kit/new_designs/CWButton/CWButton';
import { CWThreadAction } from '../../../../components/component_kit/new_designs/cw_thread_action';
import { Contest } from '../../../CommunityManagement/Contests/ContestsList';
import ContestCountdown from '../../../CommunityManagement/Contests/ContestsList/ContestCountdown';

import { buildContestPrizes } from '@hicommonwealth/shared';
import './ExploreContestCard.scss';

interface ExploreContestCardProps {
  contest: Contest;
  community: {
    name: string;
    iconUrl: string;
    chainNodeUrl: string;
    ethChainId: number;
  };
}

const ExploreContestCard = ({
  contest,
  community,
}: ExploreContestCardProps) => {
  const navigate = useCommonNavigate();
  const finishDate = moment(contest.contests?.[0].end_time).toISOString();

  const { data: contestBalance, isLoading: isContestBalanceLoading } =
    useGetContestBalanceQuery({
      contestAddress: contest.contest_address || '',
      chainRpc: community.chainNodeUrl,
      ethChainId: community.ethChainId,
      isOneOff: !!contest.funding_token_address,
      apiEnabled: Boolean(
        contest.contest_address &&
          community.chainNodeUrl &&
          community.ethChainId,
      ),
    });

  const prizes = buildContestPrizes(
    Number(contestBalance),
    contest.payout_structure,
    contest.decimals,
  );

  const handleGoToContest = () => {
    const path = contest.is_farcaster_contest
      ? `/contests/${contest.contest_address}`
      : `/discussions/${contest.topics?.[0]?.name}`;

    navigateToCommunity({
      navigate,
      path,
      chain: contest.community_id || '',
    });
  };

  const handleLeaderboardClick = () => {
    const path = contest.is_farcaster_contest
      ? `/contests/${contest.contest_address}`
      : `/discussions?featured=mostLikes&contest=${contest.contest_address}`;

    navigateToCommunity({
      navigate,
      path,
      chain: contest.community_id || '',
    });
  };

  if (!isContestBalanceLoading && (!prizes || prizes.length === 0)) {
    return null;
  }

  return (
    <div className="ExploreContestCard">
      <div className="contest-banner">
        <img
          src={contest.image_url}
          alt="Contest banner"
          className="banner-image"
        />
      </div>

      <div className="contest-content">
        <div className="contest-header">
          <CWCommunityAvatar
            onClick={() => {
              navigateToCommunity({
                navigate,
                path: '',
                chain: contest.community_id || '',
              });
            }}
            community={{
              name: community.name,
              iconUrl: community.iconUrl,
            }}
          />

          <CWText type="h3" fontWeight="medium" className="contest-title">
            {contest.name}
            <div className="contest-icon-container">
              <img
                className={clsx(
                  'contest-icon',
                  !contest.is_farcaster_contest && 'common-icon',
                )}
                src={contest.is_farcaster_contest ? farcasterUrl : commonLogo}
              />
            </div>
          </CWText>
        </div>

        <div className="contest-timing">
          <ContestCountdown finishTime={finishDate} isActive />
        </div>

        <div className="prizes-section">
          <CWText type="b2" fontWeight="medium">
            Current Prizes
          </CWText>
          <div className="prize-list">
            {isContestBalanceLoading ? (
              <>
                <Skeleton width="100%" height="20px" />
                <Skeleton width="100%" height="20px" />
                <Skeleton width="100%" height="20px" />
              </>
            ) : prizes.length > 0 ? (
              prizes?.map((prize, index) => (
                <div className="prize-row" key={index}>
                  <CWText className="label">
                    {moment.localeData().ordinal(index + 1)} Prize
                  </CWText>
                  <CWText fontWeight="bold">
                    {prize} {contest.ticker}
                  </CWText>
                </div>
              ))
            ) : (
              <CWText type="b2">No prizes available</CWText>
            )}
          </div>
        </div>

        <div className="contest-actions">
          <CWThreadAction
            action="leaderboard"
            label="Leaderboard"
            onClick={handleLeaderboardClick}
          />
        </div>

        <div className="cta-button-container">
          <CWButton
            buttonHeight="sm"
            buttonWidth="full"
            label="Go to contest"
            buttonType="secondary"
            buttonAlt="green"
            className="cta-button"
            onClick={handleGoToContest}
          />
        </div>
      </div>
    </div>
  );
};

export default ExploreContestCard;
