import { Request, Response, NextFunction } from 'express';
import { DB, sequelize } from '../database';
import ipfs from '../util/pinIpfsBlob';
export const Errors = {
  NotLoggedIn: 'Not logged in',
  InvalidAddress: 'Invalid address',
  NoBlobPresent: 'No JSON blob was input',
};

const pinIPFS = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  if (!req.body.address_id) return next(new Error(Errors.InvalidAddress));
  if (!req.body.blob) return next(new Error(Errors.NoBlobPresent));
  try {
    const ipfsHash = await ipfs(
      req.user.id,
      req.body.address_id,
      req.body.blob
    );
    return res.json({ status: 'Success', IPFSHash: ipfsHash });
  } catch (e) {
    return res.json({ status: 'Failure', message: e.message });
  }
};

export default pinIPFS;
