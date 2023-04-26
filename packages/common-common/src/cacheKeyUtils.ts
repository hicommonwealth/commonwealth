import { Request } from 'express';

export const defaultKeyGenerator = (req: Request) => {
  return req.originalUrl;
}

export const defaultUserKeyGenerator = (req: Request) => {
    const user = req.user;
    if(user && user.id) {
        return `${user.id}_${req.originalUrl}`;
    }
    return req.originalUrl;
}