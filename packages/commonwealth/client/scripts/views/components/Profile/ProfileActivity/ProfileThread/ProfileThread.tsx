import React from 'react';

import { slugify } from '@hicommonwealth/shared';
import { ThreadCard } from 'client/scripts/views/pages/discussions/ThreadCard';
import useTopicGating from 'hooks/useTopicGating';
import { getProposalUrlPath } from 'identifiers';
import { Thread } from 'models/Thread';
import { useCommonNavigate } from 'navigation/helpers';
import { useFetchCustomDomainQuery } from 'state/api/configuration';
import useUserStore from 'state/ui/user';
import './ProfileThread.scss';

type ProfileThreadProps = {
  thread: Thread;
};

export const ProfileThread = ({ thread }: ProfileThreadProps) => {
  const navigate = useCommonNavigate();
  const user = useUserStore();
  const { data: domain } = useFetchCustomDomainQuery();

  const discussionLink = getProposalUrlPath(
    thread?.slug,
    `${thread?.identifier}-${slugify(thread.title)}`,
    false,
    thread?.communityId,
  );

  const account = user.addresses?.find(
    (a) => a?.community?.id === thread?.communityId,
  );

  const { actionGroups, bypassGating } = useTopicGating({
    communityId: thread.communityId,
    userAddress: account?.address || '',
    apiEnabled: !!account?.address && !!thread.communityId,
    topicId: thread?.topic?.id || 0,
  });

  return (
    <div className="ProfileThread">
      <ThreadCard
        thread={thread}
        canUpdateThread={false} // we don't want user to update thread from here, even if they have permissions
        onStageTagClick={() => {
          navigate(
            `${
              domain?.isCustomDomain ? '' : `/${thread.communityId}`
            }/discussions?stage=${thread.stage}`,
          );
        }}
        threadHref={discussionLink}
        onCommentBtnClick={() =>
          navigate(`${discussionLink}?focusComments=true`)
        }
        hideReactionButton={true}
        hideUpvotesDrawer
        layoutType="community-first"
        maxChars={100}
        actionGroups={actionGroups}
        bypassGating={bypassGating}
      />
    </div>
  );
};
