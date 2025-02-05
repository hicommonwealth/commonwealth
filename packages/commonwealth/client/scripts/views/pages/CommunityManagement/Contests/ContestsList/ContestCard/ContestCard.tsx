import clsx from 'clsx';
import moment from 'moment';
import React from 'react';

import farcasterUrl from 'assets/img/farcaster.svg';
import useBrowserWindow from 'hooks/useBrowserWindow';
import useRerender from 'hooks/useRerender';
import { useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import { useGetContestBalanceQuery } from 'state/api/contests';
import useCancelContestMutation from 'state/api/contests/cancelContest';
import useUserStore from 'state/ui/user';
import { Skeleton } from 'views/components/Skeleton';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { IconName } from 'views/components/component_kit/cw_icons/cw_icon_lookup';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { CWThreadAction } from 'views/components/component_kit/new_designs/cw_thread_action';
import { SharePopoverOld } from 'views/components/share_popover_old';
import { openConfirmation } from 'views/modals/confirmation_modal';

import { ContestType } from '../../types';
import { copyFarcasterContestFrameUrl, isContestActive } from '../../utils';
import ContestAlert from '../ContestAlert';

import { buildContestPrizes } from '@hicommonwealth/shared';
import CWCountDownTimer from 'views/components/component_kit/CWCountDownTimer';
import './ContestCard.scss';

const noFundsProps = {
  title: 'There are no funds for this contest',
  iconName: 'coins' as IconName,
};

interface ContestCardProps {
  address: string;
  name: string;
  imageUrl?: string;
  finishDate: string;
  topics: { id?: number; name?: string }[];
  decimals?: number;
  ticker?: string;
  isAdmin: boolean;
  isCancelled?: boolean;
  onFund?: () => void;
  isRecurring: boolean;
  showShareButton?: boolean;
  showLeaderboardButton?: boolean;
  isHorizontal?: boolean;
  isFarcaster?: boolean;
  payoutStructure?: number[];
  score?: {
    creator_address?: string;
    content_id?: string;
    votes?: number;
    prize?: string;
    tickerPrize?: number;
  }[];
}

const ContestCard = ({
  address,
  name,
  imageUrl,
  finishDate,
  topics,
  decimals,
  ticker,
  isAdmin,
  isCancelled,
  onFund,
  isRecurring,
  showShareButton = true,
  showLeaderboardButton = true,
  isHorizontal = false,
  isFarcaster = false,
  payoutStructure,
  score = [],
}: ContestCardProps) => {
  const navigate = useCommonNavigate();
  const user = useUserStore();

  const { mutateAsync: cancelContest } = useCancelContestMutation();

  const isActive = isContestActive({
    contest: {
      cancelled: isCancelled,
      contests: [{ end_time: new Date(finishDate) }],
    },
  });

  useRerender({ isActive, interval: 6000 });

  const { isWindowMediumSmallInclusive } = useBrowserWindow({});

  const { data: contestBalance, isLoading: isLoadingContestBalance } =
    useGetContestBalanceQuery({
      contestAddress: address,
      chainRpc: app.chain.meta?.ChainNode?.url || '',
      ethChainId: app.chain.meta?.ChainNode?.eth_chain_id || 0,
      isOneOff: !isRecurring,
    });

  const prizes = buildContestPrizes(
    Number(contestBalance),
    payoutStructure,
    decimals,
  );

  const handleCancel = () => {
    cancelContest({
      contest_address: address,
      community_id: app.activeChainId() || '',
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
    navigate(
      `/manage/contests/${address}${
        isFarcaster ? `?type=${ContestType.Farcaster}` : ''
      }`,
    );
  };

  const handleLeaderboardClick = () => {
    isFarcaster
      ? navigate(`/contests/${address}`)
      : navigate(`/discussions?featured=mostLikes&contest=${address}`);
  };

  const handleFundClick = () => {
    onFund?.();
  };

  const handleFarcasterClick = () => {
    copyFarcasterContestFrameUrl(address).catch(console.log);
  };

  const showNoFundsInfo =
    isActive && !isLoadingContestBalance && (contestBalance || 0) <= 0;

  const isLessThan24HoursLeft =
    moment(finishDate).diff(moment(), 'hours') <= 24;

  const hasVotes = score.length > 0;
  const hasLessVotesThanPrizes = (payoutStructure || []).length > score.length;

  const showNoUpvotesWarning =
    isActive &&
    isAdmin &&
    isLessThan24HoursLeft &&
    (contestBalance || 0) > 0 &&
    (!hasVotes || hasLessVotesThanPrizes);

  return (
    <CWCard
      className={clsx('ContestCard', {
        isHorizontal: isHorizontal && !isWindowMediumSmallInclusive,
      })}
    >
      {imageUrl && (
        <>
          {isHorizontal && isActive && (
            <CWTag
              label="Active Contest"
              type="contest"
              classNames="active-contest-tag prize-1"
            />
          )}
          <img src={imageUrl} alt="contest-image" className="contest-image" />
        </>
      )}
      <div className="contest-body">
        <div className="header-row">
          <CWText type="h3">{name}</CWText>
          {finishDate ? (
            <CWCountDownTimer finishTime={finishDate} isActive={isActive} />
          ) : isActive ? (
            <Skeleton width="70px" />
          ) : null}
        </div>
        {!isFarcaster && (
          <CWText className="topics">
            Topic: {topics.map(({ name: topicName }) => topicName).join(', ')}
          </CWText>
        )}

        <>
          {showNoFundsInfo ? (
            <ContestAlert
              {...noFundsProps}
              description={
                isRecurring
                  ? 'Purchase Community Stake to fund this contest'
                  : 'Fund this contest to display prizes'
              }
            />
          ) : (
            <>
              {showNoUpvotesWarning && (
                <ContestAlert
                  title="Upvote contests to avoid return of funds"
                  iconName="warning"
                  description={
                    !hasVotes
                      ? "The prize amount will be returned to Common and then to admin's wallet if there are no upvotes"
                      : hasLessVotesThanPrizes
                        ? `You have ${payoutStructure?.length} prizes but only ${score.length} thread upvotes.
                        Upvote more threads to avoid return of funds.
                        The prize amount will be returned to Common and then to admin's wallet if there are no upvotes`
                        : ''
                  }
                />
              )}
              <CWText className="prizes-header" fontWeight="bold">
                Current Prizes
              </CWText>
              <div className="prizes">
                {prizes ? (
                  prizes?.map((prize, index) => (
                    <div className="prize-row" key={index}>
                      <CWText className="label">
                        {moment.localeData().ordinal(index + 1)} Prize
                      </CWText>
                      <CWText fontWeight="bold">
                        {prize} {ticker}
                      </CWText>
                    </div>
                  ))
                ) : (
                  <CWText>No prizes available</CWText>
                )}
              </div>
            </>
          )}
        </>
        <div className="actions">
          {showLeaderboardButton && (
            <CWThreadAction
              label="Leaderboard"
              action="leaderboard"
              onClick={handleLeaderboardClick}
            />
          )}

          {showShareButton && (
            <SharePopoverOld
              customUrl="/contests"
              renderTrigger={(handleInteraction) => (
                <CWThreadAction
                  action="share"
                  label="Share"
                  onClick={handleInteraction}
                />
              )}
            />
          )}

          {onFund && isActive && user.activeAccount && (
            <CWThreadAction
              label="Fund"
              action="fund"
              onClick={handleFundClick}
            />
          )}
        </div>

        {isFarcaster && (
          <button
            className={clsx('farcaster-cta', { disabled: !isActive })}
            onClick={handleFarcasterClick}
            disabled={!isActive}
          >
            <img src={farcasterUrl} alt="farcaster" />
            <CWText type="h5" fontWeight="bold">
              Copy Farcaster Frame
            </CWText>
          </button>
        )}
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
