import sleep from 'sleep-promise';
import { Erc20Events } from '@commonwealth/chain-events';

export default class Erc20SubscriberHolder {
  private _subscriber: Erc20Events.Subscriber;

  public setSubscriber(subscriber: Erc20Events.Subscriber) {
    this._subscriber = subscriber;
  }

  public async subscribeNewToken(tokenAddress: string) {
    if (!this._subscriber) {
      await sleep(1000);
      this.subscribeNewToken(tokenAddress);
    } else {
      this._subscriber.addNewToken(tokenAddress);
    }
  }

}
