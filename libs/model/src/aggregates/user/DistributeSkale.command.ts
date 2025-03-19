import { type Command } from '@hicommonwealth/core';
import { getBalance, sendTransaction } from '@hicommonwealth/evm-protocols';
import * as schemas from '@hicommonwealth/schemas';
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
      const { address, eth_chain_id } = payload as {
        address: `0x${string}`;
        eth_chain_id: number;
      };

      const foundAddress = await models.Address.findOne({
        where: { user_id: actor.user.id!, address },
      });

      mustExist('Address', foundAddress);

      const chainNode = await models.ChainNode.findOne({
        where: { eth_chain_id },
        attributes: ['url', 'private_url'],
      });

      mustExist('Chain Node', chainNode);

      const rpcUrl = chainNode.private_url ?? chainNode.url;

      const balance = await getBalance({
        address,
        rpcUrl,
      });

      if (balance < BALANCE_THRESHOLD) {
        await sendTransaction({
          privateKey: config.SKALE.PRIVATE_KEY as `0x${string}`,
          to: address,
          value: DISTRIBUTION_VALUE,
          rpcUrl,
        });
      }
    },
  };
}
