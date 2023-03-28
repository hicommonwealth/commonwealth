import type events from 'events';

import type { CWEvent, IChainEventData, IEventHandler } from '../src';
import { ChainEventKinds } from '../src';
import { expect } from 'chai';

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

export function eventMatch(event, kind, proposalId, chain_id) {
  expect(event.data.kind).to.equal(kind);
  expect(parseInt(event.data.id)).to.equal(Number(proposalId));
  expect(event.chain).to.equal(chain_id);
}
