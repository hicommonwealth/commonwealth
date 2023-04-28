import type events from 'events';

import type { CWEvent, IChainEventData, IEventHandler } from '../src';
import { ChainEventKinds } from '../src';
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
  chain_id,
  proposalId?: string,
  transferAmount?: string
) {
  expect(event, 'event is undefined').to.not.be.undefined;
  if (proposalId)
    expect(parseInt(event.data.id), 'proposal id does not match').to.equal(
      Number(proposalId)
    );

  if (transferAmount)
    expect(event.data.value, 'transfer amount does not match').to.equal(
      Web3.utils.toWei(transferAmount)
    );

  expect(event.data.kind, 'event kind does not match').to.equal(kind);
  expect(event.chain, 'event chain does not match').to.equal(chain_id);
}

export function findEvent(events: any[], kind: string, chain_id: string, blockNumber: number) {
  return events.find((event) =>
    event.data.kind === kind &&
    event.chain === chain_id &&
    event.blockNumber === blockNumber
  );
}
