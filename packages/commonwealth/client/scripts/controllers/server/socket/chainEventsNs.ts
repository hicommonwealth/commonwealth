import type { Socket } from 'socket.io-client';
import app from 'state';
import type { ChainEventNotification } from 'types';
import { WebsocketMessageNames, WebsocketNamespaces } from 'types';
import Notification from '../../../models/Notification';
import type NotificationSubscription from '../../../models/NotificationSubscription';

export class ChainEventsNamespace {
  private ceNs: Socket;
  private _isConnected = false;
  private subscriptionRoomsJoined = new Set();

  public async init() {
    const { io } = await import('socket.io-client');
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
      const roomsToJoin = [];
      for (const sub of subs) {
        const chain = sub.chainId;
        if (!this.subscriptionRoomsJoined.has(chain)) {
          roomsToJoin.push(chain);
          this.subscriptionRoomsJoined.add(chain);
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
      const roomsToLeave = [];
      for (const sub of subs) {
        const chain = sub.chainId;
        if (this.subscriptionRoomsJoined.has(chain)) {
          roomsToLeave.push(chain);
          this.subscriptionRoomsJoined.delete(chain);
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
      (sub) => sub.chainId === notification.ChainEvent.chain
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
