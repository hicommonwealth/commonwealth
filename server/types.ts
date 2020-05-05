import { Request } from 'express';
import * as core from 'express-serve-static-core';
import WebSocket from 'ws';
import { UserInstance } from './models/user';

export interface UserRequest<P extends core.Params = core.ParamsDictionary> extends Request<P> {
  // overwriting express's user type, should be user model
  user?: UserInstance;
  wss: WebSocket.Server;
}
