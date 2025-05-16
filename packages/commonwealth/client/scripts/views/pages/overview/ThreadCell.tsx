import { ActionGroups, GatedActionEnum, slugify } from '@hicommonwealth/shared';
import { pluralize } from 'client/scripts/helpers';
import { extractImages } from 'client/scripts/helpers/feed';
import { getProposalUrlPath } from 'client/scripts/identifiers';
import Thread from 'client/scripts/models/Thread';
import {
  getScopePrefix,
  useCommonNavigate,
} from 'client/scripts/navigation/helpers';
import { useGetCommunityByIdQuery } from 'client/scripts/state/api/communities';
import useUserStore from 'client/scripts/state/ui/user';
import Permissions from 'client/scripts/utils/Permissions';
import moment from 'moment';
import React from 'react';
import { Link } from 'react-router-dom';
import threadPlaceholder from '../../../../assets/img/threadplaceholder.png';
import MarkdownViewerWithFallback from '../../components/MarkdownViewerWithFallback';
import { SharePopover } from '../../components/SharePopover';
import { ThreadContestTagContainer } from '../../components/ThreadContestTag';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTag } from '../../components/component_kit/new_designs/CWTag';
import { CWThreadAction } from '../../components/component_kit/new_designs/cw_thread_action';
import { NewThreadTag } from '../discussions/NewThreadTag';
import { ReactionButton } from '../discussions/ThreadCard/ThreadOptions/ReactionButton';
import { ToggleThreadSubscribe } from '../discussions/ThreadCard/ThreadOptions/ToggleThreadSubscribe';
import { isHot, removeImageFormMarkDown } from '../discussions/helpers';
import './ThreadCell.scss';

export type RenderThreadCellProps = {
  thread: Thread;
  actionGroups: ActionGroups;
  bypassGating: boolean;
};
const ThreadCell = ({
  thread,
  actionGroups,
  bypassGating,
}: RenderThreadCellProps) => {
  const user = useUserStore();

  const permissions = Permissions.getGeneralActionPermission({
    thread,
    action: GatedActionEnum.CREATE_THREAD_REACTION,
    actionGroups,
    bypassGating,
  });

  const image = extractImages(thread?.body);
  const showTag = isHot(thread);
  const threadBody = removeImageFormMarkDown(thread.body);

  const discussionLink = getProposalUrlPath(
    thread.slug,
    `${thread.identifier}-${slugify(thread.title)}`,
  );

  const shareEndpoint = `${window.location.origin}${discussionLink}`;
  const { data: fetchedCommunity } = useGetCommunityByIdQuery({
    id: thread.communityId,
    enabled: !!thread.communityId,
  });
  const threadUrl = `${getScopePrefix()}${discussionLink}`;
  const navigate = useCommonNavigate();
  const isCommunityMember = Permissions.isCommunityMember(thread.communityId);
  return (
    <Link className="ThreadCell" to={threadUrl}>
      <div className="card-image-container">
        <ReactionButton
          thread={thread}
          size="big"
          disabled={permissions.allowed}
          undoUpvoteDisabled={false}
          tooltipText={permissions.tooltip}
        />
        <img src={image[0] || threadPlaceholder} alt="Thread content" />
        <div className="thread-details">
          <div className="content-title">
            <CWText type="h5" fontWeight="semiBold" noWrap>
              <ThreadContestTagContainer
                associatedContests={thread.associatedContests}
              />
              {thread.title}
            </CWText>
            <NewThreadTag threadCreatedAt={moment(thread.createdAt)} />
            {showTag && (
              <CWTag iconName="trendUp" label="Trending" type="trending" />
            )}
          </div>
          <div className="community-details">
            {fetchedCommunity && fetchedCommunity.icon_url && (
              <img src={fetchedCommunity.icon_url} alt="community Icon" />
            )}
            <CWText fontWeight="bold">{fetchedCommunity?.name}</CWText>
          </div>
          <div className="thread-body">
            <MarkdownViewerWithFallback
              markdown={threadBody}
              maxChars={70}
              cutoffLines={1}
              className="capital"
            />
          </div>

          <div className="footer-container">
            <CWThreadAction
              label={pluralize(thread.numberOfComments, 'Comment')}
              action="comment"
              disabled={false}
              onClick={(e) => {
                e.preventDefault();
                navigate(`${discussionLink}?focusComments=true`);
              }}
              tooltipText="comment"
            />
            <SharePopover linkToShare={shareEndpoint} buttonLabel="Share" />
            {user.id > 0 && (
              <ToggleThreadSubscribe
                thread={thread}
                isCommunityMember={isCommunityMember}
                showLabel={true}
              />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ThreadCell;
