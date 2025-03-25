import {
  QuestActionMeta,
  QuestParticipationLimit,
  QuestParticipationPeriod,
  XpLogView,
} from '@hicommonwealth/schemas';
import moment from 'moment';
import { z } from 'zod';
import { QuestAction as QuestActionType } from '../views/pages/CreateQuest/QuestForm/QuestActionSubForm/types';

export type QuestAction = z.infer<typeof QuestActionMeta>;
export type XPLog = z.infer<typeof XpLogView>;

export const doesActionRequireRewardShare = (action: QuestActionType) => {
  return (
    action === 'CommunityCreated' ||
    action === 'CommunityJoined' ||
    action === 'CommentUpvoted'
  );
};

export const doesActionRewardShareForReferrer = (action: QuestActionType) => {
  return action === 'CommunityCreated' || action === 'CommunityJoined';
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
    action === 'TweetEngagement'
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

export const doesActionAllowTwitterTweetURL = (action: QuestActionType) => {
  return action === 'TweetEngagement';
};

const convertTimeRemainingToLabel = ({
  days,
  hours,
  minutes,
}: {
  days: number;
  hours: number;
  minutes: number;
}) => {
  if (Math.abs(days) > 0)
    return `${Math.abs(days)} day${Math.abs(days) ? 's' : ''}`;
  if (Math.abs(hours) > 0)
    return `${Math.abs(hours)} hour${Math.abs(hours) ? 's' : ''}`;
  if (Math.abs(minutes) > 0)
    return `${Math.abs(minutes)} minute${Math.abs(minutes) ? 's' : ''}`;
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
  const endHoursRemaining = moment(endDate).diff(moment(), 'hours');
  const endDaysRemaining = moment(endDate).diff(moment(), 'days');
  const endMinutesRemaining = moment(endDate).diff(moment(), 'minutes');
  const endYearsRemaining = moment(endDate).diff(moment(), 'years');

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
  return (
    questActions
      ?.map((action) => {
        // calc repetition
        const isRepeateable =
          action.participation_limit === QuestParticipationLimit.OncePerPeriod;
        const isRepeateableDaily =
          action.participation_period === QuestParticipationPeriod.Daily;
        const isRepeateableWeekly =
          action.participation_period === QuestParticipationPeriod.Weekly;
        const isRepeateableMonthly =
          action.participation_period === QuestParticipationPeriod.Monthly;

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

        // calc total attempts per repetition
        const totalAttemptsPerSession = isRepeateable
          ? action.participation_times_per_period || 1
          : 1;

        // calc no of rewards that can be assigned per repetition schedule
        const startDate = moment(questStartDate);
        const endDate = moment(questEndDate);
        const noOfDays = endDate.diff(startDate, 'days') || 1;
        const noOfWeeks = Math.ceil(
          endDate.diff(startDate, 'weeks', true) || 1,
        );
        const noOfMonths = Math.ceil(
          endDate.diff(startDate, 'months', true) || 1,
        );
        const repititionSessions = isRepeateableDaily
          ? noOfDays
          : isRepeateableWeekly
            ? noOfWeeks
            : isRepeateableMonthly
              ? noOfMonths
              : 1;
        const totalSessions = isRepeateable ? repititionSessions : 1;

        // calc final reward for action
        return finalRewardPerAttempt * totalAttemptsPerSession * totalSessions;
      })
      .reduce((accumulator, currentValue) => accumulator + currentValue, 0) || 0
  );
};

export const isQuestActionComplete = (
  questAction: QuestAction,
  xpLogs: XPLog[],
) => {
  // if action repeats, then its only labeled as completed if all the repeatitions are complete
  return questAction.participation_limit ===
    QuestParticipationLimit.OncePerQuest
    ? !!xpLogs.find((p) => p.action_meta_id === questAction.id)
    : xpLogs.filter((p) => p.action_meta_id === questAction.id).length ===
        questAction.participation_times_per_period;
};
