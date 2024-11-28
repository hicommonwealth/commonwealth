import React from 'react';

import 'components/Profile/ProfileActivityRow.scss';

import Thread from 'models/Thread';
import moment from 'moment';
import withRouter from 'navigation/helpers';
import { formatAddressShort, smartTrim } from 'shared/utils';
import app from 'state';
import { useGetCommunityByIdQuery } from 'state/api/communities';
import { CWText } from '../component_kit/cw_text';
import type { CommentWithAssociatedThread } from './ProfileActivity';
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
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="heading">
          <CWText fontWeight="regular">
            {isReply ? `Replied in` : 'Commented on'}
          </CWText>
          &nbsp; &nbsp;
          <CWText fontWeight="medium">
            {isReply
              ? `${comment?.communityId} Community`
              : `${comment?.communityId} Community`}
          </CWText>
        </div>
        <CWText noWrap className="created-at ">
          {moment(comment.createdAt).fromNow()}
        </CWText>
      </div>
      <div className="heading">
        <CWText noWrap fontWeight="medium">
          {redactedAddress}
        </CWText>
      </div>

      <div className="title">
        <CWText noWrap className="gray-text">
          Commented on: {comment?.thread?.title}
        </CWText>
      </div>
      <div className="content">
        <CWText fontWeight="regular">{smartTrim(comment?.text, 100)}</CWText>
      </div>
    </div>
  ) : (
    <></>
  );
};

export default withRouter(ProfileActivityRow);
