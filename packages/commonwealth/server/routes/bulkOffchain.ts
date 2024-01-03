/* eslint-disable no-async-promise-executor */
import { ServerError } from 'common-common/src/errors';
//
// The async promise syntax, new Promise(async (resolve, reject) => {}), should usually be avoided
// because it's easy to miss catching errors inside the promise executor, but we use it in this file
// because the bulk offchain queries are heavily optimized so communities can load quickly.
//
import type { Request, Response } from 'express';
import { Op, QueryTypes } from 'sequelize';
import type { CommunityContractTemplateInstance } from 'server/models/community_contract_template';
import type { DB } from '../models';
import type { CommunityBannerInstance } from '../models/community_banner';
import type { ContractInstance } from '../models/contract';
import type { ThreadInstance } from '../models/thread';
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
    admins,
    mostActiveUsers,
    threadsInVoting,
    totalThreads,
    communityBanner,
    contractsWithTemplatesData,
  ] = await (<
    Promise<
      [
        RoleInstanceWithPermission[],
        unknown,
        ThreadInstance[],
        [{ count: string }],
        CommunityBannerInstance,
        Array<{
          contract: ContractInstance;
          ccts: Array<CommunityContractTemplateInstance>;
          hasGlobalTemplate: boolean;
        }>,
      ]
    >
  >Promise.all([
    // admins
    findAllRoles(
      models,
      { include: [models.Address], order: [['created_at', 'DESC']] },
      chain.id,
      ['admin', 'moderator'],
    ),
    // most active users
    new Promise(async (resolve, reject) => {
      try {
        const thirtyDaysAgo = new Date(
          (new Date() as any) - 1000 * 24 * 60 * 60 * 30,
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
      },
    ),
    await models.sequelize.query(
      `
      SELECT 
        COUNT(*) 
      FROM 
        "Addresses" AS addr 
        RIGHT JOIN (
          SELECT 
            t.id AS thread_id, 
            t.address_id, 
            t.topic_id 
          FROM 
            "Threads" t 
          WHERE 
            t.deleted_at IS NULL 
            AND t.chain = $chain 
            AND (
              t.pinned = true 
              OR (
                COALESCE(
                  t.last_commented_on, t.created_at
                ) < $created_at 
                AND t.pinned = false
              )
            )
        ) threads ON threads.address_id = addr.id 
        LEFT JOIN "Topics" topics ON threads.topic_id = topics.id
      `,
      {
        bind: { chain: chain.id, created_at: new Date().toISOString() },
        type: QueryTypes.SELECT,
      },
    ),
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
  ]));

  const numVotingThreads = threadsInVoting.filter(
    (t) => t.stage === 'voting',
  ).length;

  const numTotalThreads = parseInt(totalThreads[0].count);

  return res.json({
    status: 'Success',
    result: {
      numVotingThreads,
      numTotalThreads,
      admins: admins.map((a) => a.toJSON()),
      activeUsers: mostActiveUsers,
      communityBanner: communityBanner?.banner_text || '',
      contractsWithTemplatesData: contractsWithTemplatesData.map((c) => {
        return {
          contract: c.contract.toJSON(),
          ccts: c.ccts,
          hasGlobalTemplate: c.hasGlobalTemplate,
        };
      }),
    },
  });
};

export default bulkOffchain;
