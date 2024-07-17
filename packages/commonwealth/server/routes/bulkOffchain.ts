/* eslint-disable no-async-promise-executor */
import { ServerError } from '@hicommonwealth/core';
//
// The async promise syntax, new Promise(async (resolve, reject) => {}), should usually be avoided
// because it's easy to miss catching errors inside the promise executor, but we use it in this file
// because the bulk offchain queries are heavily optimized so communities can load quickly.
//
import type {
  CommunityBannerInstance,
  ContractInstance,
  DB,
} from '@hicommonwealth/model';
import type { Response } from 'express';
import { TypedRequest } from 'server/types';
import type { RoleInstanceWithPermission } from '../util/roles';
import { findAllRoles } from '../util/roles';

export const Errors = {};

// Topics, comments, reactions, members+admins, threads
const bulkOffchain = async (models: DB, req: TypedRequest, res: Response) => {
  const { community } = req;

  // parallelized queries
  const [
    admins,
    numVotingThreads,
    numTotalThreads,
    communityBanner,
    contractsWithTemplatesData,
  ] = await (<
    Promise<
      [
        RoleInstanceWithPermission[],
        number,
        number,
        CommunityBannerInstance,
        Array<{
          contract: ContractInstance;
          hasGlobalTemplate: boolean;
        }>,
      ]
    >
  >Promise.all([
    // admins
    findAllRoles(
      models,
      { include: [models.Address], order: [['created_at', 'DESC']] },
      // @ts-expect-error StrictNullChecks
      community.id,
      ['admin', 'moderator'],
    ),
    models.Thread.count({
      where: {
        // @ts-expect-error StrictNullChecks
        community_id: community.id,
        stage: 'voting',
      },
    }),
    models.Thread.count({
      where: {
        // @ts-expect-error StrictNullChecks
        community_id: community.id,
        marked_as_spam_at: null,
      },
    }),
    models.CommunityBanner.findOne({
      where: {
        // @ts-expect-error StrictNullChecks
        community_id: community.id,
      },
    }),
    new Promise(async (resolve, reject) => {
      try {
        const communityContracts = await models.CommunityContract.findAll({
          where: {
            // @ts-expect-error StrictNullChecks
            community_id: community.id,
          },
        });
        const contractsWithTemplates: Array<{
          contract: ContractInstance;
        }> = [];
        for (const cc of communityContracts) {
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

          // @ts-expect-error StrictNullChecks
          contractsWithTemplates.push({ contract });
        }
        resolve(contractsWithTemplates);
      } catch (e) {
        reject(new ServerError('Could not fetch contracts'));
      }
    }),
  ]));

  return res.json({
    status: 'Success',
    result: {
      numVotingThreads,
      numTotalThreads,
      admins: admins.map((a) => a.toJSON()),
      communityBanner: communityBanner?.banner_text || '',
      contractsWithTemplatesData: contractsWithTemplatesData.map((c) => {
        return {
          contract: c.contract.toJSON(),
          hasGlobalTemplate: c.hasGlobalTemplate,
        };
      }),
    },
  });
};

export default bulkOffchain;
