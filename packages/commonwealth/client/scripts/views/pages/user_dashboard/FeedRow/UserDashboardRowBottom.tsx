import React, { useState } from 'react';

import { NotificationCategories } from 'common-common/src/types';

import './UserDashboardRowBottom.scss';

import app from 'state';
import { CWAvatarGroup } from '../../../components/component_kit/cw_avatar_group';
import type { ProfileWithAddress } from '../../../components/component_kit/cw_avatar_group';
import { CWIcon } from '../../../components/component_kit/cw_icons/cw_icon';
import { CWIconButton } from '../../../components/component_kit/cw_icon_button';
import { PopoverMenu } from '../../../components/component_kit/cw_popover/cw_popover_menu';
import { CWText } from '../../../components/component_kit/cw_text';
import { subscribeToThread } from '../helpers';
import type NotificationSubscription from '../../../../models/NotificationSubscription';
import useForceRerender from 'hooks/useForceRerender';
import { CommentReactionButton } from '../../../components/ReactionButton/CommentReactionButton';
import { ReactionButton } from '../../discussions/ThreadCard/Options/ReactionButton';
import Thread from 'models/Thread';
import { CreateComment } from '../../../components/Comments/CreateComment';
import { toNumber } from 'lodash';

type UserDashboardRowBottomProps = {
  commentCount: number;
  threadId: string;
  chainId: string;
  commentId?: string;
  commenters: ProfileWithAddress[];
  thread?: Thread;
  comment?: Comment<any>;
};

export const UserDashboardRowBottom = (props: UserDashboardRowBottomProps) => {
  const {
    threadId,
    commentCount,
    commentId,
    chainId,
    commenters,
    thread,
    comment,
  } = props;
  const forceRerender = useForceRerender();
  const [isReplying, setIsReplying] = useState(false);

  // console log props with object destructuring
  console.log({
    threadId,
    commentCount,
    commentId,
    chainId,
    commenters,
    thread,
    comment,
  });

  const handleIsReplying = () => {
    setIsReplying(!isReplying);
  };

  const setSubscription = async (
    subThreadId: string,
    bothActive: boolean,
    commentSubscription: NotificationSubscription,
    reactionSubscription: NotificationSubscription
  ) => {
    await subscribeToThread(
      subThreadId,
      bothActive,
      commentSubscription,
      reactionSubscription
    );
    forceRerender();
  };

  const adjustedId = `discussion_${threadId}`;

  const commentSubscription = app.user.notifications.subscriptions.find(
    (v) =>
      v.objectId === adjustedId &&
      v.category === NotificationCategories.NewComment
  );

  const reactionSubscription = app.user.notifications.subscriptions.find(
    (v) =>
      v.objectId === adjustedId &&
      v.category === NotificationCategories.NewReaction
  );

  const bothActive =
    commentSubscription?.isActive && reactionSubscription?.isActive;

  const domain = document.location.origin;

  return (
    <div className="UserDashboardRowBottom">
      <div className="top-row">
        <div className="activity">
          {
            thread && (
              <ReactionButton thread={thread} size="small" />
            ) /* Show on more than threads? */
          }
          {/* {comment && <CommentReactionButton comment={comment} />} */}
          <button
            className="thread-option-btn"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (thread) handleIsReplying();
            }}
          >
            <CWIcon iconName="comment" iconSize="small" />
            <CWText type="caption" className="text">
              {commentCount} {commentCount == 1 ? 'Comment' : 'Comments'}
            </CWText>
          </button>
          {commenters && (
            <div className="commenters">
              <CWAvatarGroup profiles={commenters} chainId={chainId} />
            </div>
          )}
        </div>
        <div
          className="actions"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <PopoverMenu
            menuItems={[
              {
                iconLeft: 'copy',
                label: 'Copy URL',
                onClick: async () => {
                  if (commentId) {
                    await navigator.clipboard.writeText(
                      `${domain}/${chainId}/discussion/${threadId}?comment=${commentId}`
                    );
                    return;
                  }
                  await navigator.clipboard.writeText(
                    `${domain}/${chainId}/discussion/${threadId}`
                  );
                },
              },
              {
                iconLeft: 'twitter',
                label: 'Share on Twitter',
                onClick: async () => {
                  if (commentId) {
                    await window.open(
                      `https://twitter.com/intent/tweet?text=${domain}/${chainId}/discussion/${threadId}
                        ?comment=${commentId}`
                    );
                    return;
                  }
                  await window.open(
                    `https://twitter.com/intent/tweet?text=${domain}/${chainId}/discussion/${threadId}`,
                    '_blank'
                  );
                },
              },
            ]}
            renderTrigger={(onClick) => (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onClick(e);
                }}
                className="thread-option-btn"
              >
                <CWIcon
                  color="black"
                  iconName="share"
                  iconSize="small"
                  weight="fill"
                />
                <CWText type="caption">Share</CWText>
              </button>
            )}
          />
          <button
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              threadId &&
                (await setSubscription(
                  threadId,
                  bothActive,
                  commentSubscription,
                  reactionSubscription
                ));
            }}
            className="thread-option-btn"
          >
            <CWIcon
              color="black"
              iconName={bothActive ? 'bellMuted' : 'bell'}
              iconSize="small"
            />
          </button>
        </div>
      </div>
      {isReplying && (
        <CreateComment
          handleIsReplying={handleIsReplying}
          parentCommentId={commentId ? toNumber(commentId) : null}
          rootThread={thread}
          updatedCommentsCallback={forceRerender}
        />
      )}
    </div>
  );
};
