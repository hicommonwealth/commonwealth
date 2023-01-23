import type { NotificationSubscription } from 'models';
import { Notification } from 'models';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import app from 'state';
import type { ChainEventNotification } from 'types';
import { WebsocketMessageNames, WebsocketNamespaces } from 'types';

export class ChainEventsNamespace {
  private ceNs: Socket;
  private _isConnected = false;
  private subscriptionRoomsJoined = new Set();

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
    if (this._isConnected) {
      const filteredSubs = subs.filter((x) => !!x.chainEntityId);
      const roomsToJoin = [];
      for (const sub of filteredSubs) {
        if (!this.subscriptionRoomsJoined.has(sub.chainEntityId)) {
          roomsToJoin.push(sub.chainEntityId);
          this.subscriptionRoomsJoined.add(sub.chainEntityId);
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
      const filteredSubs = subs.filter((x) => !!x.chainEntityId);
      const roomsToLeave = [];
      for (const sub of filteredSubs) {
        if (this.subscriptionRoomsJoined.has(sub.chainEntityId)) {
          roomsToLeave.push(sub.chainEntityId);
          this.subscriptionRoomsJoined.delete(sub.chainEntityId);
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
    const subscription = app.user.notifications.subscriptions.find(
      (sub) =>
        sub.chainEntityId === notification.ChainEvent.entity_id
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
