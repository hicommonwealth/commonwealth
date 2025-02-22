import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import useGetCommentByIdQuery from 'state/api/comments/getCommentById';
import { PageLoading } from './loading';

const CommentRedirect = ({ identifier }: { identifier: string }) => {
  const navigate = useCommonNavigate();

  const commentId = parseInt(identifier.split('-')[0]);
  const { data: comment, error } = useGetCommentByIdQuery({
    comment_id: commentId,
    apiCallEnabled: !!commentId,
  });

  useRunOnceOnCondition({
    callback: () => {
      !comment || error
        ? navigate('/error')
        : navigate(
            `/discussion/${comment.thread_id}?comment=${comment.id}`,
            { replace: true },
            comment.community_id,
          );
    },
    shouldRun: !!(comment || error),
  });

  return <PageLoading />;
};

export default CommentRedirect;
