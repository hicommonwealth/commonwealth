import { QueryTypes } from 'sequelize';
import { DB } from 'server/models';
import { CommentInstance } from '../models/comment';

// getCommentDepth recursively calculates the depth of a comment,
// then returns if the depth exceeds max, and the depth level
export const getCommentDepth = async (
  models: DB,
  comment: CommentInstance,
  maxIterations: number,
): Promise<[exceeded: boolean, depth: number]> => {
  if (!comment.parent_id) {
    return [false, 0];
  }

  const result: Array<{ comment_depth: number; max_depth_reached: boolean }> =
    await models.sequelize.query(
      `
      WITH RECURSIVE CommentDepth AS (
          SELECT id, parent_id, 0 AS depth, false AS max_depth_reached
          FROM "Comments"
          WHERE parent_id = :parentCommentId AND community_id = :communityId
      
          UNION ALL
      
          SELECT c.id, c.parent_id, cd.depth + 1,
                 CASE
                     WHEN cd.depth + 1 > :maxDepth THEN true
                     ELSE false
                     END AS max_depth_reached
          FROM "Comments" c
                   INNER JOIN CommentDepth cd ON c.id = cd.parent_id::INTEGER
          WHERE cd.depth <= :maxDepth and community_id = :communityId
      )
      SELECT 
          CASE 
              WHEN bool_or(max_depth_reached) THEN :maxDepth
              ELSE MAX(depth)
          END AS comment_depth,
          bool_or(max_depth_reached) AS max_depth_reached
      FROM CommentDepth;
  `,
      {
        type: QueryTypes.SELECT,
        raw: true,
        replacements: {
          parentCommentId: comment.parent_id,
          maxDepth: maxIterations,
          communityId: comment.community_id,
        },
      },
    );

  return [result[0].max_depth_reached, result[0].comment_depth];
};
