import { DB } from 'server/models';

// getCommentDepth recursively calculates the depth of a comment, then returns the comment
// TODO: limit number of recursive calls?
export const getCommentDepth = async (models: DB, comment) => {
  if (!comment.parent_id) {
    return 0;
  } else {
    const parentComment = await models.Comment.findOne({
      where: {
        id: comment.parent_id,
        chain: comment.chain,
      },
    });
    return getCommentDepth(models, parentComment) + 1;
  }
};
