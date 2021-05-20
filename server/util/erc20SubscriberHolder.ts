import sleep from 'sleep-promise';

export default class Erc20SubscriberHolder {
  private _subscriber;

  public setSubscriber(subscriber) {
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
