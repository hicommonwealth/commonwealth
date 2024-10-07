import { CommentSubscription } from '@hicommonwealth/schemas';
import {
  MIN_CHARS_TO_SHOW_MORE,
  getDecodedString,
  getThreadUrl,
  safeTruncateBody,
} from '@hicommonwealth/shared';
import { notifySuccess } from 'controllers/app/notifications';
import { pluralize } from 'helpers';
import { getRelativeTimestamp } from 'helpers/dates';
import { navigateToCommunity, useCommonNavigate } from 'navigation/helpers';
import React, { useCallback } from 'react';
import { useDeleteCommentSubscriptionMutation } from 'state/api/trpc/subscription/useDeleteCommentSubscriptionMutation';
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

  if (!thread) {
    return;
  }

  const handleNavigateToThread = () => {
    const threadUrl = getThreadUrl(
      {
        chain: `${thread.community_id}`,
        id: `${thread.id}`,
        title: getDecodedString(thread.title),
      },
      comment_id,
      true,
    );

    navigate(threadUrl);
  };

  const handleNavigateToCommunity = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    navigateToCommunity({
      navigate,
      path: '/',
      chain: thread.Community.id!,
    });
  };

  return (
    <div className="SubscriptionEntry">
      <div className="SubscriptionHeader">
        <div>
          <CWCommunityAvatar
            community={{
              iconUrl: thread.Community.icon_url || '',
              name: thread.Community.name || '',
            }}
            size="small"
          />
        </div>
        <div>
          <a onClick={handleNavigateToCommunity}>
            <CWText fontWeight="semiBold">{thread.Community.name}</CWText>
          </a>
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
          <QuillRenderer
            doc={safeTruncateBody(decodeURI(comment.text))}
            maxChars={MIN_CHARS_TO_SHOW_MORE}
            customShowMoreButton={<></>}
          />
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
