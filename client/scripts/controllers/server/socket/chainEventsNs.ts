import {
  ChainEventNotification,
  WebsocketMessageNames,
  WebsocketNamespaces,
} from 'types';
import app from 'state';
import { Notification, NotificationSubscription } from 'models';
import { io, Socket } from 'socket.io-client';
import { fireChainEventBrowserNotification } from 'app';

export class ChainEventsNamespace {
  private ceNs: Socket;
  private _isConnected = false;

  constructor() {
    this.ceNs = io(`/${WebsocketNamespaces.ChainEvents}`, {
      transports: ['websocket'],
    });
    this.ceNs.on('connect', this.onconnect.bind(this));
    this.ceNs.on('disconnect', this.ondisconnect.bind(this));
    this.ceNs.on(
      WebsocketMessageNames.ChainEventNotification,
      this.onChainEvent.bind(this)
    );
  }

  public addChainEventSubscriptions(subs: NotificationSubscription[]) {
    if (this._isConnected) {
      const eventTypes = subs
        .map((x) => x.ChainEventType?.id)
        .filter((x) => !!x);
      console.log('Adding Websocket subscriptions for:', eventTypes);
      this.ceNs.emit(WebsocketMessageNames.NewSubscriptions, eventTypes);
    } else {
      console.log('ChainEventsNamespace is not connected');
    }
  }

  public deleteChainEventSubscriptions(subs: NotificationSubscription[]) {
    if (this._isConnected) {
      const eventTypes = subs
        .map((x) => x.ChainEventType?.id)
        .filter((x) => !!x);
      console.log('Deleting Websocket subscriptions for:', eventTypes);
      this.ceNs.emit(
        WebsocketMessageNames.DeleteSubscriptions,
        subs.map((x) => x.ChainEventType?.id)
      );
    } else {
      console.log('ChainEventsNamespace is not connected');
    }
  }

  private onChainEvent(notification: ChainEventNotification) {
    const subscription = app.user.notifications.subscriptions.find(
      (sub) =>
        sub.ChainEventType?.id === notification.ChainEvent.ChainEventType.id
    );
    if (!subscription) {
      // will theoretically never happen as subscriptions are added/removed on Socket.io as they happen locally
      console.log('Local subscription not found. Re-sync subscriptions!');
      return;
    }
    const notificationObj = Notification.fromJSON(notification, subscription);
    app.user.notifications.update(notificationObj);
    fireChainEventBrowserNotification(notificationObj);
  }

  private onconnect() {
    this._isConnected = true;
    this.addChainEventSubscriptions(app.user.notifications.subscriptions);
    console.log('Chain events namespace connected!');
  }

  private ondisconnect(reason) {
    this._isConnected = false;
    console.log('ChainEvents Namespace Disconnected:', reason);
  }

  public get isConnected() {
    return this._isConnected;
  }
}
