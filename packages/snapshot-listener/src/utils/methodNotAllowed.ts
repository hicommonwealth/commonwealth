import {
  Express,
  NextFunction,
  Request,
  RequestHandler,
  Response,
  Router,
} from 'express';
import { HttpMethod } from 'common-common/src/types';

const routesMethods: { [key: string]: string[] } = {};

export const registerRoute = (
  router: Express,
  method: HttpMethod,
  path: string,
  ...handlers: RequestHandler[]
) => {
  router[method](path, ...handlers);
  if (!routesMethods[path]) routesMethods[path] = [];
  routesMethods[path].push(method.toUpperCase());
};

export const methodNotAllowedMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const methods = routesMethods[req.path];
    if (methods && !methods.includes(req.method)) {
      res.set('Allow', methods ? methods.join(', ') : '');
      return res
        .status(405)
        .json({ result: 'Method Not Allowed', status: 405 });
    } else {
      return next();
    }
  };
};
