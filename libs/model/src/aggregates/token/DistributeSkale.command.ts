import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { skaleCalypso } from 'viem/chains';
import { config } from '../../config';
import { models } from '../../database';
import { mustExist } from '../../middleware/guards';

const BALANCE_THRESHOLD = 10000;
const DISTRIBUTION_VALUE = 10000000000000n;

export function DistributeSkale(): Command<typeof schemas.DistributeSkale> {
  return {
    ...schemas.DistributeSkale,
    auth: [],
    body: async ({ payload, actor }) => {
      const { address, eth_chain_id } = payload;

      const foundAddress = await models.Address.findOne({
        where: { user_id: actor.user.id!, address },
      });

      mustExist('Address', foundAddress);

      const chainNode = await models.ChainNode.findOne({
        where: { eth_chain_id },
        attributes: ['url', 'private_url'],
      });

      mustExist('Chain Node', chainNode);

      const client = createPublicClient({
        transport: http(chainNode.private_url ?? chainNode.url),
      });

      const balance = await client.getBalance({
        address: address as `0x${string}`,
      });

      if (balance < BALANCE_THRESHOLD) {
        const walletClient = createWalletClient({
          account: privateKeyToAccount(
            config.SKALE.PRIVATE_KEY as `0x${string}`,
          ),
          transport: http(chainNode.private_url ?? chainNode.url),
        });

        await walletClient.sendTransaction({
          chain: skaleCalypso,
          to: address as `0x${string}`,
          value: DISTRIBUTION_VALUE,
        });
      }
    },
  };
}
