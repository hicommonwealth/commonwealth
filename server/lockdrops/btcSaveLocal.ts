/**
 *  This file should be run before running `yarn update-supernova`
 */

import fs from 'fs';
import * as sBTC from './supernovaBtc';
import { json } from 'body-parser';

const config = {
  start: 0,
  end: 202,
  multiAddr: '/ip4/127.0.0.1/tcp/5002',
  networkName: 'regtest',
  rpcHost: '127.0.0.1',
  walletHost: '127.0.0.1',
  apiKey: 'test',
};

/**
 *
 * @param start block to start the search from
 * @param end block to stop the search at
 * @param multiAddr IPFS multiiaddress to connect to
 * @param networkName Bitcoin network name
 * @param rpcHost Bcoin rpc node url
 * @param walletHost Bcoin wallet url
 * @param apiKey Bcoin node api key
 *
 *  Example single result
 * -----------------------
 * {
 *   hash:
 *    '95751cf123e106c89333c8e2549212b99cf71a28654d7928c2c108dd59cd89a7',
 *   witnessHash:
 *    '95751cf123e106c89333c8e2549212b99cf71a28654d7928c2c108dd59cd89a7',
 *   fee: 2051,
 *   rate: 7048,
 *   mtime: 1572503781,
 *   index: 1,
 *   version: 1,
 *   inputs: [ [Object] ],
 *   outputs: [ [Object], [Object], [Object] ],
 *   locktime: 0,
 *   hex: '01000000015ed5388610cf5a9ec759f88961dfbac4ce8e225f35b21429c8...',
 *   lockAmt: 0.5,
 *   lockAddr: 'bcrt1qrxygl992c3l7qqckf2yzrrvz8xx4ehl40v594cu5mmqf568mpuuqh5ac54'
 * }
 */
const saveLocksToFile = async ({ start, end, multiAddr, networkName, rpcHost, walletHost, apiKey }) => {
  const network = sBTC.getNetworkSetting(networkName);
  const { nodeClient } = sBTC.setupBcoin(network, rpcHost, walletHost, apiKey);

  try {
    const locks = await sBTC.queryAllLocks(start, end, nodeClient, network, multiAddr);
    const mappedLocks = {};
    locks.forEach((lock) => {
      mappedLocks[lock.supernovaAddress] = {
        amount: lock.lockAmount,
        mtime: lock.mtime,
        height: lock.height,
        hash: lock.hash,
        address: lock.lockingAddr,
        data: JSON.stringify(lock),
      };
    });
    // save bitcoin locks
    const locksForCreation = Object.keys(mappedLocks).map((supernovaAddressKey) => ({
      //chain: 'bitcoin',
      data: JSON.stringify(mappedLocks[supernovaAddressKey]),
      hash: mappedLocks[supernovaAddressKey].hash,
      address: mappedLocks[supernovaAddressKey].address,
      balance: mappedLocks[supernovaAddressKey].amount,
      blocknum: mappedLocks[supernovaAddressKey].height,
      timestamp: new Date(mappedLocks[supernovaAddressKey].mtime * 1000),
    }));
    console.log(`Creating ${locksForCreation.length} locks from the bitcoin blockchain`);
    fs.writeFileSync('./btcLockData.json', JSON.stringify(locksForCreation));
  } catch (error) {
    console.log('Error fetching BTC stats, check your node connection');
  }
};

saveLocksToFile(config);
