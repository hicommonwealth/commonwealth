import _ from 'underscore';
import {
  IEventHandler,
  CWEvent,
  IChainEventData,
  CommonwealthTypes,
} from '@commonwealth/chain-events';
import { addPrefix, factory } from '../../shared/logging';

export default class extends IEventHandler {
  public readonly name = 'Project';

  constructor(private readonly _models) {
    super();
  }

  /**
   * Handles an identity-related event by writing the corresponding update into
   * the database.
   */
  public async handle(event: CWEvent<IChainEventData>, dbEvent) {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const log = factory.getLogger(addPrefix(__filename, [event.network, event.chain]));

    // do nothing if wrong type of event
    if (
      // TODO: ensure this query works
      !Object.keys(CommonwealthTypes.EventKind).includes(event.data.kind)
    ) {
      return dbEvent;
    }

    // TODO: handle events
    return dbEvent;
  }
}
