import React, { useCallback, useMemo, useState } from 'react';
import { useCreateCommentSubscriptionMutation } from 'state/api/trpc/subscription/useCreateCommentSubscriptionMutation';
import { useDeleteCommentSubscriptionMutation } from 'state/api/trpc/subscription/useDeleteCommentSubscriptionMutation';
import { CWThreadAction } from 'views/components/component_kit/new_designs/cw_thread_action';
import { useCommentSubscriptions } from 'views/pages/NotificationSettings/useCommentSubscriptions';
import { CommentViewParams } from './CommentCard';

type ToggleCommentSubscribeProps = Readonly<{
  comment: CommentViewParams;
  userOwnsComment: boolean;
}>;

export const ToggleCommentSubscribe = (props: ToggleCommentSubscribeProps) => {
  const { userOwnsComment, comment } = props;

  // this is in an inner loop but trpc will batch this, so it's only called once.
  const commentSubscriptions = useCommentSubscriptions();

  const hasCommentSubscriptionDefault = useMemo(() => {
    const matching = (commentSubscriptions.data || []).filter(
      (current) => current.comment_id === comment.id,
    );
    return matching.length > 0;
  }, [comment.id, commentSubscriptions.data]);

  const [hasCommentSubscriptionState, setHasCommentSubscriptionState] =
    useState<boolean | undefined>(undefined);

  const hasCommentSubscription =
    hasCommentSubscriptionState !== undefined
      ? hasCommentSubscriptionState
      : hasCommentSubscriptionDefault;

  const createCommentSubscriptionMutation =
    useCreateCommentSubscriptionMutation();
  const deleteCommentSubscriptionMutation =
    useDeleteCommentSubscriptionMutation();

  const doToggleSubscribe = useCallback(async () => {
    if (hasCommentSubscription) {
      await deleteCommentSubscriptionMutation.mutateAsync({
        id: comment.id,
        comment_ids: [comment.id],
      });
    } else {
      await createCommentSubscriptionMutation.mutateAsync({
        id: comment.id,
        comment_id: comment.id,
      });
    }

    setHasCommentSubscriptionState(!hasCommentSubscription);
  }, [
    hasCommentSubscription,
    deleteCommentSubscriptionMutation,
    comment.id,
    createCommentSubscriptionMutation,
  ]);

  const handleToggleSubscribe = useCallback(
    (e: React.MouseEvent) => {
      // prevent clicks from propagating to discussion row
      e.preventDefault();
      e.stopPropagation();

      doToggleSubscribe().catch(console.error);
    },
    [doToggleSubscribe],
  );

  return (
    <>
      {userOwnsComment && (
        <CWThreadAction
          action="subscribe"
          label="Subscribe"
          selected={!hasCommentSubscription}
          onClick={handleToggleSubscribe}
        />
      )}
    </>
  );
};
