import { type Command, AppError } from '@hicommonwealth/core';
import { commonProtocol as cp } from '@hicommonwealth/evm-protocols';
import * as schemas from '@hicommonwealth/schemas';
import { config } from '../config';
import { models } from '../database';
import { mustExist } from '../middleware/guards';

const BALANCE_THRESHOLD = 10000;

export function DistributeSkale(): Command<typeof schemas.DistributeSkale> {
  return {
    ...schemas.DistributeSkale,
    auth: [],
    body: async ({ payload }) => {
      const { address, eth_chain_id } = payload;

      const chainNode = await models.ChainNode.findOne({
        where: { eth_chain_id },
        attributes: ['url', 'private_url'],
      });

      mustExist('Chain Node', chainNode);

      let balance;
      try {
        balance = await cp.getBalance(
          address,
          chainNode.private_url ?? chainNode.url,
        );
      } catch (error) {
        throw new AppError(
          `Failed to fetch skale balance for address ${address}`,
        );
      }

      if (balance < BALANCE_THRESHOLD) {
        const response = await fetch(`${config.SKALE.API_URL}/${address}`, {
          method: 'GET',
        });

        if (!response.ok) {
          throw new AppError(`Failed to claim sFUEL: ${response.statusText}`);
        }
      }
    },
  };
}
