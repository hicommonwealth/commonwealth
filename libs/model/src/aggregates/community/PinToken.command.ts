import { InvalidState, logger, type Command } from '@hicommonwealth/core';
import { config } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { alchemyGetTokenPrices } from '@hicommonwealth/shared';
import { models } from '../../database';
import { authRoles } from '../../middleware';
import { mustExist } from '../../middleware/guards';

const log = logger(import.meta);

export const PinTokenErrors = {
  NotSupported: 'Pinned tokens only supported on Alchemy supported chains',
  FailedToFetchPrice: 'Failed to fetch token price',
  OnlyBaseSupport: 'Only Base (ETH) chain supported',
  LaunchpadTokenFound: (communityId: string) =>
    `Community ${communityId} has an attached launchpad token`,
};

export function PinToken(): Command<typeof schemas.PinToken> {
  return {
    ...schemas.PinToken,
    auth: [authRoles('admin')],
    body: async ({ payload }) => {
      const { community_id, contract_address, chain_node_id } = payload;

      const chainNode = await models.ChainNode.findOne({
        where: { id: chain_node_id },
      });
      mustExist('ChainNode', chainNode);
      if (!chainNode.alchemy_metadata?.network_id) {
        throw new InvalidState(PinTokenErrors.NotSupported);
      }

      const existingToken = await models.PinnedToken.findOne({
        where: { community_id },
      });

      if (existingToken) {
        throw new InvalidState(
          PinTokenErrors.LaunchpadTokenFound(community_id),
        );
      }

      let price;
      let hasPricing = false;

      try {
        price = await alchemyGetTokenPrices({
          alchemyApiKey: config.ALCHEMY.APP_KEYS.PRIVATE,
          tokenSources: [
            {
              contractAddress: contract_address,
              alchemyNetworkId: chainNode.alchemy_metadata.network_id,
            },
          ],
        });

        if (
          Array.isArray(price?.data) &&
          price.data.length === 1 &&
          !price.data[0].error &&
          price.data[0].prices?.length > 0
        ) {
          hasPricing = true;
        }
      } catch (e: unknown) {
        if (e instanceof Error)
          log.error(e.message, e, {
            contractAddress: contract_address,
            alchemyNetworkId: chainNode.alchemy_metadata.network_id,
          });
        else {
          log.error(JSON.stringify(e), undefined, {
            contractAddress: contract_address,
            alchemyNetworkId: chainNode.alchemy_metadata.network_id,
          });
        }
      }

      return await models.PinnedToken.create({
        community_id,
        chain_node_id,
        contract_address,
        has_pricing: hasPricing,
      });
    },
  };
}
