import type events from 'events';

import type { CWEvent, IChainEventData, IEventHandler } from '../src';
import { ChainEventKinds, Listener } from '../src';
import { expect } from 'chai';
import Web3 from 'web3';

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

export function eventMatch(
  event: any,
  kind: string,
  chainName: string,
  contractAddress?: string,
  proposalId?: string,
  transferAmount?: string,
  from?: string
) {
  expect(event, 'event is undefined').to.not.be.undefined;
  if (contractAddress)
    expect(event.contractAddress, 'contract address does not match').to.equal(
      contractAddress
    );

  if (proposalId)
    expect(parseInt(event.data.id), 'proposal id does not match').to.equal(
      Number(proposalId)
    );

  if (transferAmount)
    expect(event.data.value, 'transfer amount does not match').to.equal(
      Web3.utils.toWei(transferAmount)
    );

  if (from)
    expect(event.data.from, 'from address does not match').to.equal(from);

  expect(event.data.kind, 'event kind does not match').to.equal(kind);
  expect(event.chainName, 'event chain does not match').to.equal(chainName);
}

export function findEvent(
  events: any[],
  kind: string,
  chainName: string,
  blockNumber: number,
  contractAddress?: string
) {
  return events.find(
    (event) =>
      event.data.kind === kind &&
      event.chainName === chainName &&
      event.blockNumber === blockNumber &&
      event.contractAddress === contractAddress
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
