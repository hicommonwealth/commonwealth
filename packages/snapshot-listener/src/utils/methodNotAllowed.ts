import {NextFunction, Request, Response} from "express";

const routesMethods: { [key: string]: string[] } = {};
type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';

export const registerRoute = (router, method: HttpMethod, path: string, ...handlers: any[]) => {
  router[method](path, ...handlers);
  const realPath = `/api${path}`;
  if (!routesMethods[realPath]) routesMethods[realPath] = [];
  routesMethods[realPath].push(method.toUpperCase());
};

export const methodNotAllowedMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const methods = routesMethods[req.path];
    console.log(methods);
    console.log(routesMethods);
    console.log(req.path);
    if (methods && !methods.includes(req.method)) {
      res.set('Allow', methods ? methods.join(', ') : '');
      return res.status(405).json({ result: 'Method Not Allowed', status: 405 });
    } else {
      next();
    }
  };
}
