import React from 'react';

import Thread from 'models/Thread';
import moment from 'moment';
import withRouter from 'navigation/helpers';
import { formatAddressShort } from 'shared/utils';
import app from 'state';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import MarkdownViewerUsingQuillOrNewEditor from 'views/components/MarkdownViewerWithFallback';
import { CWText } from '../component_kit/cw_text';
import type { CommentWithAssociatedThread } from './ProfileActivity';
import './ProfileActivityRow.scss';
type CommentWithThreadCommunity = CommentWithAssociatedThread & {
  thread?: { community_id?: string };
};
type ProfileActivityRowProps = {
  activity: CommentWithAssociatedThread | Thread;
};

const ProfileActivityRow = ({ activity }: ProfileActivityRowProps) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const communityId =
    (activity as CommentWithThreadCommunity)?.thread?.community_id ||
    activity?.communityId;

  const isThread = !!(activity as Thread).kind;

  const comment = activity as CommentWithAssociatedThread;
  const { data: community } = useGetCommunityByIdQuery({
    id: communityId,
    enabled: !!communityId,
  });

  const isReply = comment && comment?.parentComment;

  const redactedAddress = formatAddressShort(
    comment.author,
    communityId,
    true,
    undefined,
    app.chain?.meta?.bech32_prefix || '',
    true,
  );
  if (isThread) {
    return <></>;
  }

  return community ? (
    <div className="ProfileActivityRow">
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

      <div className="heading">
        <CWText className="address" fontWeight="medium">
          {redactedAddress}
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
        />
      </div>
    </div>
  ) : (
    <></>
  );
};

export default withRouter(ProfileActivityRow);
