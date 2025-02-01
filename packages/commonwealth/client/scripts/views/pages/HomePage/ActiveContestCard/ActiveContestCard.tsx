import moment from 'moment';
import React, { ReactNode } from 'react';

import { navigateToCommunity, useCommonNavigate } from 'navigation/helpers';
import { useGetContestBalanceQuery } from 'state/api/contests';
import { Skeleton } from 'views/components/Skeleton';

import { CWCommunityAvatar } from 'client/scripts/views/components/component_kit/cw_community_avatar';
import { CWDivider } from 'client/scripts/views/components/component_kit/cw_divider';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import { CWTooltip } from 'client/scripts/views/components/component_kit/new_designs/CWTooltip';
import { capDecimals } from 'client/scripts/views/modals/ManageCommunityStakeModal/utils';
import { Contest } from '../../CommunityManagement/Contests/ContestsList';
import ContestCountdown from '../../CommunityManagement/Contests/ContestsList/ContestCountdown';
import './ActiveContestCard.scss';

export type ActiveContest = Omit<Contest, 'name'> & { name: string };

interface ActiveContestCardProps {
  contest: ActiveContest;
  community: {
    name: string;
    iconUrl: string;
    chainNodeUrl: string;
    ethChainId: number;
  };
}

const MAX_CHARS_FOR_LABELS = 14;

const ActiveContestCard = ({ contest, community }: ActiveContestCardProps) => {
  const navigate = useCommonNavigate();
  const finishDate = moment(contest.contests?.[0].end_time).toISOString();

  const { name } = contest;
  const isNameTrimmed = name.length > MAX_CHARS_FOR_LABELS;
  const trimmedName = isNameTrimmed
    ? name.slice(0, MAX_CHARS_FOR_LABELS) + '...'
    : name;

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

  const prizes =
    contestBalance && contest.payout_structure
      ? contest.payout_structure.map(
          (percentage) =>
            (contestBalance * (percentage / 100)) /
            Math.pow(10, contest.decimals || 18),
        )
      : [];

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

  const withOptionalTooltip = (
    children: ReactNode,
    content: string,
    shouldDisplay,
  ) => {
    if (!shouldDisplay) return children;

    return (
      <CWTooltip
        placement="bottom"
        content={content}
        renderTrigger={(handleInteraction) => (
          <span
            onMouseEnter={handleInteraction}
            onMouseLeave={handleInteraction}
          >
            {children}
          </span>
        )}
      />
    );
  };

  return (
    <div className="ActiveContestCard">
      <div className="contest-banner">
        <img
          src={contest.image_url}
          alt="Contest banner"
          className="banner-image"
        />
      </div>

      <div className="contest-content">
        <div className="heading">
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
          <div className="basic-info" onClick={() => {}}>
            {withOptionalTooltip(
              <CWText className="text-dark" type="h4" fontWeight="regular">
                {trimmedName}
              </CWText>,
              name,
              isNameTrimmed,
            )}
          </div>
          <ContestCountdown finishTime={finishDate} isActive />
        </div>

        <CWDivider />
        <CWText type="h5" fontWeight="semiBold">
          Current Prizes
        </CWText>

        <div className="prize-list">
          <div>
            {isContestBalanceLoading ? (
              <>
                <Skeleton width="100%" height="20px" />
                <Skeleton width="100%" height="20px" />
                <Skeleton width="100%" height="20px" />
              </>
            ) : prizes.length > 0 ? (
              prizes?.map((prize, index) => (
                <div key={index} className="prize">
                  <CWText fontWeight="medium">
                    {moment.localeData().ordinal(index + 1)} Prize
                  </CWText>
                  <CWText fontWeight="medium">
                    {capDecimals(String(prize))} {contest.ticker}
                  </CWText>
                </div>
              ))
            ) : (
              <CWText type="b2">No prizes available</CWText>
            )}
          </div>
        </div>

        <div className="contest-row">
          <CWButton
            label="Leaderboard"
            onClick={handleLeaderboardClick}
            buttonWidth="full"
            buttonType="secondary"
            buttonHeight="sm"
          />
          <CWButton
            label="Go to Contest"
            buttonWidth="full"
            buttonType="primary"
            buttonHeight="sm"
            onClick={handleGoToContest}
          />
        </div>
      </div>
    </div>
  );
};

export default ActiveContestCard;
