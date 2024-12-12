import { InvalidState, logger, type Command } from '@hicommonwealth/core';
import { commonProtocol as cp } from '@hicommonwealth/evm-protocols';
import { config } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { alchemyGetTokenPrices } from '@hicommonwealth/shared';
import { models } from '../database';
import { authRoles } from '../middleware';
import { mustExist } from '../middleware/guards';

const log = logger(import.meta);

export const PinTokenErrors = {
  NotSupported: 'Pinned tokens only supported on Alchemy supported chains',
  FailedToFetchPrice: 'Failed to fetch token price',
};

export function PinToken(): Command<typeof schemas.PinToken> {
  return {
    ...schemas.PinToken,
    auth: [authRoles('admin')],
    body: async ({ payload }) => {
      const { community_id, contract_address, chain_node_id } = payload;

      const chainNode = await models.ChainNode.scope('withPrivateData').findOne(
        {
          where: {
            id: chain_node_id,
          },
        },
      );
      mustExist('ChainNode', chainNode);

      if (chainNode.eth_chain_id !== cp.ValidChains.Base)
        throw new InvalidState('Only Base (ETH) chain supported');

      const community = await models.Community.findOne({
        where: {
          id: community_id,
        },
      });
      mustExist('Community', community);

      if (community.namespace) {
        const launchpadToken = await models.LaunchpadToken.findOne({
          where: {
            namespace: community.namespace,
          },
        });

        if (launchpadToken)
          throw new InvalidState(
            `Community ${community.name} has an attached launchpad token`,
          );
      }

      if (
        !chainNode.url.includes('alchemy') ||
        !chainNode.private_url?.includes('alchemy') ||
        !chainNode.alchemy_metadata?.price_api_supported
      ) {
        throw new InvalidState(PinTokenErrors.NotSupported);
      }

      let price: Awaited<ReturnType<typeof alchemyGetTokenPrices>> | undefined;
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

      if (
        !Array.isArray(price?.data) ||
        price.data.length !== 1 ||
        price.data[0].error
      ) {
        log.error(PinTokenErrors.FailedToFetchPrice, undefined, {
          price,
        });
        throw new InvalidState(PinTokenErrors.FailedToFetchPrice);
      }

      return await models.PinnedToken.create({
        community_id,
        chain_node_id,
        contract_address,
      });
    },
  };
}
