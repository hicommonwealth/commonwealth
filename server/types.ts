import WebSocket from 'ws';
import { UserInstance } from './models/user';

// create req.session.passport.user type on standard Request object
// and extend User to be "any" (really should be a models.User instance,
// but we don't support typescript on server yet)
// based on: https://stackoverflow.com/questions/27637609/understanding-passport-serialize-deserialize
declare global {
  namespace Express {
    interface User extends UserInstance {
      [key: string]: any;
    }

    interface Request {
      user?: User;
      wss: WebSocket.Server;
    }
  }
}

declare module "express-session" {
  interface SessionData {
    passport?: {
      user?: number;
    }
  }
}
