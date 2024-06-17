import { HttpMethod } from '@hicommonwealth/shared';
import {
  Express,
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from 'express';

const routesMethods: { [key: string]: string[] } = {};

/**
 * Use this function to register a route on a given Express Router. This function updates an object that stores the
 * valid methods available for each given path. For example the object may contain the '/comment' path which is valid
 * with the 'post', 'delete', and 'get' methods. Once a route is registered in this object, the
 * methodNotAllowedMiddleware can function correctly.
 * @param router The router on which to add the request/route handlers.
 * @param method The HTTP method of the route e.g. 'post', 'get', 'patch', etc.
 * @param path The path of the route e.g. '/comments'.
 * @param handlers Any request handlers.
 */
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

/*
 * This middleware function checks whether the requested path and method are valid (have a matching handler).
 * If they are not, the middleware will set the `Allow` header indicating what methods are allowed with the requested
 * path and then return with a status code of 405 (Method Not Allowed).
 */
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
