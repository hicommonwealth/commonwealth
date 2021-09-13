import WebSocket from 'ws';
import http from 'http';
import express from 'express';
import { Express } from 'express-serve-static-core';
import { DEFAULT_PORT } from '../config';
import setupWebsocketServer from '../socket';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

const setupServer = (app: Express, wss: WebSocket.Server, sessionParser: express.RequestHandler) => {
  const port = process.env.PORT || DEFAULT_PORT;
  app.set('port', port);
  const server = http.createServer(app);

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

  setupWebsocketServer(wss, server, sessionParser, true);

  server.listen(port);
  server.on('error', onError);
  server.on('listening', onListen);
};

export default setupServer;
