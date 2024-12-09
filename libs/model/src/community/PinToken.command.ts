import { InvalidState, logger, type Command } from '@hicommonwealth/core';
import { config } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import { alchemyGetTokenPrices } from '@hicommonwealth/shared';
import { models } from '../database';
import { authRoles } from '../middleware';
import { mustExist } from '../middleware/guards';

const log = logger(import.meta);

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

      if (
        !chainNode.url.includes('alchemy') ||
        !chainNode.private_url?.includes('alchemy') ||
        !chainNode.alchemy_metadata?.price_api_supported
      ) {
        throw new InvalidState(
          'Pinned tokens only supported on Alchemy supported chains',
        );
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
        throw new InvalidState('Could not fetch token price');
      }

      return await models.PinnedToken.create({
        community_id,
        chain_node_id,
        contract_address,
      });
    },
  };
}
