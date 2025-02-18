import React from 'react';

import { ProposalType, slugify } from '@hicommonwealth/shared';
import { pluralize } from 'client/scripts/helpers';
import { getProposalUrlPath } from 'client/scripts/identifiers';
import { useGetCommunityByIdQuery } from 'client/scripts/state/api/communities';
import useUserStore from 'client/scripts/state/ui/user';
import Permissions from 'client/scripts/utils/Permissions';
import { AuthorAndPublishInfo } from 'client/scripts/views/pages/discussions/ThreadCard/AuthorAndPublishInfo';
// eslint-disable-next-line max-len
import { ToggleThreadSubscribe } from 'client/scripts/views/pages/discussions/ThreadCard/ThreadOptions/ToggleThreadSubscribe';
import Thread from 'models/Thread';
import moment from 'moment';
import withRouter from 'navigation/helpers';
import { Link } from 'react-router-dom';
import MarkdownViewerUsingQuillOrNewEditor from 'views/components/MarkdownViewerWithFallback';
import { CWText } from 'views/components/component_kit/cw_text';
import { SharePopover } from '../../../SharePopover';
import { CWThreadAction } from '../../../component_kit/new_designs/cw_thread_action';
import type { CommentWithAssociatedThread } from '../ProfileActivity';
import './ProfileActivityRow.scss';

type ProfileActivityRowProps = {
  activity: CommentWithAssociatedThread | Thread;
};

const ProfileActivityRow = ({ activity }: ProfileActivityRowProps) => {
  const isThread = !!(activity as Thread).kind;

  const comment = activity as CommentWithAssociatedThread;

  const communityId = comment?.communityId;

  const { data: community } = useGetCommunityByIdQuery({
    id: communityId,
    enabled: !!communityId,
  });

  const userStore = useUserStore();
  const isCommunityMember = Permissions.isCommunityMember(communityId);

  const isReply = comment && comment?.parentComment;

  if (isThread) {
    return <></>;
  }

  const discussionLink = getProposalUrlPath(
    ProposalType.Thread,
    `${comment?.threadId}-${slugify(comment.thread?.title)}`,
    false,
    comment?.communityId,
  );
  const shareEndpoint = `${window.location.origin}${discussionLink}`;

  return community ? (
    <div>
      <Link
        to={`${discussionLink}?focusComments=true`}
        className="ProfileActivityRow"
        key={comment.id}
      >
        <AuthorAndPublishInfo
          authorAddress={comment.author}
          authorCommunityId={communityId}
          publishDate={moment(comment.createdAt)}
          hidePublishDate={false}
          profile={comment.profile}
          layoutType="community-first"
          showSplitDotIndicator={true}
        />
        <div className="ProfileActivityRowContainer">
          <div className="heading">
            <CWText noWrap fontWeight="regular">
              {isReply ? `Replied in` : 'Commented on'}
            </CWText>
            &nbsp;
            <CWText noWrap fontWeight="medium">
              {isReply
                ? `${comment?.communityId} Community`
                : `${comment?.communityId} Community`}
            </CWText>
          </div>
          <CWText className="created_at">
            {moment(comment.createdAt).fromNow(true)}
          </CWText>
        </div>
        <div className="title">
          <CWText noWrap className="gray_text">
            Commented on: {comment?.thread?.title}
          </CWText>
        </div>
        <div className="content">
          <MarkdownViewerUsingQuillOrNewEditor
            markdown={comment?.text}
            cutoffLines={2}
            maxChars={100}
          />
        </div>
        <div className="footer">
          <CWThreadAction
            label={pluralize(comment.thread.numberOfComments, 'Comment')}
            action="comment"
            disabled={false}
            onClick={(e) => {
              e.preventDefault();
            }}
            tooltipText="comment"
          />
          <SharePopover linkToShare={shareEndpoint} buttonLabel="Share" />
          {userStore.id > 0 && (
            <ToggleThreadSubscribe
              thread={comment.thread}
              isCommunityMember={isCommunityMember}
            />
          )}
        </div>
      </Link>
    </div>
  ) : (
    <></>
  );
};

export default withRouter(ProfileActivityRow);
