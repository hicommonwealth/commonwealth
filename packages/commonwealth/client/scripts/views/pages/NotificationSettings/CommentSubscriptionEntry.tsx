import { CommentSubscription } from '@hicommonwealth/schemas';
import { getThreadUrl } from '@hicommonwealth/shared';
import { notifySuccess } from 'controllers/app/notifications';
import { useCommonNavigate } from 'navigation/helpers';
import { useCallback } from 'react';
import { useDeleteCommentSubscriptionMutation } from 'state/api/trpc/subscription/useDeleteCommentSubscriptionMutation';
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

  const deleteThreadSubscription = useCallback(async () => {
    await deleteCommentSubscriptionMutation.mutateAsync({
      id: `${comment_id}`,
      thread_ids: [comment_id],
    });
  }, [deleteCommentSubscriptionMutation, comment_id]);

  const handleDeleteSubscription = useCallback(() => {
    deleteThreadSubscription()
      .then(() => {
        notifySuccess('Unsubscribed!');
        onUnsubscribe(comment_id);
      })
      .catch(console.error);
  }, [deleteThreadSubscription, onUnsubscribe, comment_id]);

  const navigate = useCommonNavigate();

  const handleNavigateToThread = useCallback(() => {
    navigate(threadUrl);
  }, [navigate, threadUrl]);

  return null;

  //
  //
  //
  // return (
  //   <div className="SubscriptionEntry">
  //     <div className="SubscriptionHeader">
  //       <div>
  //         <CWCommunityAvatar
  //           community={{
  //             iconUrl: comment.Community.icon_url!,
  //             name: comment.Community.name,
  //           }}
  //           size="small"
  //         />
  //       </div>
  //       <div>
  //         <Link to={getCommunityUrl(comment.Community.name)}>
  //           <CWText fontWeight="semiBold">{comment.Community.name}</CWText>
  //         </Link>
  //       </div>
  //
  //       <div>•</div>
  //
  //       <div>
  //         <User
  //           userAddress={comment.Address.address}
  //           userCommunityId={comment.Community!.id!}
  //         />
  //       </div>
  //
  //       <div>•</div>
  //
  //       <div>{getRelativeTimestamp(comment.created_at!.getTime())}</div>
  //     </div>
  //     <div>
  //       <CWText type="h4" fontWeight="semiBold">
  //         <Link to={threadUrl}>
  //           <CWText type="h4">{decodeURIComponent(comment.title)}</CWText>
  //         </Link>
  //       </CWText>
  //     </div>
  //
  //     <div className="SubscriptionFooter">
  //       <CWThreadAction
  //         label={pluralize(comment.comment_count, 'Comment')}
  //         action="comment"
  //         onClick={(e) => {
  //           e.preventDefault();
  //           handleComment();
  //         }}
  //       />
  //
  //       <CWThreadAction
  //         label="Unsubscribe"
  //         action="subscribe"
  //         onClick={(e) => {
  //           e.preventDefault();
  //           handleDeleteSubscription();
  //         }}
  //       />
  //     </div>
  //   </div>
  // );
};
