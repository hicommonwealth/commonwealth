/* eslint-disable @typescript-eslint/no-var-requires */
import axios from 'axios';
const { Client } = require('pg');
const FormData = require('form-data');
require('dotenv').config();

const ipfs = async (jsonfile) => {

  const data = new FormData();
  data.append('file', JSON.stringify( jsonfile ), "userIDblob");
  const headers = {
    'pinata_api_key': process.env.PINATA_API_KEY,
    'Content-Type': `multipart/form-data; boundary= ${data._boundary}`,
    'pinata_secret_api_key': process.env.PINATA_SECRET_API_KEY
};
axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', data,{headers})
.then(async (response) => {
    console.log(response.status);
    const client = new Client({
      connectionString:
        'postgresql://commonwealth:edgeware@localhost/commonwealth',
    });
    await client.connect();
    client.query(`
    INSERT INTO "IpfsPins" ("id", "IpfsHash")
    VALUES ('1777783', '${response.data.IpfsHash}')
    `, (err, res) => {
      if (err) {
          console.error(err);
          return;
      }
      console.log(res.status);
      console.log('Data PIN to IPFS is successful');
      client.end();
  });
    return response;

  }).catch(function (error) {
    console.error(error);
});
};

//   const jsonfile = {
//     "test": "test"
//   };
//   console.log(jsonfile);

// const response =  ipfs(jsonfile);
// console.log(response);
export default ipfs;
