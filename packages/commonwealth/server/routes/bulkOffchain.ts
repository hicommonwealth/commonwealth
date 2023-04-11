/* eslint-disable no-async-promise-executor */
import { Contract } from 'client/scripts/models';
import { ServerError } from 'common-common/src/errors';
//
// The async promise syntax, new Promise(async (resolve, reject) => {}), should usually be avoided
// because it's easy to miss catching errors inside the promise executor, but we use it in this file
// because the bulk offchain queries are heavily optimized so communities can load quickly.
//
import type { Request, Response } from 'express';
import { Op, QueryTypes } from 'sequelize';
import type { CommunityRoleInstance } from 'server/models/community_role';
import type { DB } from '../models';
import type { ChatChannelInstance } from '../models/chat_channel';
import type { CommunityBannerInstance } from '../models/community_banner';
import type { ContractInstance } from '../models/contract';
import type { CommunityContractTemplateInstance } from 'server/models/community_contract_template';
import type { RuleInstance } from '../models/rule';
import type { ThreadInstance } from '../models/thread';
import type { TopicInstance } from '../models/topic';
import type { RoleInstanceWithPermission } from '../util/roles';
import { findAllRoles } from '../util/roles';

export const Errors = {};

// Topics, comments, reactions, members+admins, threads
const bulkOffchain = async (models: DB, req: Request, res: Response) => {
  const chain = req.chain;
  // globally shared SQL replacements
  const communityOptions = 'chain = :chain';
  const replacements = { chain: chain.id };

  // parallelized queries
  const [
    topics,
    admins,
    mostActiveUsers,
    threadsInVoting,
    chatChannels,
    rules,
    communityBanner,
    contractsWithTemplatesData,
    communityRoles,
  ] = await (<
    Promise<
      [
        TopicInstance[],
        RoleInstanceWithPermission[],
        unknown,
        ThreadInstance[],
        ChatChannelInstance[],
        RuleInstance[],
        CommunityBannerInstance,
        Array<{
          contract: ContractInstance;
          ccts: Array<CommunityContractTemplateInstance>;
          hasGlobalTemplate: boolean;
        }>,
        CommunityRoleInstance[]
      ]
    >
  >Promise.all([
    // topics
    models.Topic.findAll({
      where: { chain_id: chain.id },
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
        const contractsWithTemplates: Array<{
          contract: ContractInstance;
          ccts: Array<CommunityContractTemplateInstance>;
          hasGlobalTemplate: boolean;
        }> = [];
        for (const cc of communityContracts) {
          const ccts = await models.CommunityContractTemplate.findAll({
            where: {
              community_contract_id: cc.id,
            },
            include: {
              model: models.CommunityContractTemplateMetadata,
              required: false,
            },
          });
          const contract = await models.Contract.findOne({
            where: {
              id: cc.contract_id,
            },
            include: [
              {
                model: models.ContractAbi,
                required: false,
              },
            ],
          });

          const globalTemplate = await models.Template.findOne({
            where: {
              abi_id: contract.abi_id,
            },
          });

          const hasGlobalTemplate = !!globalTemplate;

          contractsWithTemplates.push({ contract, ccts, hasGlobalTemplate });
        }
        resolve(contractsWithTemplates);
      } catch (e) {
        reject(new ServerError('Could not fetch contracts'));
      }
    }),
    models.CommunityRole.findAll({ where: { chain_id: chain.id } }),
  ]));

  const numVotingThreads = threadsInVoting.filter(
    (t) => t.stage === 'voting'
  ).length;

  return res.json({
    status: 'Success',
    result: {
      topics: topics.map((t) => t.toJSON()),
      numVotingThreads,
      admins: admins.map((a) => a.toJSON()),
      activeUsers: mostActiveUsers,
      chatChannels: JSON.stringify(chatChannels),
      rules: rules.map((r) => r.toJSON()),
      communityBanner: communityBanner?.banner_text || '',
      contractsWithTemplatesData: contractsWithTemplatesData.map((c) => {
        return {
          contract: c.contract.toJSON(),
          ccts: c.ccts,
          hasGlobalTemplate: c.hasGlobalTemplate,
        };
      }),
      communityRoles: communityRoles.map((r) => r.toJSON()),
    },
  });
};

export default bulkOffchain;
