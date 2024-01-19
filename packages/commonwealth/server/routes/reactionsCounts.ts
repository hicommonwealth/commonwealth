import { ServerError } from '@hicommonwealth/adapters';
import type { DB, ReactionInstance } from '@hicommonwealth/model';
import type { NextFunction, Request, Response } from 'express';
import { Sequelize } from 'sequelize';

/*
2 queries:
- First gets the count of reactions for each thread/comment or proposal
- Second gets the list of reactions from the user active address

The reduce function goes through each result returned by query that counts
and checks whether there's a match between thread/comment/proposal ids
 */

// TODO Graham 4/24/22: Rename file + fn to getReactionCount
const reactionsCounts = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { active_address, thread_ids, comment_ids, proposal_ids } = req.body;
  try {
    if (thread_ids || comment_ids || proposal_ids) {
      let countField = 'thread_id';
      if (comment_ids) {
        countField = 'comment_id';
      } else if (proposal_ids) {
        countField = 'proposal_id';
      }
      const [reacCounts = [], myReactions = []] = await (<
        Promise<[ReactionInstance[], ReactionInstance[]]>
      >Promise.all([
        models.Reaction.findAll({
          group: ['thread_id', 'comment_id', 'proposal_id', 'reaction'],
          attributes: [
            'thread_id',
            'comment_id',
            'proposal_id',
            'reaction',
            [Sequelize.fn('COUNT', countField), 'count'],
          ],
          where: Sequelize.or(
            { thread_id: thread_ids || [] },
            { proposal_id: proposal_ids || [] },
            { comment_id: comment_ids || [] },
          ),
        }),
        active_address
          ? models.Reaction.findAll({
              attributes: ['thread_id', 'comment_id', 'proposal_id'],
              where: Sequelize.or(
                { thread_id: thread_ids || [] },
                { proposal_id: proposal_ids || [] },
                { comment_id: comment_ids || [] },
              ),
              include: [
                {
                  model: models.Address,
                  where: { address: active_address },
                },
              ],
            })
          : [],
      ]));

      return res.json({
        status: 'Success',
        result: reacCounts.reduce((acc, rc) => {
          const rcJSon = rc.toJSON();
          const id =
            rcJSon.thread_id || rcJSon.comment_id || rcJSon.proposal_id;
          const index = acc.findIndex(
            ({ thread_id, comment_id, proposal_id }) =>
              id === thread_id || id === comment_id || id === proposal_id,
          );
          const has_reacted = myReactions.some(
            ({ thread_id, comment_id, proposal_id }) => {
              return (
                id === thread_id || id === comment_id || id === proposal_id
              );
            },
          );
          const { reaction, count, thread_id, comment_id, proposal_id } =
            rcJSon as never;
          if (index > 0) {
            acc[index][reaction] = count;
          } else {
            acc.push({
              thread_id,
              comment_id,
              proposal_id,
              [reaction]: count,
              has_reacted,
            });
          }
          return acc;
        }, []),
      });
    } else {
      return res.json({ result: [] });
    }
  } catch (err) {
    return next(new ServerError(err));
  }
};

export default reactionsCounts;
