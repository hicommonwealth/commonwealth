import { CWEvent, SupportedNetwork } from 'chain-events/src';
import { EventKind, IEventData, ITransfer } from 'chain-events/src/chains/aave/types';
import { RascalExchanges, RascalRoutingKeys } from 'common-common/src/rabbitmq';
import { publishRmqMsg } from 'common-common/src/rabbitmq/util';
import { RABBITMQ_API_URI } from 'commonwealth/server/config';
import { v4 as uuidv4 } from 'uuid';

async function publishRmqMessageScript() {
  const ceData: ITransfer = {
    kind: EventKind.Transfer,
    tokenAddress: uuidv4(),
    from: uuidv4(),
    to: uuidv4(),
    amount: uuidv4()
  }
  // // create a fake aave-transfer event
  const chainEvent: CWEvent<IEventData> = {
    blockNumber: Math.floor(Math.random() * 1000000),
    data: ceData,
    network: SupportedNetwork.Aave,
    chain: 'aave'
  }

  const publishJson = await publishRmqMsg(
    RABBITMQ_API_URI,
    RascalExchanges.ChainEvents,
    RascalRoutingKeys.ChainEvents,
    chainEvent
  );

  console.log(publishJson)
}

publishRmqMessageScript();
