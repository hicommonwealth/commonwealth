import { InvalidInput, type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { mustExist } from '../../middleware';

export function GetNamespaceMetadata(): Query<
  typeof schemas.GetNamespaceMetadata
> {
  return {
    ...schemas.GetNamespaceMetadata,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const { namespace, stake_id } = payload;

      // stake_id will be a 32 byte hex string, convert to number
      const decodedId = parseInt(stake_id, 16);
      if (isNaN(decodedId)) throw new InvalidInput('Invalid stake id');

      const community = await models.Community.findOne({
        where: { namespace },
        include: [
          {
            model: models.CommunityStake,
            required: true,
            attributes: ['stake_id'],
            where: { stake_id: decodedId },
          },
        ],
        attributes: ['namespace', 'icon_url'],
      });
      mustExist('Community', community);

      return {
        name: `${community.namespace} Community Stake`,
        image: community.icon_url,
      };
    },
  };
}
