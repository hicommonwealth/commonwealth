/* eslint-disable no-async-promise-executor */
import { ServerError } from '@hicommonwealth/core';
//
// The async promise syntax, new Promise(async (resolve, reject) => {}), should usually be avoided
// because it's easy to miss catching errors inside the promise executor, but we use it in this file
// because the bulk offchain queries are heavily optimized so communities can load quickly.
//
import type {
  CommunityBannerInstance,
  CommunityContractTemplateInstance,
  ContractInstance,
  DB,
  ThreadInstance,
} from '@hicommonwealth/model';
import type { Response } from 'express';
import { Op, QueryTypes } from 'sequelize';
import { TypedRequest } from '../types';
import type { RoleInstanceWithPermission } from '../util/roles';
import { findAllRoles } from '../util/roles';

export const Errors = {};

// Topics, comments, reactions, members+admins, threads
const bulkOffchain = async (models: DB, req: TypedRequest, res: Response) => {
  const { community } = req;
  // globally shared SQL replacements
  const communityOptions = 'community_id = :community_id';
  const replacements = { community_id: community.id };

  // parallelized queries
  const [
    admins,
    mostActiveUsers,
    threadsInVoting,
    numTotalThreads,
    communityBanner,
    contractsWithTemplatesData,
  ] = await (<
    Promise<
      [
        RoleInstanceWithPermission[],
        unknown,
        ThreadInstance[],
        number,
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
      community.id,
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
          community_id: community.id,
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
    await models.Thread.count({
      where: {
        community_id: community.id,
        marked_as_spam_at: null,
      },
    }),
    models.CommunityBanner.findOne({
      where: {
        community_id: community.id,
      },
    }),
    new Promise(async (resolve, reject) => {
      try {
        const communityContracts = await models.CommunityContract.findAll({
          where: {
            community_id: community.id,
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
