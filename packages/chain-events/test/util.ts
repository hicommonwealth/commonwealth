import type events from 'events';

import type { CWEvent, IChainEventData, IEventHandler } from '../src';
import { ChainEventKinds, Listener } from '../src';
import { expect } from 'chai';
import Web3 from 'web3';
import {
  RmqCENotificationCUD,
  RmqEntityCUD,
} from 'common-common/src/rabbitmq/types';

export class TestHandler implements IEventHandler {
  private counter = 0;

  constructor(
    private _verbose: boolean,
    protected emitter: events.EventEmitter
  ) {}

  public async handle(
    event: CWEvent<IChainEventData>
  ): Promise<IChainEventData> {
    if (this._verbose)
      console.log(`Received event: ${JSON.stringify(event, null, 2)}`);
    if (ChainEventKinds.includes(event.data.kind)) {
      ++this.counter;
      this.emitter.emit('eventHandled');
    }
    return event.data;
  }
}

export interface MinUniqueCWEventData {
  kind: string;
  chainName: string;
  blockNumber: number;
  contractAddress?: string;
}

export function findCwEvent(events: CWEvent[], data: MinUniqueCWEventData) {
  const matchingEvents = events.filter(
    (event) =>
      event.data.kind === data.kind &&
      event.chainName === data.chainName &&
      event.blockNumber === data.blockNumber &&
      event.contractAddress === data.contractAddress
  );

  if (matchingEvents.length > 1)
    throw new Error(
      'Multiple matching events found. Please provide more specific search data'
    );
  else return matchingEvents[0];
}

export interface CwEventMatchOptions extends MinUniqueCWEventData {
  proposalId?: string;
  transferAmount?: string;
  from?: string;
  to?: string;
  owner?: string;
  approved?: string;
}

export function cwEventMatch(event: CWEvent<any>, data: CwEventMatchOptions) {
  expect(event, 'event is undefined').to.not.be.undefined;
  if (data.contractAddress)
    expect(event.contractAddress, 'contract address does not match').to.equal(
      data.contractAddress
    );

  if (data.proposalId)
    expect(parseInt(event.data.id), 'proposal id does not match').to.equal(
      Number(data.proposalId)
    );

  if (data.transferAmount)
    expect(event.data.value, 'transfer amount does not match').to.equal(
      Web3.utils.toWei(data.transferAmount)
    );

  if (data.from)
    expect(event.data.from, 'from address does not match').to.equal(data.from);

  if (data.to)
    expect(event.data.to, 'to address does not match').to.equal(data.to);

  if (data.owner)
    expect(event.data.owner, 'owner address does not match').to.equal(
      data.owner
    );

  if (data.approved)
    expect(event.data.approved, 'approved address does not match').to.equal(
      data.approved
    );

  expect(event.blockNumber, 'event block number does not match').to.equal(
    data.blockNumber
  );
  expect(event.data.kind, 'event kind does not match').to.equal(data.kind);
  expect(event.chainName, 'event chain does not match').to.equal(
    data.chainName
  );
}

export function getEvmSecondsAndBlocks(days: number) {
  const secs = Math.round(days * 86400);
  const blocks = Math.round(secs / 12 + 500);
  return { secs, blocks };
}

// sleeps until the listener reaches the desired block or until the maxWaitTime is reached
export async function waitUntilBlock(
  blockNum: number,
  listener: Listener<any, any, any, any, any>,
  maxWaitTime = 120
): Promise<void> {
  let waitTime = 0;
  while (true) {
    if (waitTime > maxWaitTime) break;
    if (listener.lastCachedBlockNumber >= blockNum) break;
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));
    waitTime += 1;
  }
}

export function notificationCUDMatch(
  notification: RmqCENotificationCUD.RmqMsgType,
  data: RmqCENotificationCUD.RmqMsgType
) {
  RmqCENotificationCUD.checkMsgFormat(notification);
  expect(notification).to.deep.equal(data);
}

export function entityCUDMatch(
  entityMsg: RmqEntityCUD.RmqMsgType,
  data: RmqEntityCUD.RmqMsgType
) {
  RmqEntityCUD.checkMsgFormat(entityMsg);
  expect(entityMsg).to.deep.equal(data);
}
