import fs from 'fs';
import Web3 from 'web3';
import _ from 'lodash';
import { Request, Response, NextFunction } from 'express';
import { INFURA_API_KEY } from '../config';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';

const log = factory.getLogger(formatFilename(__filename));

const MAINNET_LOCKDROP_ORIG = '0x1b75B90e60070d37CfA9d87AFfD124bB345bf70a';
const MAINNET_LOCKDROP = '0xFEC6F679e32D45E22736aD09dFdF6E3368704e31';
const ROPSTEN_LOCKDROP = '0x111ee804560787E0bFC1898ed79DAe24F2457a04';

export function setupWeb3Provider(network) {
  return new Web3(new Web3.providers.HttpProvider(`https://${network}.infura.io/v3/${INFURA_API_KEY}`));
}

export const getLocks = async (lockdropContract, address?) => {
  const options = (!address)
    ? { fromBlock: 0, toBlock: 'latest' }
    : { fromBlock: 0, toBlock: 'latest', filter: { owner: address } };

  const results = await lockdropContract.getPastEvents('Locked', options);
  return results;
};

export const getSignals = async (lockdropContract, address?) => {
  const options = (!address)
    ? { fromBlock: 0, toBlock: 'latest' }
    : { fromBlock: 0, toBlock: 'latest', filter: { contractAddr: address } };

  const results = await lockdropContract.getPastEvents('Signaled', options);
  return results;
};

const getCurrentTimestamp = async (web3) => {
  const block = await web3.eth.getBlock('latest');
  return block.timestamp;
};

const getLockStorage = async (lockAddress, web3) => {
  return Promise.all([0, 1].map((v) => {
    return web3.eth.getStorageAt(lockAddress, v);
  }))
    .then((vals) => {
      return {
        owner: vals[0],
        unlockTime: web3.utils.hexToNumber(vals[1]),
      };
    });
};

export const getLocksForAddress = async (userAddress, lockdropContractAddress, web3) => {
  // console.log(`Fetching locks for account ${userAddress} for contract ${lockdropContractAddress}`);
  const json = JSON.parse(fs.readFileSync('static/contracts/edgeware/Lockdrop.json').toString());
  const contract = new web3.eth.Contract(json.abi, lockdropContractAddress);
  const lockEvents = await getLocks(contract, userAddress);
  const now = await getCurrentTimestamp(web3);
  const results = await Promise.all(lockEvents.map(async (event) => {
    const lockStorage = await getLockStorage(event.returnValues.lockAddr, web3);
    return {
      ...event,
      type: 'lock',
      owner: event.returnValues.owner,
      eth: web3.utils.fromWei(event.returnValues.eth, 'ether'),
      lockContractAddr: event.returnValues.lockAddr,
      unlockTimeMinutes: (lockStorage.unlockTime - now) / 60,
      term: event.returnValues.term,
      edgewareAddr: event.returnValues.edgewareAddr,
    };
  }));

  return results;
};

export const getSignalsForAddress = async (userAddress, lockdropContractAddress, web3) => {
  const json = JSON.parse(fs.readFileSync('static/contracts/edgeware/Lockdrop.json').toString());
  const contract = new web3.eth.Contract(json.abi, lockdropContractAddress);
  const signalEvents = await getSignals(contract, userAddress);
  const results = await Promise.all(signalEvents.map(async (event) => {
    const balance = await web3.eth.getBalance(event.returnValues.contractAddr, 8461046);
    return {
      ...event,
      type: 'signal',
      data: event,
      eth: Number(web3.utils.fromWei(balance, 'ether')),
      contractAddr: event.returnValues.contractAddr,
    };
  }));
  return results;
};


const fetchLocks = async (network = 'mainnet', address, contract) => {
  const web3 = setupWeb3Provider(network);
  const results = await getLocksForAddress(address, contract, web3);
  return results;
};

const fetchSignals = async (network = 'mainnet', address, contract) => {
  const web3 = setupWeb3Provider(network);
  const results = await getSignalsForAddress(address, contract, web3);
  return results;
};

export default async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const address = req.query.address;
  const network = req.query.network || 'mainnet';

  const result = await models.EdgewareLockdropEverything.findAll({
    limit: 1,
    order: [ [ 'createdAt', 'DESC' ]]
  });

  const contracts = (network === 'mainnet')
    ? [MAINNET_LOCKDROP_ORIG, MAINNET_LOCKDROP]
    : [ROPSTEN_LOCKDROP];

  const locks = await Promise.all(contracts.map(async c => {
    // eslint-disable-next-line no-return-await
    return await fetchLocks(network as string, address, c);
  }));
  const signals = await Promise.all(contracts.map(async c => {
    // eslint-disable-next-line no-return-await
    return await fetchSignals(network as string, address, c);
  }));
  const results = _.merge(_.merge(locks[0], locks[1]), _.merge(signals[0], signals[1]));
  return res.json({ status: 'Success', results });
};
