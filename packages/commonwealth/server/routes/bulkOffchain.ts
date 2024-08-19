/* eslint-disable no-async-promise-executor */
//
// The async promise syntax, new Promise(async (resolve, reject) => {}), should usually be avoided
// because it's easy to miss catching errors inside the promise executor, but we use it in this file
// because the bulk offchain queries are heavily optimized so communities can load quickly.
//
import type {
  AddressInstance,
  CommunityBannerInstance,
  DB,
} from '@hicommonwealth/model';
import { AddressRole } from '@hicommonwealth/shared';
import { Op } from 'sequelize';
import { TypedRequest, TypedResponse } from 'server/types';

export const Errors = {};

type BulkOffchainReq = {
  community: string;
};

type BulkOffchainResp = {
  numVotingThreads: number;
  numTotalThreads: number;
  adminsAndMods: AddressRole[];
  communityBanner: string;
};

// Topics, comments, reactions, members+admins, threads
const bulkOffchain = async (
  models: DB,
  req: TypedRequest<BulkOffchainReq>,
  res: TypedResponse<BulkOffchainResp>,
) => {
  const { community } = req;

  // parallelized queries
  const [adminsAndMods, numVotingThreads, numTotalThreads, communityBanner] =
    await (<
      Promise<[AddressInstance[], number, number, CommunityBannerInstance]>
    >Promise.all([
      // admins
      models.Address.findAll({
        where: {
          // @ts-expect-error StrictNullChecks
          community_id: community.id,
          [Op.or]: [{ role: 'admin' }, { role: 'moderator' }],
        },
        attributes: ['address', 'role'],
      }),
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
    ]));

  return res.json({
    status: 'Success',
    result: {
      numVotingThreads,
      numTotalThreads,
      adminsAndMods: adminsAndMods.map((a) => a.toJSON()),
      communityBanner: communityBanner?.banner_text || '',
    },
  });
};

export default bulkOffchain;
