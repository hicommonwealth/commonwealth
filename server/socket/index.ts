import WebSocket from 'ws';
import * as jwt from 'jsonwebtoken';
import http from 'http';
import express from 'express';
import * as net from 'net';
import { WebsocketEventType, WebsocketMessageType, IWebsocketsPayload } from '../../shared/types';
import { JWT_SECRET } from '../config';

import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

const ALIVE_TIMEOUT = 30 * 1000; // heartbeats are 15 seconds
const EXPIRATION_TIME = 15 * 60 * 1000; // 15 minutes, same as session expiration

class AuthWebSocket extends WebSocket {
  isAlive?: boolean;
  aliveTimer?: NodeJS.Timeout;
  expirationTimer?: NodeJS.Timeout;
  isAuthenticated?: boolean;
  user?: any;
}

const userMap: { [user: number]: AuthWebSocket } = {};
const sessionMap: { [session: string]: AuthWebSocket } = {};

export default function (
  wss: WebSocket.Server,
  server: http.Server,
  sessionParser: express.RequestHandler,
  logging: boolean
) {
  server.on(WebsocketEventType.Upgrade, (req: express.Request, socket: net.Socket, head) => {
    log.info('\nParsing session from request...\n');
    sessionParser(req, {} as express.Response, () => {
      if (!req.session) {
        log.error('No session found.');
        socket.destroy();
        return;
      }

      log.info('Session is parsed!');

      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit(WebsocketEventType.Connection, ws, req);
      });
    });
  });

  wss.on(WebsocketEventType.Connection, (ws: AuthWebSocket, req: express.Request) => {
    const sessionId = req.sessionID;
    sessionMap[sessionId] = ws;

    let userId: number;
    if (req.session && req.session.passport && req.session.passport.user) {
      userId = req.session.passport.user;
      userMap[userId] = ws;
    }
    ws.on(WebsocketEventType.Message, (message) => {
      log.trace(`Received message ${message} from session ${sessionId}`);
      try {
        const payload: IWebsocketsPayload<any> = JSON.parse(message.toString());
        if (payload.event === WebsocketMessageType.Heartbeat) {
          ws.isAlive = true;

          // reset liveness timers
          if (ws.aliveTimer) clearTimeout(ws.aliveTimer);
          ws.aliveTimer = setTimeout(() => { ws.isAlive = false; }, ALIVE_TIMEOUT);

          if (ws.expirationTimer) clearTimeout(ws.expirationTimer);
          ws.expirationTimer = setTimeout(() => {
            // TODO: do i need to manually close the socket here?
            console.log(`Websocket ${sessionId} expired, emitting close`);
            wss.emit(WebsocketEventType.Close);
          }, EXPIRATION_TIME);

          // get user if verified
          if (payload.jwt) {
            jwt.verify(payload.jwt, JWT_SECRET, async (err, decodedUser) => {
              if (err) {
                log.info(`received message with malformed JWT: ${payload.jwt}`);
              } else {
                ws.isAuthenticated = true;
                ws.user = decodedUser;
              }
            });
          }
        } else {
          log.error('received malformed message');
        }
      } catch (e) {
        log.error('received malformed message');
      }
    });

    ws.on(WebsocketEventType.Close, () => {
      console.log(`Received close event for websocket ${sessionId}`);
      if (sessionMap[sessionId]) {
        delete sessionMap[sessionId];
      }
      if (userId && userMap[userId]) {
        delete userMap[userId];
      }
    });
  });

  // TODO: maybe unify these, or else remove the event type from payload and add it manually here?
  wss.on(WebsocketMessageType.InitializeScrollback, (payload: IWebsocketsPayload<any>, userIds: number[]) => {
    if (logging) log.info(`Payloading ${JSON.stringify(payload)} to users ${JSON.stringify(userIds)}`);
    // eslint-disable-next-line no-restricted-syntax
    for (const user of userIds) {
      if (user && user in userMap && userMap[user].isAlive) {
        userMap[user].send(JSON.stringify(payload));
      }
    }
  });

  wss.on(
    WebsocketMessageType.Notification,
    (payload: IWebsocketsPayload<any>, notifications: { [user: number]: any }) => {
      if (logging) {
        log.info(`Payloading ${JSON.stringify(payload)} to users ${JSON.stringify(Object.keys(notifications))}`);
      }
      // eslint-disable-next-line no-restricted-syntax
      for (const [ user, notification ] of Object.entries(notifications)) {
        if (user && user in userMap && userMap[user].isAlive) {
          // augment notification with unique database id
          payload.data.id = notification.id;
          payload.data.subscription_id = notification.subscription_id;
          userMap[user].send(JSON.stringify(payload));
        }
      }
    }
  );

  wss.on(WebsocketMessageType.ChainEntity, (payload: IWebsocketsPayload<any>) => {
    if (logging) log.info(`Payloading ${JSON.stringify(payload)}`);
    // eslint-disable-next-line no-restricted-syntax
    for (const [ session, sessionSocket ] of Object.entries(sessionMap)) {
      if (sessionSocket && sessionSocket.isAlive) {
        sessionSocket.send(JSON.stringify(payload), (err?) => {
          if (err) {
            log.error(`Failed to send chain entity to session: ${session}`);
            log.error(`Error: ${err}.`);
            // TODO: remove from map if err is that it's closed?
          }
        });
      }
    }
  });
}
