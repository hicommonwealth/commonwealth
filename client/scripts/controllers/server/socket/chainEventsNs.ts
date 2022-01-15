import { WebsocketMessageType, WebsocketNamespaces } from 'types';
import app from 'state';
import { Notification, NotificationSubscription } from 'models';
import { io } from 'socket.io-client';

export class ChainEventsNamespace {
  private ceNs;
  private _isConnected = false;

  constructor() {
    this.ceNs = io(`/${WebsocketNamespaces.ChainEvents}`, {
      transports: ['websocket'],
    });
    this.ceNs.on('connect', this.onconnect.bind(this));
    this.ceNs.on('disconnect', this.ondisconnect.bind(this));
    this.ceNs.on(
      WebsocketMessageType.ChainEventNotification,
      this.onChainEvent.bind(this)
    );
  }

  public addChainEventSubscriptions(subs: NotificationSubscription[]) {
    if (this._isConnected) {
      const eventTypes = subs.map((x) => x.ChainEventType?.id).filter((x) => !!x);
      console.log('Adding Websocket subscriptions for:', eventTypes);
      this.ceNs.emit('newSubscriptions', eventTypes);
    } else {
      console.log('ChainEventsNamespace is not connected');
    }
  }

  public deleteChainEventSubscriptions(subs: NotificationSubscription[]) {
    if (this._isConnected) {
      const eventTypes = subs.map((x) => x.ChainEventType?.id).filter((x) => !!x);
      console.log('Deleting Websocket subscriptions for:', eventTypes);
      this.ceNs.emit(
        'deleteSubscriptions',
        subs.map((x) => x.ChainEventType?.id)
      );
    } else {
      console.log('ChainEventsNamespace is not connected');
    }
  }

  private onChainEvent(notification: any) {
    const subscription = app.user.notifications.subscriptions.find(
      (sub) => sub.ChainEventType?.id === notification.ChainEvent.ChainEventType.id
    );
    const notificationObj = Notification.fromJSON(notification, subscription);
    app.user.notifications.update(notificationObj);
  }

  private onconnect() {
    this._isConnected = true;
    this.addChainEventSubscriptions(app.user.notifications.subscriptions);
    console.log('Chain events namespace connected!');
  }

  private ondisconnect(reason) {
    this._isConnected = false;
    console.log(reason);
    // TODO: notify user that live chain-events notifications are disabled?
  }

  public get isConnected() {
    return this._isConnected;
  }
}
