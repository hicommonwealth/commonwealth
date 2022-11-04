/* eslint-disable no-async-promise-executor */
//
// The async promise syntax, new Promise(async (resolve, reject) => {}), should usually be avoided
// because it's easy to miss catching errors inside the promise executor, but we use it in this file
// because the bulk offchain queries are heavily optimized so communities can load quickly.
//
import { contracts } from '@polkadot/types/interfaces/definitions';
import { factory, formatFilename } from 'common-common/src/logging';
import { NextFunction, Request, Response } from 'express';
import { Op, QueryTypes } from 'sequelize';
import { DB } from '../models';
import { ChatChannelInstance } from '../models/chat_channel';
import { CommunityBannerInstance } from '../models/community_banner';
import { ContractInstance } from '../models/contract';
import { RoleInstance } from '../models/role';
import { RuleInstance } from '../models/rule';
import { ThreadInstance } from '../models/thread';
import { TopicInstance } from '../models/topic';
import { AppError, ServerError } from '../util/errors';
import { findAllRoles, RoleInstanceWithPermission } from '../util/roles';
import validateChain from '../util/validateChain';

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
  if (error) return next(new AppError(error));

  // globally shared SQL replacements
  const communityOptions = 'chain = :chain';
  const replacements = { chain: chain.id };

  // parallelized queries
  const [
    topics,
    pinnedThreads,
    admins,
    mostActiveUsers,
    threadsInVoting,
    chatChannels,
    rules,
    communityBanner,
    contracts,
  ] = await (<
    Promise<
      [
        TopicInstance[],
        unknown,
        RoleInstanceWithPermission[],
        unknown,
        ThreadInstance[],
        ChatChannelInstance[],
        RuleInstance[],
        CommunityBannerInstance,
        ContractInstance[]
      ]
    >
  >Promise.all([
    // topics
    models.Topic.findAll({
      where: { chain_id: chain.id },
    }),
    // threads, comments, reactions
    new Promise(async (resolve, reject) => {
      try {
        const threadParams = Object.assign(replacements, { pinned: true });
        const rawPinnedThreads = await models.Thread.findAll({
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
              model: models.Topic,
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
              model: models.Reaction,
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
        reject(
          new ServerError('Could not fetch threads, comments, or reactions')
        );
      }
    }),
    // admins
    findAllRoles(
      models,
      { include: [models.Address], order: [['created_at', 'DESC']] },
      chain.id,
      ['admin', 'moderator']
    ),
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

        const monthlyComments = await models.Comment.findAll({
          where,
          include: [models.Address],
        });
        const monthlyThreads = await models.Thread.findAll({
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
        reject(new ServerError('Could not fetch most active users'));
      }
    }),
    models.sequelize.query(
      `
     SELECT id, title, stage FROM "Threads"
     WHERE ${communityOptions} AND (stage = 'proposal_in_review' OR stage = 'voting')`,
      {
        replacements,
        type: QueryTypes.SELECT,
      }
    ),
    models.ChatChannel.findAll({
      where: {
        chain_id: chain.id,
      },
      include: {
        model: models.ChatMessage,
        required: false, // should return channels with no chat messages
      },
    }),
    models.Rule.findAll({
      where: {
        chain_id: chain.id,
      },
    }),
    models.CommunityBanner.findOne({
      where: {
        chain_id: chain.id,
      },
    }),
    new Promise(async (resolve, reject) => {
      try {
        const communityContracts = await models.CommunityContract.findAll({
          where: {
            chain_id: chain.id,
          },
        });
        const contractsPromise = models.Contract.findAll({
          where: {
            id: { [Op.in]: communityContracts.map((cc) => cc.contract_id) },
          },
          include: [{ model: models.ContractAbi, required: false }],
        });
        resolve(contractsPromise);
      } catch (e) {
        reject(new ServerError('Could not fetch contracts'));
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
      chatChannels: JSON.stringify(chatChannels),
      rules: rules.map((r) => r.toJSON()),
      communityBanner: communityBanner?.banner_text || '',
      contracts: contracts.map((c) => c.toJSON()),
    },
  });
};

export default bulkOffchain;
