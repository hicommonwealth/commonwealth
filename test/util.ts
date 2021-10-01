import events from 'events';

import {
  CWEvent,
  IChainEventData,
  IEventHandler,
  ChainEventKinds,
} from '../src';

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

function delay(interval) {
  return it('delaying...', (done) => {
    setTimeout(() => done(), interval);
  }).timeout(interval + 100);
}

export function discoverReconnectRange(chain: string) {
  // TODO: populate with good ranges for specific chains
  switch (chain) {
    case 'polkadot':
      return { startBlock: 650000 };
  }
}
