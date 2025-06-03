import { QuestParticipationLimit } from '@hicommonwealth/schemas';
import clsx from 'clsx';
import {
  getTotalRepititionCountsForQuestAction,
  QuestAction,
} from 'helpers/quest';
import React from 'react';
import { fetchCachedNodes } from 'state/api/nodes';
import { useGetGoalMetasQuery } from 'state/api/superAdmin';
import useUserStore from 'state/ui/user';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleRingSpinner from 'views/components/component_kit/new_designs/CWCircleRingSpinner';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import { withTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import { actionCopies } from './helpers';
import './QuestActionCard.scss';
import QuestActionXpShares from './QuestActionXPShares';
import TotalQuestActionXPTag from './TotalQuestActionXPTag';

type QuestActionCardProps = {
  isActionCompleted?: boolean;
  onActionStart: (action: QuestAction) => void;
  actionNumber: number;
  questAction: QuestAction;
  isActionInEligible?: boolean;
  xpLogsForActions?: { id: number; createdAt: Date }[];
  inEligibilityReason?: string;
  canStartAction?: boolean;
  actionStartBlockedReason?: string;
  questStartDate: Date;
  questEndDate: Date;
};

const QuestActionCard = ({
  actionNumber,
  isActionInEligible,
  isActionCompleted,
  xpLogsForActions,
  onActionStart,
  actionStartBlockedReason,
  canStartAction,
  inEligibilityReason,
  questAction,
  questStartDate,
  questEndDate,
}: QuestActionCardProps) => {
  const user = useUserStore();

  const { data: goalMetas } = useGetGoalMetasQuery({
    apiEnabled: questAction.event_name === 'CommunityGoalReached',
  });
  const foundGoalsMetaMeta = goalMetas?.find(
    (m) =>
      m.id ===
      parseInt((questAction?.content_id || '')?.split(':').at(-1) || ''),
  );

  // Function to determine the button label based on quest action type
  const getButtonLabel = () => {
    const hasDiscordLinked = user.addresses?.some(
      (address) => address.walletSsoSource === 'discord',
    );

    const hasTwitterLinked = user.addresses?.some(
      (address) => address.walletSsoSource === 'twitter',
    );

    if (questAction.event_name === 'DiscordServerJoined' && !hasDiscordLinked) {
      return 'Connect Discord & Start';
    }

    if (questAction.event_name === 'TweetEngagement' && !hasTwitterLinked) {
      return 'Connect Twitter & Start';
    }

    return 'Start';
  };

  const isRepeatableQuest =
    questAction?.participation_limit === QuestParticipationLimit.OncePerPeriod;
  const questRepeatitionCycle = questAction?.participation_period;
  const questParticipationLimitPerCycle =
    questAction?.participation_times_per_period || 0;
  const totalActionRepititions = getTotalRepititionCountsForQuestAction(
    questStartDate,
    questEndDate,
    questAction,
  ).totalRepititions;
  const attemptsLeft = totalActionRepititions - (xpLogsForActions || []).length;

  return (
    <div className="QuestActionCard">
      {isRepeatableQuest && (
        <div className="header">
          <CWText type="monospace2">
            - Repeats
            {questParticipationLimitPerCycle === 1
              ? ` `
              : ` ${questParticipationLimitPerCycle} time${questParticipationLimitPerCycle > 1 ? 's ' : ''}`}
            {questRepeatitionCycle} -
          </CWText>
        </div>
      )}
      <div
        className={clsx(
          'content-container',
          isRepeatableQuest && 'isRepeatableQuest',
        )}
      >
        <div className="counter">
          <CWText type="b1" fontWeight="semiBold">
            #{actionNumber}
          </CWText>
        </div>
        <div className="content">
          <div className="left">
            <CWText type="b1" fontWeight="semiBold">
              {actionCopies.title[questAction.event_name]}
            </CWText>
            {[
              'TweetEngagement',
              'DiscordServerJoined',
              'CommunityCreated',
              'LaunchpadTokenTraded',
              'XpChainEventCreated',
              'CommunityGoalReached',
              'KyoFinanceSwapQuestVerified',
              'KyoFinanceLpQuestVerified',
            ].includes(questAction.event_name) && (
              <>
                {questAction.event_name === 'CommunityCreated' &&
                !questAction.content_id ? (
                  <></>
                ) : (
                  <CWDivider />
                )}
                {actionCopies.pre_reqs?.[questAction.event_name]?.() && (
                  <CWText type="caption" fontWeight="semiBold">
                    {actionCopies.pre_reqs[questAction.event_name]()}
                  </CWText>
                )}
                {questAction.event_name === 'TweetEngagement' && (
                  <CWText type="caption">
                    {actionCopies.explainer[questAction.event_name](
                      questAction?.QuestTweet?.like_cap || 0,
                      questAction?.QuestTweet?.retweet_cap || 0,
                      questAction?.QuestTweet?.replies_cap || 0,
                    )}
                  </CWText>
                )}
                {questAction.event_name === 'CommunityCreated' &&
                  questAction.content_id && (
                    <CWText type="caption">
                      {actionCopies.explainer[questAction.event_name](
                        fetchCachedNodes()?.find?.(
                          (node) =>
                            `${questAction.content_id?.split(`:`)?.at(-1)}` ===
                            `${node.id}`,
                        )?.name,
                      )}
                    </CWText>
                  )}
                {questAction.event_name === 'LaunchpadTokenTraded' && (
                  <CWText type="caption">
                    {actionCopies.explainer[questAction.event_name](
                      questAction.amount_multiplier || 0,
                      `${questAction?.content_id?.split(':').at(-1) || ''}`,
                    )}
                  </CWText>
                )}
                {questAction.event_name === 'XpChainEventCreated' && (
                  <CWText type="caption">
                    {actionCopies.explainer[questAction.event_name](
                      questAction?.ChainEventXpSource?.contract_address || '',
                      questAction?.ChainEventXpSource?.ChainNode
                        ?.eth_chain_id || '',
                    )}
                  </CWText>
                )}
                {questAction.event_name === 'CommunityGoalReached' && (
                  <CWText type="caption">
                    {actionCopies.explainer[questAction.event_name](
                      foundGoalsMetaMeta?.type || (
                        <CWCircleRingSpinner size="small" />
                      ),
                      foundGoalsMetaMeta?.target || <></>,
                    )}
                  </CWText>
                )}
                {questAction.event_name === 'KyoFinanceSwapQuestVerified' && (
                  <CWText type="caption">
                    {actionCopies.explainer[questAction.event_name](
                      questAction.metadata.chainId,
                      // TODO: 11963 - malik - Should make input/output tokens optional? else display here?
                      questAction.metadata.minOutputAmount || '',
                      questAction.metadata.minVolumeUSD || '',
                    )}
                  </CWText>
                )}
                {questAction.event_name === 'KyoFinanceLpQuestVerified' && (
                  <CWText type="caption">
                    {actionCopies.explainer[questAction.event_name](
                      questAction.metadata.chainId,
                      questAction.metadata.poolAddresses,
                      questAction.metadata.minUSDValues,
                    )}
                  </CWText>
                )}
              </>
            )}
            <QuestActionXpShares questAction={questAction} />
            <div className="points-row">
              <TotalQuestActionXPTag questAction={questAction} />
              {isRepeatableQuest &&
                attemptsLeft !== 0 &&
                attemptsLeft !== totalActionRepititions && (
                  <CWTag
                    type="group"
                    label={`${attemptsLeft}x attempt${attemptsLeft > 1 ? 's' : ''} left`}
                  />
                )}
              {questAction.instructions_link && (
                <a
                  target="_blank"
                  href={questAction.instructions_link}
                  rel="noreferrer"
                  className="action-link"
                >
                  Instructions{' '}
                  <CWIcon
                    iconName="externalLink"
                    iconSize="small"
                    weight="bold"
                  />
                </a>
              )}
            </div>
          </div>
          <div className="right">
            {isActionInEligible ? (
              withTooltip(
                <CWTag label="Not eligible" type="address" />,
                inEligibilityReason || '',
                isActionInEligible,
              )
            ) : isActionCompleted ? (
              <CWTag label="Completed" type="address" />
            ) : (
              withTooltip(
                <CWButton
                  buttonType="secondary"
                  buttonAlt="green"
                  label={getButtonLabel()}
                  buttonHeight="sm"
                  buttonWidth="narrow"
                  iconRight="arrowRightPhosphor"
                  onClick={() => onActionStart(questAction)}
                  disabled={!canStartAction}
                />,
                actionStartBlockedReason || '',
                !canStartAction,
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestActionCard;
