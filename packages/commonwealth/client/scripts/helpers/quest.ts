import {
  QuestActionMeta,
  QuestParticipationLimit,
  QuestParticipationPeriod,
  XpLogView,
} from '@hicommonwealth/schemas';
import moment from 'moment';
import { trpc } from 'utils/trpcClient';
import { z } from 'zod';
import { QuestAction as QuestActionType } from '../views/pages/CreateQuest/QuestForm/QuestActionSubForm/types';

export type QuestAction = z.infer<typeof QuestActionMeta>;
export type XPLog = z.infer<typeof XpLogView>;

export const doesActionRequireRewardShare = (action: QuestActionType) => {
  return (
    action === 'CommunityCreated' ||
    action === 'CommunityJoined' ||
    action === 'CommentUpvoted' ||
    action === 'SignUpFlowCompleted'
  );
};

export const doesActionRewardShareForReferrer = (action: QuestActionType) => {
  return (
    action === 'CommunityCreated' ||
    action === 'CommunityJoined' ||
    action === 'SignUpFlowCompleted'
  );
};

export const doesActionRewardShareForCreator = (action: QuestActionType) => {
  return action === 'CommentUpvoted';
};

export const doesActionAllowContentId = (action: QuestActionType) => {
  return (
    action === 'ThreadCreated' ||
    action === 'CommentCreated' ||
    action === 'CommentUpvoted' ||
    action === 'ThreadUpvoted' ||
    action === 'TweetEngagement' ||
    action === 'CommunityCreated' ||
    action === 'DiscordServerJoined' ||
    action === 'MembershipsRefreshed' ||
    action === 'LaunchpadTokenTraded' ||
    action === 'CommunityGoalReached'
  );
};

export const doesActionAllowThreadId = (action: QuestActionType) => {
  return action === 'CommentCreated' || action === 'ThreadUpvoted';
};

export const doesActionAllowCommentId = (action: QuestActionType) => {
  return action === 'CommentUpvoted';
};

export const doesActionAllowTopicId = (action: QuestActionType) => {
  return (
    action === 'ThreadCreated' ||
    action === 'CommentCreated' ||
    action === 'ThreadUpvoted'
  );
};

export const doesActionRequireTwitterTweetURL = (action: QuestActionType) => {
  return action === 'TweetEngagement';
};

export const doesActionRequireDiscordServerId = (action: QuestActionType) => {
  return action === 'DiscordServerJoined';
};

export const doesActionRequireChainEvent = (action: QuestActionType) => {
  return action === 'XpChainEventCreated';
};

export const doesActionAllowRepetition = (action: QuestActionType) => {
  return action !== 'TweetEngagement';
};

export const doesActionAllowChainId = (action: QuestActionType) => {
  return action === 'CommunityCreated';
};

export const doesActionRequireGroupId = (action: QuestActionType) => {
  return action === 'MembershipsRefreshed';
};

export const doesActionRequireStartLink = (action: QuestActionType) => {
  return action === 'DiscordServerJoined';
};

export const doesActionAllowTokenTradeThreshold = (action: QuestActionType) => {
  return action === 'LaunchpadTokenTraded';
};

export const doesActionRequireAmountMultipler = (action: QuestActionType) => {
  return action === 'LaunchpadTokenTraded';
};

export const doesActionRequireGoalConfig = (action: QuestActionType) => {
  return action === 'CommunityGoalReached';
};

export const doesActionRequireBasicRewardAmount = (action: QuestActionType) => {
  const commonQuests: QuestActionType[] = [
    'CommunityCreated',
    'CommunityJoined',
    'ThreadCreated',
    'ThreadUpvoted',
    'CommentCreated',
    'CommentUpvoted',
    'WalletLinked',
    'SSOLinked',
    'DiscordServerJoined',
    'MembershipsRefreshed',
    'LaunchpadTokenRecordCreated',
    'CommunityGoalReached',
  ];
  const channelQuest: QuestActionType[] = [
    'TweetEngagement',
    'XpChainEventCreated',
  ];

  return [...commonQuests, ...channelQuest].includes(action);
};

const convertTimeRemainingToLabel = ({
  days,
  hours,
  minutes,
  seconds,
}: {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}) => {
  if (Math.abs(days) > 0)
    return `${Math.abs(days)} day${Math.abs(days) > 1 ? 's' : ''}`;
  if (Math.abs(hours) > 0)
    return `${Math.abs(hours)} hour${Math.abs(hours) > 1 ? 's' : ''}`;
  if (Math.abs(minutes) > 0)
    return `${Math.abs(minutes)} minute${Math.abs(minutes) > 1 ? 's' : ''}`;
  if (Math.abs(seconds) > 0)
    return `${Math.abs(seconds)} second${Math.abs(seconds) > 1 ? 's' : ''}`;
  return ``;
};

export const calculateQuestTimelineLabel = ({
  startDate,
  endDate,
}: {
  startDate: Date;
  endDate: Date;
}) => {
  const isStarted = moment().isSameOrAfter(moment(startDate));
  const isEnded = moment().isSameOrAfter(moment(endDate));
  const startHoursRemaining = moment(startDate).diff(moment(), 'hours');
  const startDaysRemaining = moment(startDate).diff(moment(), 'days');
  const startMinutesRemaining = moment(startDate).diff(moment(), 'minutes');
  const startSecondsRemaining = moment(startDate).diff(moment(), 'seconds');
  const endHoursRemaining = moment(endDate).diff(moment(), 'hours');
  const endDaysRemaining = moment(endDate).diff(moment(), 'days');
  const endMinutesRemaining = moment(endDate).diff(moment(), 'minutes');
  const endYearsRemaining = moment(endDate).diff(moment(), 'years');
  const endSecondsRemaining = moment(endDate).diff(moment(), 'seconds');

  if (isEnded) {
    return `Ended
    ${moment(endDate).format('DD/MM/YYYY')}`;
  }

  if (endYearsRemaining > 10) {
    return `Ongoing`;
  }

  return `${isStarted ? 'Ends' : 'Starts'} in ${convertTimeRemainingToLabel({
    days: Math.abs(isStarted ? endDaysRemaining : startDaysRemaining),
    hours: Math.abs(isStarted ? endHoursRemaining : startHoursRemaining),
    minutes: Math.abs(isStarted ? endMinutesRemaining : startMinutesRemaining),
    seconds: Math.abs(isStarted ? endSecondsRemaining : startSecondsRemaining),
  })}`;
};

export const calculateTotalXPForQuestActions = ({
  isUserReferred,
  questStartDate,
  questEndDate,
  questActions,
}: {
  isUserReferred: boolean;
  questStartDate: Date;
  questEndDate: Date;
  questActions: QuestAction[];
}) => {
  const totalXpFixed =
    questActions
      ?.map((action) => {
        // calc reward per attempt with option creator share
        const userRewardPerAttempt = action.reward_amount;
        const creatorRewardPerAttempt =
          !isUserReferred && doesActionRewardShareForReferrer(action.event_name)
            ? 0
            : doesActionRequireRewardShare(action.event_name)
              ? action.creator_reward_weight * action.reward_amount
              : 0;
        const finalRewardPerAttempt =
          userRewardPerAttempt - creatorRewardPerAttempt;

        // calculate total sessions
        const { totalSessions, totalAttemptsPerSession } =
          getTotalRepititionCountsForQuestAction(
            questStartDate,
            questEndDate,
            action,
          );

        // calc final reward for action
        return finalRewardPerAttempt * totalAttemptsPerSession * totalSessions;
      })
      .reduce((accumulator, currentValue) => accumulator + currentValue, 0) ||
    0;
  const launchpadTokenTradedMultiplerAura =
    questActions?.find(
      (action) =>
        (action?.amount_multiplier || 0) > 0 &&
        action.event_name === 'LaunchpadTokenTraded',
    )?.amount_multiplier || 0;

  return { totalXpFixed, launchpadTokenTradedMultiplerAura };
};

export const getTotalRepititionCountsForQuestAction = (
  questStartDate: Date,
  questEndDate: Date,
  questAction: QuestAction,
) => {
  // calc repetition
  const isRepeateable =
    questAction.participation_limit === QuestParticipationLimit.OncePerPeriod;
  const isRepeateableDaily =
    questAction.participation_period === QuestParticipationPeriod.Daily;
  const isRepeateableWeekly =
    questAction.participation_period === QuestParticipationPeriod.Weekly;
  const isRepeateableMonthly =
    questAction.participation_period === QuestParticipationPeriod.Monthly;

  // calc total attempts per repetition
  const totalAttemptsPerSession = isRepeateable
    ? questAction.participation_times_per_period || 1
    : 1;

  // calc no of rewards that can be assigned per repetition schedule
  const startDate = moment(questStartDate);
  const endDate = moment(questEndDate);
  const noOfDays = endDate.diff(startDate, 'days') || 1;
  const noOfWeeks = Math.ceil(endDate.diff(startDate, 'weeks', true) || 1);
  const noOfMonths = Math.ceil(endDate.diff(startDate, 'months', true) || 1);
  const repititionSessions = isRepeateableDaily
    ? noOfDays
    : isRepeateableWeekly
      ? noOfWeeks
      : isRepeateableMonthly
        ? noOfMonths
        : 1;
  const totalSessions = isRepeateable ? repititionSessions : 1;

  return {
    totalAttemptsPerSession,
    totalSessions,
    totalRepititions: totalAttemptsPerSession * totalSessions,
  };
};

export const isQuestActionComplete = (
  questStartDate: Date,
  questEndDate: Date,
  questAction: QuestAction,
  xpLogs: XPLog[],
) => {
  // if action repeats, then its only labeled as completed if all the repeatitions are complete
  if (questAction.participation_limit === QuestParticipationLimit.OncePerQuest)
    return !!xpLogs.find((p) => p.action_meta_id === questAction.id);

  return (
    xpLogs.filter((p) => p.action_meta_id === questAction.id).length ===
    getTotalRepititionCountsForQuestAction(
      questStartDate,
      questEndDate,
      questAction,
    ).totalRepititions
  );
};

export const isQuestComplete = ({
  questStartDate,
  questEndDate,
  questActions,
  xpLogs,
}: {
  questStartDate: Date;
  questEndDate: Date;
  questActions: QuestAction[];
  xpLogs: XPLog[];
}) => {
  const isStarted = moment().isSameOrAfter(moment(questStartDate));
  const completedActionsCount = questActions
    .map((action) =>
      isQuestActionComplete(questStartDate, questEndDate, action, xpLogs),
    )
    .filter(Boolean).length;
  const isCompleted = completedActionsCount === questActions.length;
  isStarted;

  return isCompleted;
};

export const resetXPCacheForUser = (
  trpcUtils: ReturnType<typeof trpc.useUtils>,
) => {
  // reset xp cache after gaining xp
  trpcUtils.quest.getQuests.invalidate().catch(console.error);
  trpcUtils.user.getXps.invalidate().catch(console.error);
  trpcUtils.user.getXpsRanked.invalidate().catch(console.error);
};
