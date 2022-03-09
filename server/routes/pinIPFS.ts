import { Request, Response, NextFunction } from 'express';
import { DB } from '../database';
import pinIpfsBlob from '../util/pinIpfsBlob';
import isValidJSON from '../util/isValidJson';
import { AppError } from '../util/errors';
export const Errors = {
  NotLoggedIn: 'Not logged in',
  InvalidAddress: 'Invalid address',
  NoBlobPresent: 'No JSON blob was input',
  InvalidJson: 'Input is not a valid JSON string',
};

const pinIPFS = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError(Errors.NotLoggedIn));
  if (!req.body.address_id) return next(new AppError(Errors.InvalidAddress));
  if (!req.body.blob) return next(new AppError(Errors.NoBlobPresent));
  if (!isValidJSON(req.body.blob)) return next(new AppError(Errors.InvalidJson));
  try {
    const ipfsHash = await pinIpfsBlob(
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
