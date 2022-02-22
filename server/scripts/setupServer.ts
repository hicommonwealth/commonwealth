import http from 'http';
import https from 'https';
import fs from 'fs';
import { Express } from 'express-serve-static-core';
import { DEFAULT_PORT } from '../config';
import { factory, formatFilename } from '../../shared/logging';
import { setupWebSocketServer } from '../socket';
const log = factory.getLogger(formatFilename(__filename));

const setupServer = (app: Express) => {
  const port = process.env.PORT || DEFAULT_PORT;
  app.set('port', port);
  // TODO: Temp(?) for https local dev.
  // You need to follow https://web.dev/how-to-use-local-https/ to create a TLS certificate
  // in order to make this work
  const options = {
    key: fs.readFileSync('./localhost-key.pem'),
    cert: fs.readFileSync('./localhost.pem'),
  };
  const server = https.createServer(options, app);
  setupWebSocketServer(server);

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

  const onListen = () => {
    const addr = server.address();
    if (typeof addr === 'string') {
      log.info(`Listening on ${addr}`);
    } else {
      log.info(`Listening on port ${addr.port}`);
    }
  };

  server.listen(port);
  server.on('error', onError);
  server.on('listening', onListen);
};

export default setupServer;
