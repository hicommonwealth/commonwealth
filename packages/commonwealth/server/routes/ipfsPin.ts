import type { DB } from '../models';
import axios from 'axios';
import { AppError, ServerError } from 'common-common/src/errors';
import { factory, formatFilename } from 'common-common/src/logging';
import FormData from 'form-data';
import type { TypedRequestBody, TypedResponse } from '../types';
import { success } from '../types';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  InvalidAddress: 'Invalid address',
  NoBlobPresent: 'No JSON blob was input',
  InvalidJson: 'Input is not a valid JSON string',
  PinFailed: 'Failed to pin IPFS blob',
  KeysError: 'Pinata Keys do not exist',
};

const isValidJSON = (input: string) => {
  try {
    JSON.parse(input);
  } catch (e) {
    return false;
  }
  return true;
};

type IpfsPinReq = { address: string; author_chain: string; blob: string };
type IpfsPinResp = string;

const ipfsPin = async (
  models: DB,
  req: TypedRequestBody<IpfsPinReq>,
  res: TypedResponse<IpfsPinResp>
) => {
  if (!req.user) throw new AppError(Errors.NotLoggedIn);
  if (!req.body.blob) throw new AppError(Errors.NoBlobPresent);
  if (!isValidJSON(req.body.blob)) throw new AppError(Errors.InvalidJson);

  try {
    const data = new FormData();
    const jsonfile = req.body.blob;
    data.append('file', JSON.stringify(jsonfile), 'user_idblob');
    if (process.env.PINATA_API_KEY && process.env.PINATA_SECRET_API_KEY) {
      const headers = {
        pinata_api_key: process.env.PINATA_API_KEY,
        'Content-Type': `multipart/form-data; boundary= ${data.getBoundary()}`,
        pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
      };
      const pinataResponse = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        data,
        { headers }
      );
      return success(res, pinataResponse.data.IpfsHash);
    } else {
      throw new ServerError(Errors.KeysError);
    }
  } catch (e) {
    log.error(`Failed to pin IPFS blob: ${e.message}`);
    if (e instanceof ServerError || e instanceof AppError) {
      throw e;
    } else {
      throw new AppError(Errors.PinFailed);
    }
  }
};

export default ipfsPin;
