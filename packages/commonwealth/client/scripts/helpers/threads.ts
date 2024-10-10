import { GroupTopicPermissionEnum } from '@hicommonwealth/schemas';
import { re_weburl } from 'lib/url-validation';
import { Link, LinkSource } from 'models/Thread';
import { TOPIC_PERMISSIONS } from '../views/pages/CommunityGroupsAndMembers/Groups/common/GroupForm/constants';

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

type ThreadTooltipTextActions = 'upvote' | 'comment' | 'reply' | 'submit';

export type GetThreadActionTooltipTextResponse =
  | string
  | ((action: ThreadTooltipTextActions) => string);

const getActionTooltipForNonCommunityMember = (
  action: ThreadTooltipTextActions,
) => {
  return `Join community to ${action}`;
};

export const getThreadActionTooltipText = ({
  isCommunityMember = false,
  isThreadArchived = false,
  isThreadLocked = false,
  isThreadTopicGated = false,
  threadTopicInteractionRestriction,
}: {
  isCommunityMember?: boolean;
  isThreadArchived?: boolean;
  isThreadLocked?: boolean;
  isThreadTopicGated?: boolean;
  threadTopicInteractionRestriction?: GroupTopicPermissionEnum;
}): GetThreadActionTooltipTextResponse => {
  if (!isCommunityMember) {
    return getActionTooltipForNonCommunityMember;
  }
  if (isThreadArchived) return 'Thread is archived';
  if (isThreadLocked) return 'Thread is locked';
  if (isThreadTopicGated) return 'Topic is gated';
  if (threadTopicInteractionRestriction) {
    return `Topic members are only allowed to ${TOPIC_PERMISSIONS[threadTopicInteractionRestriction]}`;
  }
  return '';
};
