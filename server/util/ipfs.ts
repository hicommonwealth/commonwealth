/* eslint-disable @typescript-eslint/no-var-requires */
import axios from 'axios';
const { Client } = require('pg');
const FormData = require('form-data');
const { QueryTypes } = require('sequelize');
import models from '../database';
require('dotenv').config();

const ipfs = async (jsonfile) => {
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
      // console.log(response.status);
      console.log('in the function');

      models.sequelize.query(`INSERT INTO "IpfsPins" ("id", "IpfsHash")
      VALUES ('1004', '${response.data.IpfsHash}')`);
      const dbobj = await models.IpfsPins.findAll()
      console.log("db:", dbobj);
      return response.status;
    })
    .catch(function (error) {
      console.error(error);
    });
    console.log('response', response);

  return response;
};

const jsonfile = {
  test: 'test',
};
console.log(jsonfile);

const doIpfsCall = async () => {
  const result = await ipfs(jsonfile);
  console.log('Final status', result);
};
doIpfsCall();

// const result =  async () => {
//   await console.log(ipfs(jsonfile));
// };
// console.log(result)
