import type { Query } from '@hicommonwealth/core';
import { schemas } from '@hicommonwealth/core';
import { models } from '../database';

export const GetStakeTransaction: Query<
  typeof schemas.queries.GetStakeTransaction
> = () => ({
  ...schemas.queries.GetStakeTransaction,
  auth: [],
  secure: true,
  body: async ({ payload }) => {
    const { address, community_id } = payload;

    let response;

    if (address) {
      response = await models.StakeTransaction.findAll({
        where: { address },
        include: [
          {
            model: models.Address,
            required: true,
            attributes: ['address'],
          },
        ],
      });
    } else {
      response = await models.StakeTransaction.findAll({
        where: { community_id },
      });
    }

    return response;

    // return response?.get({ plain: true });
  },
});
