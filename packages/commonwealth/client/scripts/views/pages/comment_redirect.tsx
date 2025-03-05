import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { useFetchCommentsQuery } from 'state/api/comments';
import { PageLoading } from './loading';

const CommentRedirect = ({ identifier }: { identifier: string }) => {
  const navigate = useCommonNavigate();

  const commentId = parseInt(identifier.split('-')[0]);
  const { data: comments, error } = useFetchCommentsQuery({
    comment_id: commentId,
    limit: 1,
    include_reactions: false,
    cursor: 1,
    include_spam_comments: true,
    order_by: 'newest',
    apiEnabled: !!commentId,
  });
  const foundComment = comments?.pages?.[0]?.results?.[0];

  useRunOnceOnCondition({
    callback: () => {
      !foundComment || error
        ? navigate('/error')
        : navigate(
            `/discussion/${foundComment.thread_id}?comment=${foundComment.id}`,
            { replace: true },
            foundComment.community_id,
          );
    },
    shouldRun: !!(foundComment || error),
  });

  return <PageLoading />;
};

export default CommentRedirect;
