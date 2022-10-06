import http from 'http';
import https from 'https';
import fs from 'fs';
import { Express } from 'express-serve-static-core';
import Rollbar from 'rollbar';
import { factory, formatFilename } from 'common-common/src/logging';
import { DEFAULT_PORT } from '../config';
import { setupWebSocketServer } from '../socket';
import { DB } from '../database';

const log = factory.getLogger(formatFilename(__filename));

const setupServer = (app: Express, rollbar: Rollbar, models: DB) => {
  const port = process.env.PORT || DEFAULT_PORT;
  const https_enabled = process.env.USE_HTTPS === 'true';
  app.set('port', port);
  let server;
  if (https_enabled) {
    try {
      const options = {
        key: fs.readFileSync('../localhost-key.pem'),
        cert: fs.readFileSync('../localhost.pem'),
      };
      server = https.createServer(options, app);
    } catch (e) {
      console.log(e);
      console.log(
        `\n\n\nWARNING: You might not have your .pem files configured! 
         \nFollow steps 1-3 at https://web.dev/how-to-use-local-https/ to create a TLS certificate.
         \nRunning with http in the meantime..\n\n\n`
      );
      server = http.createServer(app);
    }
  } else {
    server = http.createServer(app);
  }
  setupWebSocketServer(server, rollbar, models);

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
