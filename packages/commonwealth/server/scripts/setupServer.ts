import { formatFilename, loggerFactory } from '@hicommonwealth/adapters';
import type { RabbitMQController } from '@hicommonwealth/common-common';
import { RedisCache, cacheDecorator } from '@hicommonwealth/common-common';
import type { Express } from 'express-serve-static-core';
import http from 'http';
import type Rollbar from 'rollbar';
import { PORT } from '../config';
import type { DB } from '../models';

const log = loggerFactory.getLogger(formatFilename(__filename));

const setupServer = (
  app: Express,
  rollbar: Rollbar,
  models: DB,
  rabbitMQController: RabbitMQController,
  redisCache: RedisCache,
) => {
  app.set('port', PORT);
  const server = http.createServer(app);
  cacheDecorator.setCache(redisCache);

  const onError = (error) => {
    if (error.syscall !== 'listen') {
      throw error;
    }
    switch (error.code) {
      case 'EACCES':
        log.error('Port requires elevated privileges');
        return process.exit(1);
      case 'EADDRINUSE':
        log.error(`Port ${PORT} is already in use`);
        return process.exit(1);
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
  server.on('error', onError);
  server.on('listening', onListen);
};

export default setupServer;
