import {
  ChainEventNotification,
  WebsocketMessageNames,
  WebsocketNamespaces,
} from 'types';
import m from 'mithril';
import app from 'state';
import { Notification, NotificationSubscription } from 'models';
import { io, Socket } from 'socket.io-client';

export class ChainEventsNamespace {
  private ceNs: Socket;
  private _isConnected = false;
  private subscriptionRoomsJoined = new Set();

  constructor() {}

  public async init() {
    this.ceNs = io(`/${WebsocketNamespaces.ChainEvents}`, {
      transports: ['websocket'],
    });
    this.ceNs.on('connect', this.onConnect.bind(this));
    this.ceNs.on('disconnect', this.onDisconnect.bind(this));
    this.ceNs.on(
      WebsocketMessageNames.ChainEventNotification,
      this.onChainEvent.bind(this)
    );
  }

  public addChainEventSubscriptions(subs: NotificationSubscription[]) {
    console.log('first subs', subs);
    if (this._isConnected) {
      const eventTypes = subs
        .map((x) => x.ChainEventType?.id)
        .filter((x) => !!x);

      console.log('subs', subs);
      console.log('eventTypes', eventTypes);
      const roomsToJoin = [];
      for (const eventType of eventTypes) {
        if (!this.subscriptionRoomsJoined.has(eventType)) {
          roomsToJoin.push(eventType);
          this.subscriptionRoomsJoined.add(eventType);
        }
      }
      if (roomsToJoin.length > 0) {
        console.log('Adding Websocket subscriptions for:', roomsToJoin);
        this.ceNs.emit(WebsocketMessageNames.NewSubscriptions, roomsToJoin);
      }
    } else {
      console.log('ChainEventsNamespace is not connected');
    }
  }

  public deleteChainEventSubscriptions(subs: NotificationSubscription[]) {
    if (this._isConnected) {
      const eventTypes = subs
        .map((x) => x.ChainEventType?.id)
        .filter((x) => !!x);
      const roomsToLeave = [];
      for (const eventType of eventTypes) {
        if (this.subscriptionRoomsJoined.has(eventType)) {
          roomsToLeave.push(eventType);
          this.subscriptionRoomsJoined.delete(eventType);
        }
      }

      if (roomsToLeave.length > 0) {
        console.log('Deleting Websocket subscriptions for:', roomsToLeave);
        this.ceNs.emit(WebsocketMessageNames.DeleteSubscriptions, roomsToLeave);
      }
    } else {
      console.log('ChainEventsNamespace is not connected');
    }
  }

  private onChainEvent(notification: ChainEventNotification) {
    console.log('notification initially', notification);
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
  }

  private onConnect() {
    this._isConnected = true;
    console.log(
      'onconnect',
      app.user.notifications,
      app.user.notifications.subscriptions
    );
    m.redraw();

    this.addChainEventSubscriptions(app.user.notifications.subscriptions);
    console.log('Chain events namespace connected!');
  }

  private onDisconnect(reason) {
    this._isConnected = false;
    console.log('ChainEvents Namespace Disconnected:', reason);
  }

  public get isConnected() {
    return this._isConnected;
  }
}
