import sleep from 'sleep-promise';
import { Erc20Events } from '@commonwealth/chain-events';
import models from '../database';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

export default class Erc20SubscriberHolder {
  private _subscriber: Erc20Events.Subscriber;

  constructor(private _new_ce_system?: boolean) {}

  public setSubscriber(subscriber: Erc20Events.Subscriber) {
    this._subscriber = subscriber;
  }

  public async subscribeNewToken(tokenAddress: string) {
    if (this._new_ce_system) {
      const chainInstance = await models.Chain.findOne({
        include: [{
          model: models.ChainNode,
          where: { address: tokenAddress }
        }]
      });

      if (chainInstance && chainInstance.has_chain_events_listener) {
        log.info('Token is already being listened to');
      } else if (chainInstance && !chainInstance.has_chain_events_listener) {
        chainInstance.has_chain_events_listener = true;
        await chainInstance.save();
      } else {
        log.warn('Token not found in DB');
      }
      return;
    }
    // this is a loading switch, waiting for server.ts to initialize the subscribers
    if (!this._subscriber) {
      await sleep(1000);
      this.subscribeNewToken(tokenAddress);
    } else {
      this._subscriber.addNewToken(tokenAddress);
    }
  }
}
