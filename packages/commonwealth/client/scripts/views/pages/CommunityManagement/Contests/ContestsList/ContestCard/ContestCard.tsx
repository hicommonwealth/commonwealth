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
import { capDecimals } from 'views/modals/ManageCommunityStakeModal/utils';
import { openConfirmation } from 'views/modals/confirmation_modal';

import { isContestActive } from '../../utils';
import ContestAlert from '../ContestAlert';
import ContestCountdown from '../ContestCountdown';

import './ContestCard.scss';

const noFundsProps = {
  title: 'There are no funds for this contest',
  iconName: 'coins' as IconName,
};

const noUpvotesProps = {
  title: 'There are no upvotes on this contest',
  description: 'Upvote contest entries to display prizes',
  iconName: 'upvote' as IconName,
};

interface ContestCardProps {
  address: string;
  name: string;
  imageUrl?: string;
  finishDate: string;
  topics: { id?: number; name?: string }[];
  score?:
    | {
        creator_address?: string;
        content_id?: string;
        votes?: number;
        prize?: string;
        tickerPrize?: number;
      }[]
    | null;
  decimals?: number;
  ticker?: string;
  isAdmin: boolean;
  isCancelled?: boolean;
  onFund?: () => void;
  feeManagerBalance?: string;
  isRecurring: boolean;
  showShareButton?: boolean;
  showLeaderboardButton?: boolean;
  isHorizontal?: boolean;
  isFarcaster?: boolean;
}

const ContestCard = ({
  address,
  name,
  imageUrl,
  finishDate,
  topics,
  score,
  decimals,
  ticker,
  isAdmin,
  isCancelled,
  onFund,
  feeManagerBalance,
  isRecurring,
  showShareButton = true,
  showLeaderboardButton = true,
  isHorizontal = false,
  isFarcaster = false,
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

  const { data: oneOffContestBalance } = useGetContestBalanceQuery({
    contestAddress: address,
    chainRpc: app.chain.meta?.ChainNode?.url || '',
    ethChainId: app.chain.meta?.ChainNode?.eth_chain_id || 0,
    apiEnabled: !isRecurring,
    isOneOff: !isRecurring,
  });

  const handleCancel = () => {
    cancelContest({
      contest_address: address,
      id: app.activeChainId() || '',
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
    isFarcaster
      ? navigate(`/contests/${address}`)
      : navigate(`/discussions?featured=mostLikes&contest=${address}`);
  };

  const handleFundClick = () => {
    onFund?.();
  };

  const handleFarcasterClick = () => {
    console.log('Frame copied!');
  };

  const balance = isRecurring
    ? feeManagerBalance
    : String(oneOffContestBalance);

  const showNoFundsInfo = isActive && parseFloat(balance!) <= 0;
  const showNoUpvotesInfo = isActive && (!score || score.length === 0);

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
            <ContestCountdown finishTime={finishDate} isActive={isActive} />
          ) : (
            <Skeleton width="70px" />
          )}
        </div>
        <CWText className="topics">
          Topic: {topics.map(({ name: topicName }) => topicName).join(', ')}
        </CWText>

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
          ) : showNoUpvotesInfo ? (
            <ContestAlert {...noUpvotesProps} />
          ) : (
            <>
              <CWText className="prizes-header" fontWeight="bold">
                Current Prizes
              </CWText>
              <div className="prizes">
                {score ? (
                  score?.map((s, index) => (
                    <div className="prize-row" key={s.content_id}>
                      <CWText className="label">
                        {moment.localeData().ordinal(index + 1)} Prize
                      </CWText>
                      <CWText fontWeight="bold">
                        {capDecimals(
                          s.tickerPrize
                            ? s.tickerPrize?.toFixed(decimals || 18)
                            : '',
                        )}
                        {ticker}
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
          <button className="farcaster-cta" onClick={handleFarcasterClick}>
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
