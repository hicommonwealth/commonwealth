import { IEventHandler, CWEvent, IChainEventData, SubstrateTypes } from '@commonwealth/chain-events';


export default class extends IEventHandler {
  constructor(
    private readonly _models,
    private readonly _chain: string
  ) {
    super();
  }

  /**
    Event handler to store slash information of validators details in DB.
  */
  public async handle(event: CWEvent < IChainEventData >, dbEvent) {
    // 1) if other event type ignore and do nothing.
    if (event.data.kind !== SubstrateTypes.EventKind.HeartbeatReceived) {
      return dbEvent;
    }
    const heartbeatEventData = event.data;

    // logging Heartbeat on the terminal only as per discussion with Drew.
    console.log(`Heartbeat Received from AccountId: ${heartbeatEventData.authorityId}`);

    return dbEvent;
  }
}
