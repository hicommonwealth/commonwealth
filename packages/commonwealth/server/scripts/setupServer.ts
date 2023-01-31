import { factory, formatFilename } from 'common-common/src/logging';
import { Express } from 'express-serve-static-core';
import http from 'http';
import Rollbar from 'rollbar';

import { PORT } from '../config';
import { DB } from '../models';
import { setupWebSocketServer } from '../socket';
import {RabbitMQController} from "common-common/src/rabbitmq";

const log = factory.getLogger(formatFilename(__filename));

const setupServer = (app: Express, rollbar: Rollbar, models: DB, rabbitMQController: RabbitMQController) => {
  app.set('port', PORT);
  console.log('starting server');
  const server = http.createServer(app);
  setupWebSocketServer(server, rollbar, models, rabbitMQController);

  const onError = (error) => {
    if (error.syscall !== 'listen') {
      throw error;
    }
    switch (error.code) {
      case 'EACCES':
        log.error('Port requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        log.error(`Port ${PORT} is already in use`);
        process.exit(1);
        break;
      default:
        throw error;
    }
  };

  const onListen = () => {
    const addr = server.address();
    if (typeof addr === 'string') {
      log.info(`Listening on ${addr}`);
    } else {
      log.info(`Listening on port ${addr.port}`);
    }
  };

  server.listen(PORT);
  console.log('listened to port');
  server.on('error', onError);
  server.on('listening', onListen);
};

export default setupServer;
