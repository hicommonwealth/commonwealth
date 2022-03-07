// Use https://admin.socket.io/#/ to monitor

// TODO: turn on session affinity in all staging environments and in production to enable polling in transport options
import { Server, Socket } from 'socket.io';
import { instrument } from '@socket.io/admin-ui';
import { BrokerConfig } from 'rascal';
import * as jwt from 'jsonwebtoken';
import { ExtendedError } from 'socket.io/dist/namespace';
import * as http from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { createCeNamespace, publishToCERoom } from './chainEventsNs';
import { RabbitMQController } from '../util/rabbitmq/rabbitMQController';
import RabbitMQConfig from '../util/rabbitmq/RabbitMQConfig';
import { JWT_SECRET, REDIS_URL } from '../config';
import { factory, formatFilename } from '../../shared/logging';
import {createChatNamespace} from "./chatNs";
import { DB } from '../database';

const log = factory.getLogger(formatFilename(__filename));

const origin = process.env.SERVER_URL || 'http://localhost:8080';

export const authenticate = (
  socket: Socket,
  next: (err?: ExtendedError) => void
) => {
  if (socket.handshake.query?.token) {
    jwt.verify(
      <string>socket.handshake.query.token,
      JWT_SECRET,
      (err, decodedUser) => {
        if (err)
          return next(new Error('Authentication Error: incorrect JWT token'));
        (<any>socket).user = decodedUser;
        next();
      }
    );
  } else {
    next(new Error('Authentication Error: no JWT token given'));
  }
};

export function setupWebSocketServer(httpServer: http.Server, models: DB) {
  // since the websocket servers are not linked with the main Commonwealth server we do not send the socket.io client
  // library to the user since we already import it + disable http long-polling to avoid sticky session issues
  const io = new Server(httpServer, {
    transports: ['websocket'],
    cors: {
      origin,
      methods: ['GET', 'POST'],
    },
  });

  io.use(authenticate);

  io.on('connection', (socket) => {
    log.trace(`${socket.id} connected`);
    socket.on('disconnect', () => {
      log.trace(`${socket.id} disconnected`);
    });
  });

  io.engine.on('connection_error', (err) => {
    // log.error(err.req);      // the request object
    // console.log(err.code);     // the error code, for example 1
    // console.log(err.message);  // the error message, for example "Session ID unknown"
    // console.log(err.context);  // some additional error context
    log.error('A WebSocket connection error has occurred', err);
  });

  // enables the admin analytics dashboard (creates /admin namespace)
  instrument(io, {
    auth: false,
  });

  log.info(`Connecting to Redis at: ${REDIS_URL}`);
  const pubClient = createClient({ url: REDIS_URL });

  const subClient = pubClient.duplicate();

  Promise.all([pubClient.connect(), subClient.connect()])
    .then(() => {
      io.adapter(<any>createAdapter(pubClient, subClient));
    })
    .then(() => {
      // create the chain-events namespace
      const ceNamespace = createCeNamespace(io);
      const chatNamespace = createChatNamespace(io, models);

      try {
        const rabbitController = new RabbitMQController(
          <BrokerConfig>RabbitMQConfig
        );
        rabbitController.init().then(() => {
          return rabbitController.startSubscription(
            publishToCERoom.bind(ceNamespace),
            'ChainEventsNotificationsSubscription'
          );
        });
      } catch (e) {
        log.warn(
          `Failure connecting to ${
            `${process.env.NODE_ENV} ` || ''
          }RabbitMQ server. Please fix the RabbitMQ server configuration`
        );
        log.error(e);
      }
    });
}
