import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { DB } from '../database';
import pinIpfsBlob from '../util/pinIpfsBlob';
import { AppError } from 'common-common/src/errors';
export const Errors = {
  NotLoggedIn: 'Not logged in',
  InvalidAddress: 'Invalid address',
  NoBlobPresent: 'No JSON blob was input',
  InvalidJson: 'Input is not a valid JSON string',
};

const isValidJSON = (input: string) => {
  try {
    JSON.parse(input);
  } catch (e) {
    return false;
  }
  return true;
};

const ipfsPin = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError(Errors.NotLoggedIn));
  if (!req.body.blob) return next(new AppError(Errors.NoBlobPresent));
  if (!isValidJSON(req.body.blob)) return next(new AppError(Errors.InvalidJson));
  const userOwnedAddresses = await req.user.getAddresses();
  const userOwnedAddressIds = userOwnedAddresses.filter((addr) => !!addr.verified).map((addr) => addr.id);
  const validAddress = await models.Address.findOne({
    where: {
      id: { [Op.in]: userOwnedAddressIds },
      user_id: req.user.id,
    }
  });
  if (!validAddress) return next(new AppError(Errors.InvalidAddress));
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

export default ipfsPin;
