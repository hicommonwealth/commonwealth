import { CommentSubscription } from '@hicommonwealth/schemas';
import { getThreadUrl, safeTruncateBody } from '@hicommonwealth/shared';
import { notifySuccess } from 'controllers/app/notifications';
import { pluralize } from 'helpers';
import { getRelativeTimestamp } from 'helpers/dates';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDeleteCommentSubscriptionMutation } from 'state/api/trpc/subscription/useDeleteCommentSubscriptionMutation';
import { getCommunityUrl } from 'utils';
import { CWCommunityAvatar } from 'views/components/component_kit/cw_community_avatar';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWThreadAction } from 'views/components/component_kit/new_designs/cw_thread_action';
import { QuillRenderer } from 'views/components/react_quill_editor/quill_renderer';
import { User } from 'views/components/user/user';
import { z } from 'zod';

interface CommentSubscriptionEntryProps {
  readonly subscription: z.infer<typeof CommentSubscription>;
  readonly onUnsubscribe: (id: number) => void;
}

export const CommentSubscriptionEntry = (
  props: CommentSubscriptionEntryProps,
) => {
  const { subscription, onUnsubscribe } = props;
  const comment = subscription.Comment!;
  const thread = comment.Thread;
  const comment_id = comment.id!;

  const deleteCommentSubscriptionMutation =
    useDeleteCommentSubscriptionMutation();

  const threadUrl = getThreadUrl(
    {
      chain: thread.community_id,
      id: comment.id!,
      title: thread.title,
    },
    comment_id,
    true,
  );

  const handleDeleteSubscription = useCallback(() => {
    async function doAsync() {
      await deleteCommentSubscriptionMutation.mutateAsync({
        id: comment_id,
        comment_ids: [comment_id],
      });
    }

    doAsync()
      .then(() => {
        notifySuccess('Unsubscribed!');
        onUnsubscribe(comment_id);
      })
      .catch(console.error);
  }, [deleteCommentSubscriptionMutation, comment_id, onUnsubscribe]);

  const navigate = useCommonNavigate();

  const handleNavigateToThread = () => {
    navigate(threadUrl);
  };

  return (
    <div className="SubscriptionEntry">
      <div className="SubscriptionHeader">
        <div>
          <CWCommunityAvatar
            community={{
              iconUrl: thread.Community.icon_url!,
              name: thread.Community.name,
            }}
            size="small"
          />
        </div>
        <div>
          <Link to={getCommunityUrl(thread.Community.name)}>
            <CWText fontWeight="semiBold">{thread.Community.name}</CWText>
          </Link>
        </div>

        <div>•</div>

        <div>
          <User
            userAddress={thread.Address.address}
            userCommunityId={thread.Community!.id!}
          />
        </div>

        <div>•</div>

        <div>{getRelativeTimestamp(comment.created_at!.getTime())}</div>
      </div>
      <div>
        <CWText type="h4" fontWeight="semiBold">
          <Link to={threadUrl}>
            <QuillRenderer
              doc={safeTruncateBody(decodeURI(comment.text))}
              cutoffLines={4}
              customShowMoreButton={
                <CWText type="b1" className="show-more-btn">
                  Show more
                </CWText>
              }
            />
          </Link>
        </CWText>
      </div>

      <div className="SubscriptionFooter">
        <CWThreadAction
          label={pluralize(thread.comment_count, 'Comment')}
          action="comment"
          onClick={(e) => {
            e.preventDefault();
            handleNavigateToThread();
          }}
        />

        <CWThreadAction
          label="Unsubscribe"
          action="subscribe"
          onClick={(e) => {
            e.preventDefault();
            handleDeleteSubscription();
          }}
        />
      </div>
    </div>
  );
};
