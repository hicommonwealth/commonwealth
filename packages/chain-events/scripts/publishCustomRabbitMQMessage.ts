import type { IEventData } from 'chain-events/src/chain-bases/EVM/aave/types';
import type { CWEvent } from '../src';
import { SupportedNetwork } from '../src';
import { publishRmqMsg } from 'common-common/src/rabbitmq/util';
import { RABBITMQ_API_URI } from '../services/config';
import {
  RascalExchanges,
  RascalRoutingKeys,
} from 'common-common/src/rabbitmq/types';
import models from 'chain-events/services/database/database';

async function main() {
  const ceData = {
    id: 10,
    kind: 'proposal-created',
    values: ['0'],
    targets: ['0xE710CEd57456D3A16152c32835B5FB4E72D9eA5b'],
    endBlock: 16203604,
    executor: '0x64c7d40c07EFAbec2AafdC243bF59eaF2195c6dc',
    ipfsHash:
      '0x3876d28a014bc20432dcc3549ba95710446b98431d84c7f84fde6abe1baf527f',
    proposer: '0xb55a948763e0d386b6dEfcD8070a522216AE42b1',
    strategy: '0x90Dfd35F4a0BB2d30CDf66508085e33C353475D9',
    calldatas: [
      '0x00000000000000000000000092d6c1e31e14520e676a687f0a93788b716beff5000000000000000000000000a8541f948411b3f95d9e89e8d339a56a9ed3d00b000000000000000000000000000000000000000000002fa54641bae8aaa00000',
    ],
    signatures: ['transfer(address,address,uint256)'],
    startBlock: 16177324,
  };
  const chainEvent: CWEvent<IEventData> = {
    blockNumber: 16170754,
    data: <any>ceData,
    network: SupportedNetwork.Aave,
    chainName: 'Ethereum (Mainnet)',
    contractAddress: '0xEC568fffba86c094cf06b22134B23074DFE2252c',
  };

  const publishJson = await publishRmqMsg(
    RABBITMQ_API_URI,
    RascalExchanges.ChainEvents,
    RascalRoutingKeys.ChainEvents,
    chainEvent
  );

  console.log(publishJson);
}

async function clear() {
  try {
    let eventsDeleted = 0,
      entitiesDeleted = 0;
    await models.sequelize.transaction(async (t) => {
      const entityId = (
        await models.ChainEntity.findOne({
          where: {
            chain_name: 'Ethereum (Mainnet)',
            type_id: '10',
            contract_address: '0xEC568fffba86c094cf06b22134B23074DFE2252c',
          },
          transaction: t,
        })
      )?.id;

      if (entityId) {
        eventsDeleted = await models.ChainEvent.destroy({
          where: { entity_id: entityId },
          transaction: t,
        });

        entitiesDeleted = await models.ChainEntity.destroy({
          where: { id: entityId },
          transaction: t,
        });
      } else {
        console.log('Entity does not exist.');
      }
    });

    console.log(
      `Events deleted: ${eventsDeleted}\nEntities deleted: ${entitiesDeleted}`
    );
  } catch (e) {
    console.log('Failed to clear - reverted.');
    console.error(e);
  }

  process.exit(1);
}

if (process.argv[2] === 'clear') clear();
else main();
