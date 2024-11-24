import React from 'react';

import 'components/Profile/ProfileActivityRow.scss';

import Thread from 'models/Thread';
import withRouter from 'navigation/helpers';
import { formatAddressShort } from 'shared/utils';
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
  let title: string;
  let body: string = '';
  if (activity instanceof Thread) {
    title = activity.title;
    body = activity.body;
  }
  const isThread = !!(activity as Thread).kind;

  const comment = activity as CommentWithAssociatedThread;
  const { data: community } = useGetCommunityByIdQuery({
    id: communityId,
    enabled: !!communityId,
  });
  let decodedTitle: string;
  const isReply = comment && comment?.parentComment;
  try {
    if (isThread) {
      // @ts-expect-error <StrictNullChecks/>
      decodedTitle = decodeURIComponent(title);
    } else {
      decodedTitle = decodeURIComponent(comment.thread?.title);
    }
  } catch (err) {
    // If we get an error trying to decode URI component, see if it passes when we first encode it.
    // (Maybe it has % Sign in the title)
    try {
      if (isThread) {
        // @ts-expect-error <StrictNullChecks/>
        decodedTitle = decodeURIComponent(encodeURIComponent(title));
      } else {
        decodedTitle = decodeURIComponent(
          encodeURIComponent(comment.thread?.title),
        );
      }
    } catch (e) {
      console.error(
        // @ts-expect-error <StrictNullChecks/>
        `Could not decode title: ${title ? title : comment.thread?.title}`,
      );
      // @ts-expect-error <StrictNullChecks/>
      decodedTitle = title;
    }
  }
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
      <div className="heading">
        <span>
          {isReply ? `Replied in` : 'Commented on'}
          &nbsp;
        </span>
        <CWText noWrap>
          {isReply
            ? `${comment?.communityId} Community`
            : `${comment?.communityId} Community`}
        </CWText>
      </div>
      <div className="heading ">
        <CWText noWrap>{redactedAddress}</CWText>
      </div>

      <div className="title">
        <CWText noWrap type="h5">
          Commented on: {comment?.thread?.title}
        </CWText>
      </div>
      <div className="content">
        <CWText fontWeight="regular">{comment.text}</CWText>
      </div>
    </div>
  ) : (
    <></>
  );
};

export default withRouter(ProfileActivityRow);
