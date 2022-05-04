/* eslint-disable no-async-promise-executor */
//
// The async promise syntax, new Promise(async (resolve, reject) => {}), should usually be avoided
// because it's easy to miss catching errors inside the promise executor, but we use it in this file
// because the bulk offchain queries are heavily optimized so communities can load quickly.
//
import { QueryTypes, Op } from 'sequelize';
import { Response, NextFunction, Request } from 'express';
import validateChain from '../util/validateChain';
import { factory, formatFilename } from '../../shared/logging';
import { getLastEdited } from '../util/getLastEdited';
import { DB } from '../database';
import { OffchainTopicInstance } from '../models/offchain_topic';
import { RoleInstance } from '../models/role';
import { OffchainThreadInstance } from '../models/offchain_thread';
import { ChatChannelInstance } from '../models/chat_channel';

const log = factory.getLogger(formatFilename(__filename));
export const Errors = {};

// Topics, comments, reactions, members+admins, threads
const bulkOffchain = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const [chain, error] = await validateChain(models, req.query);
  if (error) return next(new Error(error));

  // globally shared SQL replacements
  const communityOptions = 'chain = :chain';
  const replacements = { chain: chain.id };

  // parallelized queries
  const [topics, pinnedThreads, admins, mostActiveUsers, threadsInVoting, chatChannels] =
    await (<
      Promise<
        [
          OffchainTopicInstance[],
          unknown,
          RoleInstance[],
          unknown,
          OffchainThreadInstance[],
          ChatChannelInstance[]
        ]
      >
    >Promise.all([
      // topics
      models.OffchainTopic.findAll({
        where: { chain_id: chain.id },
      }),
      // threads, comments, reactions
      new Promise(async (resolve, reject) => {
        try {
          const threadParams = Object.assign(replacements, { pinned: true });
          const rawPinnedThreads = await models.OffchainThread.findAll({
            where: threadParams,
            include: [
              {
                model: models.Address,
                as: 'Address',
              },
              {
                model: models.Address,
                as: 'collaborators',
              },
              {
                model: models.OffchainTopic,
                as: 'topic',
              },
              {
                model: models.ChainEntity,
              },
              {
                model: models.LinkedThread,
                as: 'linked_threads',
              },
              {
                model: models.OffchainReaction,
                as: 'reactions',
                include: [
                  {
                    model: models.Address,
                    as: 'Address',
                    required: true,
                  },
                ],
              },
            ],
            attributes: { exclude: ['version_history'] },
          });

          resolve(
            rawPinnedThreads.map((t) => {
              return t.toJSON();
            })
          );
        } catch (e) {
          console.log(e);
          reject(new Error('Could not fetch threads, comments, or reactions'));
        }
      }),
      // admins
      models.Role.findAll({
        where: {
          chain_id: chain.id,
          permission: { [Op.in]: ['admin', 'moderator'] },
        },
        include: [models.Address],
        order: [['created_at', 'DESC']],
      }),
      // most active users
      new Promise(async (resolve, reject) => {
        try {
          const thirtyDaysAgo = new Date(
            (new Date() as any) - 1000 * 24 * 60 * 60 * 30
          );
          const activeUsers = {};
          const where = {
            updated_at: { [Op.gt]: thirtyDaysAgo },
            chain: chain.id,
          };

          const monthlyComments = await models.OffchainComment.findAll({
            where,
            include: [models.Address],
          });
          const monthlyThreads = await models.OffchainThread.findAll({
            where,
            attributes: { exclude: ['version_history'] },
            include: [{ model: models.Address, as: 'Address' }],
          });

          (monthlyComments as any).concat(monthlyThreads).forEach((post) => {
            if (!post.Address) return;
            const addr = post.Address.address;
            if (activeUsers[addr]) activeUsers[addr]['count'] += 1;
            else
              activeUsers[addr] = {
                info: post.Address,
                count: 1,
              };
          });
          const mostActiveUsers_ = Object.values(activeUsers).sort((a, b) => {
            return (b as any).count - (a as any).count;
          });
          resolve(mostActiveUsers_);
        } catch (e) {
          reject(new Error('Could not fetch most active users'));
        }
      }),
      models.sequelize.query(
        `
     SELECT id, title, stage FROM "OffchainThreads"
     WHERE ${communityOptions} AND (stage = 'proposal_in_review' OR stage = 'voting')`,
        {
          replacements,
          type: QueryTypes.SELECT,
        }
      ),
      models.ChatChannel.findAll({
        where: {
          chain_id: chain.id
        },
        include: {
          model: models.ChatMessage,
          required: false // should return channels with no chat messages
        }
      }),
    ]));

  const numVotingThreads = threadsInVoting.filter(
    (t) => t.stage === 'voting'
  ).length;

  return res.json({
    status: 'Success',
    result: {
      topics: topics.map((t) => t.toJSON()),
      numVotingThreads,
      pinnedThreads, // already converted to JSON earlier
      admins: admins.map((a) => a.toJSON()),
      activeUsers: mostActiveUsers,
      chatChannels: JSON.stringify(chatChannels)
    },
  });
};

export default bulkOffchain;
