import {
  ActionGroups,
  GatedActionEnum,
  getMustJoinGroupNames,
  UserFriendlyActionMap,
} from '@hicommonwealth/shared';
import { re_weburl } from 'lib/url-validation';
import { Link, LinkSource } from 'models/Thread';

// eslint-disable-next-line max-len

export function detectURL(str: string) {
  if (str.slice(0, 4) !== 'http') str = `http://${str}`; // no https required because this is only used for regex match
  return !!str.match(re_weburl);
}

export const filterLinks = (links: Link[] = [], source: LinkSource) => {
  return links?.filter((l) => l?.source === source);
};

export const getAddedAndDeleted = <T>(
  finalArr: T[],
  initialArr: T[],
  key: keyof T = 'id' as keyof T,
) => {
  const toAdd = finalArr.reduce((acc, curr) => {
    const wasSelected = initialArr.find((obj) => obj[key] === curr[key]);

    if (wasSelected) {
      return acc;
    }

    return [...acc, curr];
  }, []);

  const toDelete = initialArr.reduce((acc, curr) => {
    const isSelected = finalArr.find((obj) => obj[key] === curr[key]);

    if (isSelected) {
      return acc;
    }

    return [...acc, curr];
  }, []);

  return { toAdd, toDelete };
};

const getThreadActionTooltipText = ({
  action,
  isCommunityMember = false,
  isThreadArchived = false,
  isThreadLocked = false,
  gatingGroupNames,
  bypassGating,
}: {
  action: GatedActionEnum;
  isCommunityMember?: boolean;
  isThreadArchived?: boolean;
  isThreadLocked?: boolean;
  gatingGroupNames?: string[];
  bypassGating?: boolean;
}): string => {
  if (!isCommunityMember)
    return `Join community to ${UserFriendlyActionMap[action]}`;
  if (isThreadArchived) return 'Thread is archived';
  if (isThreadLocked) return 'Thread is locked';
  if (gatingGroupNames && !bypassGating) {
    if (!gatingGroupNames.length) return '';
    if (gatingGroupNames.length === 1) {
      return `Join ${gatingGroupNames[0]} to ${UserFriendlyActionMap[action]}`;
    } else if (gatingGroupNames.length === 2) {
      return `Join ${gatingGroupNames[0]} or ${gatingGroupNames[1]} to ${UserFriendlyActionMap[action]}`;
    } else {
      return `Join a group to unlock gated actions`;
    }
  }
  return '';
};

export type DisabledThreadActionToolTips = {
  disabledThreadReactionTooltipText: string;
  disabledCommentReactionTooltipText: string;
  disabledCommentTooltipText: string;
  disabledThreadCreateTooltipText: string;
  disabledPollVoteTooltipText: string;
};

export function getThreadActionToolTips({
  isCommunityMember = false,
  isThreadArchived = false,
  isThreadLocked = false,
  actionGroups,
  bypassGating,
}: {
  isCommunityMember?: boolean;
  isThreadArchived?: boolean;
  isThreadLocked?: boolean;
  actionGroups: ActionGroups;
  bypassGating?: boolean;
}): DisabledThreadActionToolTips {
  const disabledThreadReactionTooltipText = getThreadActionTooltipText({
    action: GatedActionEnum.CREATE_THREAD_REACTION,
    isCommunityMember,
    isThreadArchived,
    isThreadLocked,
    gatingGroupNames: getMustJoinGroupNames(
      actionGroups,
      GatedActionEnum.CREATE_THREAD_REACTION,
    ),
    bypassGating,
  });
  const disabledCommentReactionTooltipText = getThreadActionTooltipText({
    action: GatedActionEnum.CREATE_COMMENT_REACTION,
    isCommunityMember,
    isThreadArchived,
    isThreadLocked,
    gatingGroupNames: getMustJoinGroupNames(
      actionGroups,
      GatedActionEnum.CREATE_COMMENT_REACTION,
    ),
    bypassGating,
  });
  const disabledCommentTooltipText = getThreadActionTooltipText({
    action: GatedActionEnum.CREATE_COMMENT,
    isCommunityMember,
    isThreadArchived,
    isThreadLocked,
    gatingGroupNames: getMustJoinGroupNames(
      actionGroups,
      GatedActionEnum.CREATE_COMMENT,
    ),
    bypassGating,
  });
  const disabledThreadCreateTooltipText = getThreadActionTooltipText({
    action: GatedActionEnum.CREATE_THREAD,
    isCommunityMember,
    gatingGroupNames: getMustJoinGroupNames(
      actionGroups,
      GatedActionEnum.CREATE_THREAD,
    ),
    bypassGating,
  });
  const disabledPollVoteTooltipText = getThreadActionTooltipText({
    action: GatedActionEnum.UPDATE_POLL,
    isCommunityMember,
    isThreadArchived,
    isThreadLocked,
    gatingGroupNames: getMustJoinGroupNames(
      actionGroups,
      GatedActionEnum.UPDATE_POLL,
    ),
    bypassGating,
  });

  return {
    disabledThreadReactionTooltipText,
    disabledCommentReactionTooltipText,
    disabledCommentTooltipText,
    disabledThreadCreateTooltipText,
    disabledPollVoteTooltipText,
  };
}
