import { handleHeartbeat } from './handlers';
import { IWebsocketsPayload } from './types';
const map = {};

export default function (wss, server, sessionParser, logging: boolean) {
  server.on('upgrade', (req, socket, head) => {
    console.log('\nParsing session from request...\n');

    sessionParser(req, {}, () => {
      if (!req.session || !req.session.passport || !req.session.passport.user) {
        socket.destroy();
        return;
      }

      console.log('Session is parsed!');

      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    });
  });

  wss.on('connection', (ws, req) => {
    const userId = req.session.passport.user;
    // const clientKey = req.headers['sec-websocket-key'];
    map[userId] = ws;

    ws.on('message', (message) => {
      console.log(`Received message ${message} from user ${userId}`);
      try {
        const payload = JSON.parse(message);
        if (payload.event === 'heartbeat') {
          handleHeartbeat(ws, payload);
        } else {
          console.log('received malformed message');
        }
      } catch (e) {
        console.log('received malformed message');
      }
    });

    ws.on('close', () => {
      delete map[userId];
    });
  });

  wss.on('server-event', (payload: IWebsocketsPayload, userIds: number[]) => {
    if (logging) console.log(`Payloading ${JSON.stringify(payload)} to users ${JSON.stringify(userIds)}`);
    for (const user of userIds) {
      if (user && user in map) {
        map[user].send(JSON.stringify(payload));
      }
    }
  });

  wss.clientMap = map;
}
