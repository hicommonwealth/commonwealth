import { RawEvmEvent } from './types';
import { ChainAttributes } from '../../models/chain';
import { ContractAttributes } from '../../models/contract';
import models from '../../database';
import { QueryTypes } from 'sequelize';
import { NotificationDataAndCategory } from 'types';
import { NotificationCategories } from 'common-common/src/types';
import { SupportedNetwork } from 'chain-events/src';
import emitNotifications from '../../util/emitNotifications';
import { rollbar } from '../../util/rollbar';
import { factory, formatFilename } from 'common-common/src/logging';

const log = factory.getLogger(formatFilename(__filename));

export async function emitChainEventNotifs(
  chainNodeId: number,
  events: RawEvmEvent[]
): Promise<void> {
  if (!events.length) {
    return;
  }

  const queryFilter: [string, number][] = events.map((event) => [
    event.contractAddress,
    chainNodeId,
  ]);

  const chainData: {
    chain_id: ChainAttributes['id'];
    chain_network: ChainAttributes['network'];
    contract_address: ContractAttributes['address'];
    chain_node_id: ContractAttributes['chain_node_id'];
  }[] = await models.sequelize.query(
    `
    SELECT CH.id as chain_id, CH.network as chain_network, C.address as contract_address, C.chain_node_id
    FROM "Contracts" C
             JOIN "CommunityContracts" CC on C.id = CC.contract_id
             JOIN "Chains" CH ON CC.chain_id = CH.id
    WHERE (C.address, C.chain_node_id) IN (?);
  `,
    { type: QueryTypes.SELECT, raw: true, replacements: [queryFilter] }
  );

  for (const event of events) {
    const chain = chainData.find(
      (c) =>
        c.contract_address === event.contractAddress &&
        c.chain_node_id === chainNodeId
    );

    const notification: NotificationDataAndCategory = {
      categoryId: NotificationCategories.ChainEvent,
      data: {
        chain: chain.chain_id,
        network: chain.chain_network as unknown as SupportedNetwork,
        block_number: event.blockNumber,
        event_data: {
          kind: event.kind,
          // TODO: @Timothee for now all event sources have proposal id as the first argument in the future
          //  we will store raw arguments and use the custom labeling system when pulling/viewing event notifications
          // use toString to accommodate for open zeppelin gov (impact market) proposal id's which are hashes
          id: event.args[0].toString(),
        },
      },
    };
    emitNotifications(models, notification).catch((e) => {
      const msg = `Error occurred while emitting a chain-event notification for event: ${JSON.stringify(
        event,
        null,
        2
      )}`;
      log.error(msg, e);
      rollbar.error(msg, e);
    });
  }
}
