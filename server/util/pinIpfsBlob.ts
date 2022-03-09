/* eslint-disable @typescript-eslint/no-var-requires */
import axios from 'axios';
const FormData = require('form-data');
import models from '../database';
import { AppError } from './errors';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));
require('dotenv').config();

export const Errors = {
  KeysError: 'Pinata Keys do not exist',
};

const ipfs = async (userID: number, addressID: number, jsonfile: string) => {
  const data = new FormData();
  data.append('file', JSON.stringify(jsonfile), 'userIDblob');
  if (process.env.PINATA_API_KEY && process.env.PINATA_SECRET_API_KEY) {
    const headers = {
      pinata_api_key: process.env.PINATA_API_KEY,
      'Content-Type': `multipart/form-data; boundary= ${data._boundary}`,
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
          id: userID,
          address_id: addressID,
          ipfs_hash: pinataResponse.data.IpfsHash,
        });
      } catch (e) {
        log.error('Could not insert the hash: ', e.message);
      }

      return pinataResponse.data.IpfsHash;
    } catch (e) {
      log.error('Pinata pinning has failed', e.message);
    }
  } else {
    throw new AppError(Errors.KeysError);
  }
};

export default ipfs;
