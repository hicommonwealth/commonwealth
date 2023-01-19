import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';
import { success, TypedResponse } from '../types';

export const getJwt = async (
  req: Request,
  res: TypedResponse<{ jwt: string }>
) => {
  if (!req.user) {
    return success(res, { jwt: 'user not logged in' });
  }

  const jwtToken = jwt.sign(
    { id: req.user.id, email: req.user.email },
    JWT_SECRET
  );
  return success(res, { jwt: jwtToken });
};
