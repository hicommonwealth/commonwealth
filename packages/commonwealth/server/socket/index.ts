// Use https://admin.socket.io/#/ to monitor

// TODO: turn on session affinity in all staging environments and in production to enable polling in transport options
import { Server, Socket } from 'socket.io';
import { instrument } from '@socket.io/admin-ui';
import { BrokerConfig } from 'rascal';
import * as jwt from 'jsonwebtoken';
import { ExtendedError } from 'socket.io/dist/namespace';
import * as http from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import {
  ConnectionTimeoutError,
  createClient,
  ReconnectStrategyError,
} from 'redis';
import Rollbar from 'rollbar';
import { createCeNamespace, publishToCERoom } from './chainEventsNs';
import { RabbitMQController } from '../util/rabbitmq/rabbitMQController';
import RabbitMQConfig from '../util/rabbitmq/RabbitMQConfig';
import { JWT_SECRET, REDIS_URL, VULTR_IP } from '../config';
import { factory, formatFilename } from 'common-common/src/logging';
import { createChatNamespace } from './chatNs';
import { DB } from '../database';
import { RedisCache, redisRetryStrategy } from '../util/redisCache';

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
    log.trace(
      `Socket connected: socket_id = ${socket.id}, user_id = ${
        (<any>socket).user.id
      }`
    );
    socket.on('disconnect', () => {
      log.trace(
        `Socket disconnected: socket_id = ${socket.id}, user_id = ${
          (<any>socket).user.id
        }`
      );
    });
  });

  io.engine.on('connection_error', (err) => {
    // log.error(err.req);      // the request object
    // console.log(err.code);     // the error code, for example 1
    // console.log(err.message);  // the error message, for example "Session ID unknown"
    // console.log(err.context);  // some additional error context
    log.error('A WebSocket connection error has occurred', err);
  });

  if (!REDIS_URL) {
    log.warn(
      'Redis Url is undefined. Some services (e.g. WebSockets) may not be available.'
    );
    return;
  }

  const isLocalhost =
    REDIS_URL.includes('localhost') || REDIS_URL.includes('127.0.0.1');
  const isVultr = REDIS_URL.includes(VULTR_IP);

  log.info(`Socket instance connecting to Redis at: ${REDIS_URL}`);

  const redisOptions = {};
  redisOptions['url'] = REDIS_URL;
  if (isLocalhost || isVultr) {
    redisOptions['socket'] = {
      reconnectStrategy: redisRetryStrategy,
    };
  } else {
    redisOptions['socket'] = {
      connectTimeout: 5000,
      keepAlive: true,
      tls: true,
      rejectUnauthorized: false,
      reconnectStrategy: redisRetryStrategy,
    };
  }

  const pubClient = createClient(redisOptions);
  const subClient = pubClient.duplicate();

  pubClient.on('error', (err) => {
    if (err instanceof ConnectionTimeoutError) {
      log.error(
        `Socket.io Redis pub-client connection to ${REDIS_URL} timed out!`
      );
    } else if (err instanceof ReconnectStrategyError) {
      log.error(`Socket.io Redis pub-client max connection retries exceeded!`);
      if (!isLocalhost && !isVultr)
        rollbar.critical(
          'Socket.io Redis pub-client max connection retries exceeded! Redis pub-client for Socket.io shutting down!'
        );
    } else {
      log.error(`Socket.io Redis pub-client connection error:`, err);
      if (!isLocalhost && !isVultr)
        rollbar.critical(
          'Socket.io Redis pub-client unknown connection error!',
          err
        );
    }
  });
  pubClient.on('ready', () => {
    log.info("Redis pub-client ready");
  })
  pubClient.on('reconnect', () => {
    log.info("Redis pub-client reconnecting");
  })
  pubClient.on('end', () => {
    log.info('Redis pub-client disconnected');
  })
  subClient.on('error', (err) => {
    if (err instanceof ConnectionTimeoutError) {
      log.error(
        `Socket.io Redis sub-client connection to ${REDIS_URL} timed out!`
      );
    } else if (err instanceof ReconnectStrategyError) {
      log.error(`Socket.io Redis sub-client max connection retries exceeded!`);
      if (!isLocalhost && !isVultr)
        rollbar.critical(
          'Socket.io Redis sub-client max connection retries exceeded! Redis sub-client for Socket.io shutting down!'
        );
    } else {
      log.error(`Socket.io Redis sub-client connection error:`, err);
      if (!isLocalhost && !isVultr)
        rollbar.critical(
          'Socket.io Redis sub-client unknown connection error!',
          err
        );
    }
  });
  subClient.on('ready', () => {
    log.info("Redis sub-client ready");
  })
  subClient.on('reconnect', () => {
    log.info("Redis sub-client reconnecting");
  })
  subClient.on('end', () => {
    log.info('Redis sub-client disconnected');
  })

  await Promise.all([pubClient.connect(), subClient.connect()]);
  // provide the redis connection instances to the socket.io adapters
  await io.adapter(<any>createAdapter(pubClient, subClient));

  const redisCache = new RedisCache();
  console.log('Initializing Redis Cache for WebSockets...');
  await redisCache.init();
  console.log('Redis Cache initialized!');

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
