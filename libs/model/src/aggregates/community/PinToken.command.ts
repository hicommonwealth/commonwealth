import { InvalidState, logger, type Command } from '@hicommonwealth/core';
import { ValidChains } from '@hicommonwealth/evm-protocols';
import * as schemas from '@hicommonwealth/schemas';
import { alchemyGetTokenPrices } from '@hicommonwealth/shared';
import { config } from '../../config';
import { models } from '../../database';
import { authRoles } from '../../middleware';
import { mustExist } from '../../middleware/guards';

const log = logger(import.meta);

export const PinTokenErrors = {
  NotSupported: 'Pinned tokens only supported on Alchemy supported chains',
  FailedToFetchPrice: 'Failed to fetch token price',
  OnlyBaseOrSoneiumSupport: `Only Base (Id: ${ValidChains.Base}) or Soneium (Id: ${ValidChains.Soneium}) chain supported`,
  LaunchpadTokenFound: (communityId: string) =>
    `Community ${communityId} has an attached launchpad token`,
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

      if (
        ![ValidChains.Base, ValidChains.Soneium].includes(
          chainNode.eth_chain_id!,
        )
      ) {
        throw new InvalidState(PinTokenErrors.OnlyBaseOrSoneiumSupport);
      }

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
            PinTokenErrors.LaunchpadTokenFound(community_id),
          );
      }

      if (
        !chainNode.url.includes('alchemy') ||
        !chainNode.private_url?.includes('alchemy') ||
        // for soneium alchemy returns price_not_supported: true, but does return price data
        // when called by alchemyGetTokenPrices, skipping price_not_supported=true checks
        !chainNode.alchemy_metadata
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

      const pinnedToken = await models.sequelize.transaction(
        async (transaction) => {
          await models.Community.update(
            { thread_purchase_token: contract_address },
            { where: { id: community.id }, transaction },
          );

          return await models.PinnedToken.create(
            {
              community_id,
              chain_node_id,
              contract_address,
            },
            { transaction },
          );
        },
      );

      return pinnedToken;
    },
  };
}
