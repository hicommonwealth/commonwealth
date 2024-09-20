import { ThreadSubscription } from '@hicommonwealth/schemas';
import { getDecodedString, getThreadUrl } from '@hicommonwealth/shared';
import { notifySuccess } from 'controllers/app/notifications';
import { pluralize } from 'helpers';
import { getRelativeTimestamp } from 'helpers/dates';
import { navigateToCommunity, useCommonNavigate } from 'navigation/helpers';
import React, { useCallback } from 'react';
import { useDeleteThreadSubscriptionMutation } from 'state/api/trpc/subscription/useDeleteThreadSubscriptionMutation';
import { CWCommunityAvatar } from 'views/components/component_kit/cw_community_avatar';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWThreadAction } from 'views/components/component_kit/new_designs/cw_thread_action';
import { User } from 'views/components/user/user';
import { z } from 'zod';

interface ThreadSubscriptionEntryProps {
  readonly subscription: z.infer<typeof ThreadSubscription>;
  readonly onUnsubscribe: (id: number) => void;
}

export const ThreadSubscriptionEntry = (
  props: ThreadSubscriptionEntryProps,
) => {
  const { subscription, onUnsubscribe } = props;
  const thread = subscription.Thread!;
  const thread_id = thread.id!;

  const threadUrl = getThreadUrl(
    {
      chain: thread.community_id,
      id: thread.id!,
      title: getDecodedString(thread.title),
    },
    undefined,
    true,
  );

  const navigate = useCommonNavigate();

  const handleComment = useCallback(() => {
    navigate(threadUrl);
  }, [navigate, threadUrl]);
  const deleteThreadSubscriptionMutation =
    useDeleteThreadSubscriptionMutation();

  const deleteThreadSubscription = useCallback(async () => {
    await deleteThreadSubscriptionMutation.mutateAsync({
      id: thread_id,
      thread_ids: [thread_id],
    });
  }, [deleteThreadSubscriptionMutation, thread_id]);

  const handleDeleteSubscription = useCallback(() => {
    deleteThreadSubscription()
      .then(() => {
        notifySuccess('Unsubscribed!');
        onUnsubscribe(thread_id);
      })
      .catch(console.error);
  }, [deleteThreadSubscription, onUnsubscribe, thread_id]);

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

        <div>{getRelativeTimestamp(thread.created_at!.getTime())}</div>
      </div>
      <div>
        <CWText type="h4" fontWeight="semiBold">
          <CWText type="h4">{getDecodedString(thread.title)}</CWText>
        </CWText>
      </div>

      <div className="SubscriptionFooter">
        <CWThreadAction
          label={pluralize(thread.comment_count, 'Comment')}
          action="comment"
          onClick={(e) => {
            e.preventDefault();
            handleComment();
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
