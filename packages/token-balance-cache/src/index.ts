import express from 'express';
import bodyParser from 'body-parser';
import { factory, formatFilename } from 'common-common/src/logging';

import TokenBalanceCache from './cache';
import getBalance from './routes/getBalance';
import getNodes from './routes/getNodes';

const log = factory.getLogger(formatFilename(__filename));

require('dotenv').config();

const port = process.env.PORT || 4001;

const app = express();
const router = express.Router();

async function main() {
  // setup cache
  const cache = new TokenBalanceCache();
  await cache.start();

  // setup server
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json({ limit: '1mb' }));
  router.post('/getBalance', getBalance.bind(this, cache));
  router.post('/getNodes', getNodes.bind(this, cache));
  app.use('/', router);
  app.set('port', port);

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
        log.error(`Port ${port} is already in use`);
        process.exit(1);
        break;
      default:
        throw error;
    }
  };

  app.on('error', onError);
  app.listen(port, () => {
    log.info(`Token Balance server listening on port ${port}`);
  });
}

main();
