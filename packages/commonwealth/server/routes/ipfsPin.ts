import { DB } from '../database';
import pinIpfsBlob from '../util/pinIpfsBlob';
import { AppError } from '../util/errors';
import { TypedRequestBody, TypedResponse, success } from '../types';
import lookupAddressIsOwnedByUser from '../util/lookupAddressIsOwnedByUser';

import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  InvalidAddress: 'Invalid address',
  NoBlobPresent: 'No JSON blob was input',
  InvalidJson: 'Input is not a valid JSON string',
  PinFailed: 'Failed to pin IPFS blob',
};

const isValidJSON = (input: string) => {
  try {
    JSON.parse(input);
  } catch (e) {
    return false;
  }
  return true;
};

type IpfsPinReq = { address: string, author_chain: string, blob: string };
type IpfsPinResp = string;

const ipfsPin = async (
  models: DB,
  req: TypedRequestBody<IpfsPinReq>,
  res: TypedResponse<IpfsPinResp>
) => {
  if (!req.user) throw new AppError(Errors.NotLoggedIn);
  if (!req.body.blob) throw new AppError(Errors.NoBlobPresent);
  if (!isValidJSON(req.body.blob)) throw new AppError(Errors.InvalidJson);
  const [address, error] = await lookupAddressIsOwnedByUser(models, req);
  if (error || !address) throw new AppError(Errors.InvalidAddress);

  try {
    const ipfsHash = await pinIpfsBlob(
      req.user.id,
      address.id,
      req.body.blob
    );
    return success(res, ipfsHash);
  } catch (e) {
    log.error(`Failed to pin IPFS blob: ${e.message}`);
    throw new AppError(Errors.PinFailed)
  }
};

export default ipfsPin;
