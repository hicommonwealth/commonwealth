import { Request, Response, NextFunction } from 'express';
import { Sequelize } from 'sequelize'
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';
import { OffchainReactionInstance} from "../models/offchain_reaction";

const log = factory.getLogger(formatFilename(__filename));

// fetch reaction counts and whether user has reacted
const reactionsCounts = async (models: DB, req: Request, res: Response, next: NextFunction) => {
    const { active_address } = req.body
    const thread_ids = req.body['thread_ids[]'];
    const comment_ids = req.body['comment_ids[]'];
    const proposal_ids = req.body['proposal_ids[]'];
    try {
        if (thread_ids || comment_ids || proposal_ids) {
            let countField = 'thread_id';
            if (comment_ids) {
                countField = 'comment_id';
            } else if (proposal_ids) {
                countField = 'proposal_id';
            }
            const [reactionsCounts = [], myReactions = []] = await <Promise<[OffchainReactionInstance[], OffchainReactionInstance[]]>>Promise.all([
                models.OffchainReaction.findAll({
                    group: ['thread_id', 'comment_id', 'proposal_id', 'reaction'],
                    attributes: ['thread_id', 'comment_id', 'proposal_id', 'reaction',
                        [Sequelize.fn('COUNT', countField), 'count']],
                    where: Sequelize.or(
                     { thread_id: thread_ids || [] },
                          {  proposal_id: proposal_ids || [] },
                          { comment_id: comment_ids || [] }
                    ),
                }),
                models.OffchainReaction.findAll({
                    attributes: ['thread_id', 'comment_id', 'proposal_id'],
                    where: Sequelize.or(
                        { thread_id: thread_ids || [] },
                        {  proposal_id: proposal_ids || [] },
                        { comment_id: comment_ids || [] }
                    ),
                    include: [{
                        model: models.Address,
                        where: { address: active_address }
                    }]
                })
            ])
            console.log(reactionsCounts.map((a) => a.toJSON()))
            return res.json({
                status: 'Success',
                result: reactionsCounts.reduce((acc, rc) => {
                    const rcJSon: any = rc.toJSON()
                    const id = rcJSon.thread_id || rcJSon.comment_id || rcJSon.proposal_id
                    const index = acc.findIndex(({ thread_id, comment_id, proposal_id }) => (id === thread_id || id === comment_id
                        || id === proposal_id))
                    const has_reacted = myReactions.some(({ thread_id, comment_id, proposal_id }) => {
                        return (id === thread_id || id === comment_id || id === proposal_id)
                    })
                    if (index > 0) {
                        acc[index][rcJSon.reaction] = rcJSon.count;
                    } else {
                        acc.push({ ...rcJSon, [rcJSon.reaction]: rcJSon.count, has_reacted })
                    }
                    return acc
                }, [])
            });
        }
    } catch (err) {
        return next(new Error(err));
    }

};

export default reactionsCounts;
