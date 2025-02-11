import clsx from 'clsx';
import Thread from 'models/Thread';
import React, { useCallback, useMemo, useState } from 'react';
import { useCreateThreadSubscriptionMutation } from 'state/api/trpc/subscription/useCreateThreadSubscriptionMutation';
import { useDeleteThreadSubscriptionMutation } from 'state/api/trpc/subscription/useDeleteThreadSubscriptionMutation';
import { CWThreadAction } from 'views/components/component_kit/new_designs/cw_thread_action';
import { useThreadSubscriptions } from 'views/pages/NotificationSettings/useThreadSubscriptions';

type ToggleThreadSubscribeProps = Readonly<{
  readonly thread: Thread;
  readonly isCommunityMember: boolean;
  showLabel?: boolean;
}>;

export const ToggleThreadSubscribe = ({
  thread,
  isCommunityMember,
  showLabel = true,
}: ToggleThreadSubscribeProps) => {
  const createThreadSubscriptionMutation =
    useCreateThreadSubscriptionMutation();
  const deleteThreadSubscriptionMutation =
    useDeleteThreadSubscriptionMutation();

  const threadSubscriptions = useThreadSubscriptions();

  const hasThreadSubscriptionDefault = useMemo(() => {
    const matching = (threadSubscriptions.data || []).filter(
      (current) => current.thread_id === thread.id,
    );

    return matching.length > 0;
  }, [thread.id, threadSubscriptions.data]);

  const [hasThreadSubscriptionState, setHasThreadSubscriptionState] = useState<
    boolean | undefined
  >(undefined);

  const hasThreadSubscription =
    hasThreadSubscriptionState !== undefined
      ? hasThreadSubscriptionState
      : hasThreadSubscriptionDefault;

  const doToggleSubscribe = useCallback(async () => {
    if (hasThreadSubscription) {
      await deleteThreadSubscriptionMutation.mutateAsync({
        id: thread.id,
        thread_ids: [thread.id],
      });
    } else {
      await createThreadSubscriptionMutation.mutateAsync({
        id: thread.id,
        thread_id: thread.id,
      });
    }
    setHasThreadSubscriptionState(!hasThreadSubscription);
  }, [
    createThreadSubscriptionMutation,
    deleteThreadSubscriptionMutation,
    hasThreadSubscription,
    thread.id,
  ]);

  const handleToggleSubscribe = useCallback(
    (e: React.MouseEvent) => {
      async function doAsync() {
        await doToggleSubscribe();
      }

      // prevent clicks from propagating to discussion row
      e.preventDefault();
      e.stopPropagation();

      doAsync().catch(console.error);
    },
    [doToggleSubscribe],
  );

  return (
    <CWThreadAction
      action="subscribe"
      label={
        showLabel ? (hasThreadSubscription ? 'Subscribed' : 'Subscribe') : ''
      }
      className={clsx('subscribe', { selected: hasThreadSubscription })}
      onClick={handleToggleSubscribe}
      selected={!hasThreadSubscription}
      disabled={!isCommunityMember}
    />
  );
};
