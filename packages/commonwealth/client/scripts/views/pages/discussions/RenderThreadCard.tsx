import {
  ActionGroups,
  MIN_CHARS_TO_SHOW_MORE,
  slugify,
} from '@hicommonwealth/shared';
import { extractImages } from 'client/scripts/helpers/feed';
import { getThreadActionToolTips } from 'client/scripts/helpers/threads';
import { getProposalUrlPath } from 'client/scripts/identifiers';
import Thread from 'client/scripts/models/Thread';
import useUserStore from 'client/scripts/state/ui/user';
import { getScopePrefix, useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { Contest } from 'views/pages/CommunityManagement/Contests/ContestsList';
import { checkIsTopicInContest } from '../../components/NewThreadFormLegacy/helpers';
import { ThreadCard } from './ThreadCard';

type contestsData = {
  all: Contest[];
  finished: Contest[];
  active: Contest[];
};
export type RenderThreadCardProps = {
  thread: Thread;
  isCardView?: boolean;
  hideThreadOptions?: boolean;
  hidePublishDate?: boolean;
  hideTrendingTag?: boolean;
  hideSpamTag?: boolean;
  communityId: string;
  actionGroups: ActionGroups;
  bypassGating: boolean;
  contestsData: contestsData;
};

export const RenderThreadCard = ({
  thread,
  isCardView,
  hidePublishDate,
  hideSpamTag,
  hideTrendingTag,
  communityId,
  actionGroups,
  bypassGating,
  contestsData,
}: RenderThreadCardProps) => {
  const navigate = useCommonNavigate();
  const user = useUserStore();

  const discussionLink = getProposalUrlPath(
    thread.slug,
    `${thread.identifier}-${slugify(thread.title)}`,
  );

  const disabledThreadActionToolTips = getThreadActionToolTips({
    isCommunityMember: !!user.activeAccount,
    isThreadArchived: !!thread?.archivedAt,
    isThreadLocked: !!thread?.lockedAt,
    actionGroups,
    bypassGating,
  });

  const isThreadTopicInContest = checkIsTopicInContest(
    contestsData?.all,
    thread?.topic?.id,
  );

  const images = isCardView && extractImages(thread?.body);

  return (
    <ThreadCard
      key={thread?.id + '-' + thread.readOnly}
      thread={thread}
      onEditStart={() => navigate(`${discussionLink}?isEdit=true`)}
      onStageTagClick={() => {
        navigate(`/discussions?stage=${thread.stage}`);
      }}
      threadHref={`${getScopePrefix()}${discussionLink}`}
      onBodyClick={() => {
        const scrollEle = document.getElementsByClassName('Body')[0];
        localStorage[`${communityId}-discussions-scrollY`] =
          scrollEle.scrollTop;
      }}
      onCommentBtnClick={() => navigate(`${discussionLink}?focusComments=true`)}
      disabledThreadActionToolTips={disabledThreadActionToolTips}
      hideRecentComments
      editingDisabled={isThreadTopicInContest}
      threadImage={images && isCardView && images.length ? images[0] : null}
      isCardView={isCardView}
      hidePublishDate={hidePublishDate}
      hideTrendingTag={hideTrendingTag}
      hideSpamTag={hideSpamTag}
      cutoffLines={6}
      maxChars={MIN_CHARS_TO_SHOW_MORE}
    />
  );
};
