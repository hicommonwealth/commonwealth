import * as jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';
import { IWebsocketsPayload } from './types';
import { factory, formatFilename } from '../util/logging';
const log = factory.getLogger(formatFilename(__filename));

// handle heartbeats and timeouts
export const handleHeartbeat = (ws, payload: IWebsocketsPayload) => {
  ws.isAlive = true;
  jwt.verify(payload.jwt, JWT_SECRET, async (err, decodedUser) => {
    if (err) {
      log.error(`received message with malformed JWT: ${payload.jwt}`);
      return;
    }
    ws.isAuthenticated = true;
    ws.user = decodedUser;
  });
};

export default handleHeartbeat;
