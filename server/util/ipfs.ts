/* eslint-disable @typescript-eslint/no-var-requires */
import axios from 'axios';
const FormData = require('form-data');
import models from '../database';
require('dotenv').config();

const ipfs = async (userID, addressID, jsonfile) => {
  const data = new FormData();
  data.append('file', JSON.stringify(jsonfile), 'userIDblob');
  const headers = {
    pinata_api_key: process.env.PINATA_API_KEY,
    'Content-Type': `multipart/form-data; boundary= ${data._boundary}`,
    pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
  };

  const response = await axios
    .post('https://api.pinata.cloud/pinning/pinFileToIPFS', data, { headers })
    .then(async (response) => {
      try {
        await models.IpfsPins.create({
          id: userID,
          address_id: addressID,
          ipfs_hash: response.data.IpfsHash,
        });
      } catch (e) {
        console.log(e);
        return new Error('Could not insert the hash');
      }
      return response.data.IpfsHash;
    })
    .catch(function (error) {
      console.error(error);
    });
  return response;
};

export default ipfs;
