import { publishRmqMsg } from 'common-common/src/rabbitmq/util';
import type { ITransfer, IEventData } from 'chain-events/src/chains/aave/types';
import { EventKind } from 'chain-events/src/chains/aave/types';
import type { CWEvent } from 'chain-events/src';
import { SupportedNetwork } from 'chain-events/src';
import { v4 as uuidv4 } from 'uuid';
import {
  RascalExchanges,
  RascalRoutingKeys,
} from 'common-common/src/rabbitmq/types';
import { RABBITMQ_API_URI } from 'commonwealth/server/config';

async function publishRmqMessageScript() {
  const ceData: ITransfer = {
    kind: EventKind.Transfer,
    tokenAddress: uuidv4(),
    from: uuidv4(),
    to: uuidv4(),
    amount: uuidv4(),
  };
  // // create a fake aave-transfer event
  const chainEvent: CWEvent<IEventData> = {
    blockNumber: Math.floor(Math.random() * 1000000),
    data: ceData,
    network: SupportedNetwork.Aave,
    chain: 'aave',
  };

  const publishJson = await publishRmqMsg(
    RABBITMQ_API_URI,
    RascalExchanges.ChainEvents,
    RascalRoutingKeys.ChainEvents,
    chainEvent
  );

  console.log(publishJson);
}

publishRmqMessageScript();
