/* eslint-disable @typescript-eslint/no-var-requires */
import axios from 'axios';
import { factory, formatFilename } from 'common-common/src/logging';
import models from '../database';
import { ServerError } from './errors';

const FormData = require('form-data');
const log = factory.getLogger(formatFilename(__filename));
require('dotenv').config();

export const Errors = {
  KeysError: 'Pinata Keys do not exist',
  DBInsertError: 'Could not insert the hash into the DB: ',
  PinningError: 'Pinata pinning has failed: ',
};

const pinIpfsBlob = async (
  user_id: number,
  address_id: number,
  jsonfile: string
): Promise<string> => {
  const data = new FormData();
  data.append('file', JSON.stringify(jsonfile), 'user_idblob');
  if (process.env.PINATA_API_KEY && process.env.PINATA_SECRET_API_KEY) {
    const headers = {
      'Content-Type': `multipart/form-data; boundary= ${data._boundary}`,
      pinata_api_key: process.env.PINATA_API_KEY,
      pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
    };
    try {
      const pinataResponse = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        data,
        { headers }
      );

      try {
        await models.IpfsPins.create({
          user_id,
          address_id,
          ipfs_hash: pinataResponse.data.IpfsHash,
        });
      } catch (e) {
        console.log(e);
        log.error('Could not insert the hash into the DB: ', e.message);
        throw new ServerError(Errors.DBInsertError);
      }

      return pinataResponse.data.IpfsHash;
    } catch (e) {
      log.error('Pinata pinning has failed', e.message);
      throw new ServerError(Errors.PinningError);
    }
  } else {
    throw new ServerError(Errors.KeysError);
  }
};

export default pinIpfsBlob;
