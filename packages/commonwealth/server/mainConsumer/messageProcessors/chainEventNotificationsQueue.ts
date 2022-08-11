import { DB } from "../../database";
import { Logger } from "typescript-logging";
import { CWEvent, IChainEventKind } from "chain-events/src";
import { ChainEventNotification } from "../../../shared/types";
import { NotificationCategories } from 'common-common/src/types';


export type Ithis = {
  models: DB;
  log: Logger;
  excludedEvents: IChainEventKind[]
}

export async function processChainEventNotifications(
  this: Ithis,
  chainEvent: CWEvent
) {

  if (this.excludedEvents.includes(chainEvent.data.kind)) {
    this.log.trace(`Skipping event!`);
    return;
  }
  try {

    // creates a notification instance if it doesn't exist and then creates NotificationsRead instances for subscribers
    const dbNotification = await this.models.Subscription.emitNotifications(
      this.models,
      NotificationCategories.ChainEvent,
      chainEvent.chainEventType.id,
      { chainEvent, chainEventType: dbEventType, chain_id: event.chain },
      { chainEvent: dbEvent, chainEventType: dbEventType, chain: event.chain }, // TODO: add webhook data once specced out
      event.excludeAddresses,
      event.includeAddresses
    );

    // construct notification with all the necessary data from the DB (without having to re-query using joins)
    const formattedEvent: ChainEventNotification = dbNotification.toJSON();
    formattedEvent.ChainEvent = dbEvent.toJSON()
    formattedEvent.ChainEvent.ChainEventType = dbEventType.toJSON()
  } catch (e) {
    if (e.errors && e.errors.length > 0) {
      const errors = e.errors.map(x => x.message)
      this.log.error(`Failed to generate notification (${e.message}): ${errors}!\nevent: ${JSON.stringify(event)}\ndbEvent: ${JSON.stringify(dbEvent)}\n`);
    } else {
      this.log.error(`Failed to generate notification: ${e.message}\nevent: ${JSON.stringify(event)}\ndbEvent: ${JSON.stringify(dbEvent)}\n`);
    }
  }
}
