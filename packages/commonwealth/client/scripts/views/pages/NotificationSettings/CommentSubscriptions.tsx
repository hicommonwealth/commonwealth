import { useCallback, useState } from 'react';
import { useCommentSubscriptions } from 'views/pages/NotificationSettings/useCommentSubscriptions';

export const CommentSubscriptions = () => {
  const commentSubscriptions = useCommentSubscriptions();
  // do not show these threads because they've been delete so it avoids us
  // having to do a refresh
  const [threadsFilter, setThreadsFilter] = useState<readonly number[]>([]);

  const handleUnsubscribe = useCallback(
    (id: number) => {
      setThreadsFilter([...threadsFilter, id]);
    },
    [threadsFilter],
  );

  console.log('FIXME: commentSubscriptions: ', commentSubscriptions);

  return null;

  // return (
  //   <>
  //     {(commentSubscriptions.data || [])
  //       .filter((current) => current.Comment)
  //       .filter((current) => !threadsFilter.includes(current.Thread!.id!))
  //       .map((current) => (
  //           <ThreadSubscriptionEntry
  //             key={current.Thread!.id!}
  //             subscription={current as z.infer<typeof ThreadSubscription>}
  //             onUnsubscribe={handleUnsubscribe}
  //           />
  //           {/*<ThreadCard thread={current.Thread!}/>*/}
  //       ))}
  //   </>
  // );
};
