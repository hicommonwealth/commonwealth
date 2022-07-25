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
// import bcrypt from 'bcrypt';
import Rollbar from 'rollbar';
import { createCeNamespace, publishToCERoom } from './chainEventsNs';
import { RabbitMQController } from '../util/rabbitmq/rabbitMQController';
import RabbitMQConfig from '../util/rabbitmq/RabbitMQConfig';
import {
  JWT_SECRET,
  REDIS_URL,
  WEBSOCKET_ADMIN_USERNAME,
  WEBSOCKET_ADMIN_PASSWORD,
} from '../config';
import { factory, formatFilename } from 'common-common/src/logging';
import { createChatNamespace } from './chatNs';
import { DB } from '../database';
import { RedisCache } from '../util/redisCache';

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

export async function setupWebSocketServer(
  httpServer: http.Server,
  rollbar: Rollbar,
  models: DB
) {
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
    log.trace(`Socket connected: socket_id = ${socket.id}, user_id = ${(<any>socket).user.id}`);
    socket.on('disconnect', () => {
      log.trace(`Socket disconnected: socket_id = ${socket.id}, user_id = ${(<any>socket).user.id}`);
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
  // instrument(io, {
  //   auth: origin.includes('localhost')
  //     ? false
  //     : {
  //         type: 'basic',
  //         username: WEBSOCKET_ADMIN_USERNAME,
  //         password: bcrypt.hashSync(
  //           WEBSOCKET_ADMIN_PASSWORD,
  //           WEBSOCKET_ADMIN_PASSWORD.length
  //         ),
  //       },
  // });

  log.info(
    `Socket instance connecting to Redis at: ${REDIS_URL}. ${
      !REDIS_URL
        ? 'The Redis url is undefined so the socket instance will not work cross server'
        : ''
    }`
  );
  // const redisOptions = origin.includes("localhost") ? {} : { url: REDIS_URL, socket: {tls: true, rejectUnauthorized: false} }
  // const pubClient = createClient(redisOptions);
  // const subClient = pubClient.duplicate();

  try {
    // await Promise.all([pubClient.connect(), subClient.connect()]);
    // provide the redis connection instances to the socket.io adapters
    // await io.adapter(<any>createAdapter(pubClient, subClient));
  } catch (e) {
    // local env may not have redis so don't do anything if they don't
    if (!origin.includes('localhost')) {
      log.error('Failed to connect to Redis!', e);
      rollbar.critical(
        'Socket.io server failed to connect to Redis. Servers will NOT share socket messages' +
          'between rooms on different servers!',
        e
      );
    }
  }

  const redisCache = new RedisCache();
  console.log("Initializing Redis Cache for WebSockets...")
  await redisCache.init();
  console.log("Redis Cache initialized!");

  // create the chain-events namespace
  const ceNamespace = createCeNamespace(io);
  const chatNamespace = createChatNamespace(io, models, redisCache);

  try {
    const rabbitController = new RabbitMQController(
      <BrokerConfig>RabbitMQConfig
    );

    await rabbitController.init();
    await rabbitController.startSubscription(
      publishToCERoom.bind(ceNamespace),
      'ChainEventsNotificationsSubscription'
    );
  } catch (e) {
    log.error(
      `Failure connecting to ${process.env.NODE_ENV || 'local'}` +
        'RabbitMQ server. Please fix the RabbitMQ server configuration',
      e
    );
    if (!origin.includes('localhost'))
      rollbar.critical(
        'Failed to connect to RabbitMQ so the chain-evens notification consumer is DISABLED.' +
          'Handle immediately to avoid notifications queue backlog.',
        e
      );
  }
}
