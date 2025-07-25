import { incrementUserCount, tiered } from '@hicommonwealth/model/middleware';
import {
  NextFunction,
  Request,
  RequestHandler,
  Response,
  Router,
} from 'express';
import { ValidationChain } from 'express-validator';

const routesMethods: { [key: string]: string[] } = {};

type ValidateThenHandle = [ValidationChain[], ...RequestHandler[]];

/**
 * Use this function to register a route on a given Express Router. This function updates an object that stores the
 * valid methods available for each given path. For example the object may contain the '/comment' path which is valid
 * with the 'post', 'delete', and 'get' methods. Once a route is registered in this object, the
 * methodNotAllowedMiddleware can function correctly.
 * @param router The router on which to add the request/route handlers.
 * @param method The HTTP method of the route e.g. 'post', 'get', 'patch', etc.
 * @param path The path of the route e.g. '/comments'.
 * @param handlers Any request body validators or route handlers.
 */
export const registerRoute = (
  router: Router,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  path: string,
  ...handlers: RequestHandler[] | ValidateThenHandle
) => {
  const realPath = `/api${path}`;
  router[method](path, ...handlers);
  if (!routesMethods[realPath]) routesMethods[realPath] = [];
  routesMethods[realPath].push(method.toUpperCase());
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

export const aiTieredMiddleware = (ai: {
  images?: boolean;
  text?: boolean;
}) => {
  return async (req: Request, _: Response, next: NextFunction) => {
    const id = req.user?.id;
    if (!id) throw Error('Unauthorized'); // this should never happen

    await tiered({ ai })({
      actor: { user: { id, email: '' } },
      payload: {},
    });

    // increment in input middleware, even if request fails we still count it
    ai.images && (await incrementUserCount(id, 'ai-images'));
    ai.text && (await incrementUserCount(id, 'ai-text'));

    next();
  };
};
