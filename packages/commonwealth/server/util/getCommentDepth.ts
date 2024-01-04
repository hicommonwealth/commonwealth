import { DB } from 'server/models';

// getCommentDepth recursively calculates the depth of a comment,
// then returns if the depth exceeds max, and the depth level
export const getCommentDepth = async (
  models: DB,
  comment,
  maxIterations: number,
  n?: number,
): Promise<[exceeded: boolean, depth: number]> => {
  if (!n) {
    n = 0;
  }

  if (!comment.parent_id) {
    return [false, n];
  }

  if (n >= maxIterations) {
    return [true, maxIterations];
  }
  const parentComment = await models.Comment.findOne({
    where: {
      id: comment.parent_id,
      community_id: comment.chain,
    },
  });
  return getCommentDepth(models, parentComment, maxIterations, n + 1);
};
