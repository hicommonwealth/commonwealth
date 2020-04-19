/* eslint-disable no-await-in-loop */
import Web3 from 'web3';
import fs from 'fs';
import _ from 'lodash';
import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';
import {
  getLocks,
  getSignals,
  setupWeb3Provider,
  getLocksForAddress,
  getSignalsForAddress
} from './getEdgewareLockdropLookup';
const { toBN } = Web3.utils;

const MAINNET_LOCKDROP_ORIG = '0x1b75B90e60070d37CfA9d87AFfD124bB345bf70a';
const MAINNET_LOCKDROP = '0xFEC6F679e32D45E22736aD09dFdF6E3368704e31';
const ROPSTEN_LOCKDROP = '0x111ee804560787E0bFC1898ed79DAe24F2457a04';

const generalizedLocks = {
  lockedContractAddresses: [
    '0x94bD4150e41c717B7E7564484693073239715376',
    '0xdB0E7d784D6A7ca2CBDA6CE26ac3b1Bd348C06F8',
    '0x3BfC20f0B9aFcAcE800D73D2191166FF16540258',
  ],
};

export const isHex = (inputString) => {
  const re = /^(0x)?[0-9A-Fa-f]+$/g;
  const result = re.test(inputString);
  re.lastIndex = 0;
  return result;
};

export const formatDate = (d) => {
  return d.toISOString().replace('T', ' ').replace('.000Z', ' UTC');
};

export const formatNumber = (num) => {
  // formats numbers with commas
  const nf = new Intl.NumberFormat();
  return num < 0.001 ? num.toString() : nf.format(num);
};

export const formatNumberRound = (num) => {
  // format large numbers with commas
  const nf = new Intl.NumberFormat();
  return nf.format(Math.round(num));
};

const getEarlyParticipationBonus = (lockTime, lockStart) => {
  const JUNE_1ST_UTC = 1559347200;
  const JUNE_16TH_UTC = 1560643200;
  const JULY_1ST_UTC = 1561939200;
  const JULY_16TH_UTC = 1563235200;
  const JULY_31ST_UTC = 1564531200;
  const AUG_15TH_UTC = 1565827200;
  const AUG_30TH_UTC = 1567123200;

  if (toBN(lockTime).lte(toBN(JUNE_16TH_UTC))) {
    return toBN(150);
  } else if (toBN(lockTime).lte(toBN(JULY_1ST_UTC))) {
    return toBN(135);
  } else if (toBN(lockTime).lte(toBN(JULY_16TH_UTC))) {
    return toBN(123);
  } else if (toBN(lockTime).lte(toBN(JULY_31ST_UTC))) {
    return toBN(114);
  } else if (toBN(lockTime).lte(toBN(AUG_15TH_UTC))) {
    return toBN(108);
  } else if (toBN(lockTime).lte(toBN(AUG_30TH_UTC))) {
    return toBN(105);
  } else {
    return toBN(100);
  }
};

function getEffectiveValue(ethAmount, term, lockTime = undefined, lockStart = undefined) {
  // multiplicative bonus starts at 100 / 100 = 1
  let bonus = toBN(100);
  // get multiplicative bonus if calculating allocation of locks
  if (lockTime && lockStart) {
    bonus = getEarlyParticipationBonus(lockTime, lockStart);
  }

  if (term === '0') {
    // three month term yields no bonus
    return toBN(ethAmount).mul(toBN(100).mul(bonus)).div(toBN(10000));
  } else if (term === '1') {
    // six month term yields 30% bonus
    return toBN(ethAmount).mul(toBN(130).mul(bonus)).div(toBN(10000));
  } else if (term === '2') {
    // twelve month term yields 120% bonus
    return toBN(ethAmount).mul(toBN(220).mul(bonus)).div(toBN(10000));
  } else if (term === 'signaling') {
    // 80% deduction
    return toBN(ethAmount).mul(toBN(20)).div(toBN(100));
  } else {
    // invalid term
    return toBN(0);
  }
}

const calculateEffectiveLocks = async (web3, lockdropContracts) => {
  let totalETHLocked = toBN(0);
  let totalETHLocked3mo = toBN(0);
  let totalETHLocked6mo = toBN(0);
  let totalETHLocked12mo = toBN(0);
  let totalEffectiveETHLocked = toBN(0);
  const locks = {};
  const ethAddrToEvent = {};
  const edgAddrToETH = {};
  const validatingLocks = {};

  let lockEvents = [];
  for (let i = 0; i < lockdropContracts.length; i++) {
    const events = await lockdropContracts[i].getPastEvents('Locked', {
      fromBlock: 0,
      toBlock: 'latest',
    });
    lockEvents = [ ...lockEvents, ...events ];
  }

  // For truffle tests
  let lockdropStartTime;
  if (typeof lockdropContracts[0].LOCK_START_TIME === 'function') {
    lockdropStartTime = (await lockdropContracts[0].LOCK_START_TIME());
  } else {
    lockdropStartTime = (await lockdropContracts[0].methods.LOCK_START_TIME().call());
  }
  console.log(`Lock events ${lockEvents.length}`);
  for (let i = 0; i < lockEvents.length; i++) {
    if (i % 500 === 0) console.log(`Processing lock event #${i + 1}`);
    const event = lockEvents[i];
    const data = event.returnValues;

    // allocate locks to first key if multiple submitted or malformed larger key submitted
    // NOTE: if key was less than length of a correct submission (66 chars), funds are considered lost
    let keys = [data.edgewareAddr];
    if (data.edgewareAddr.length >= 66) {
      keys = data.edgewareAddr.slice(2).match(/.{1,64}/g).map(key => `0x${key}`);
    }

    const detailedEvent = await getLocksForAddress(data.owner, event.address, web3);
    if (data.owner in ethAddrToEvent) {
      if (!ethAddrToEvent[data.owner].includes(detailedEvent)) {
        ethAddrToEvent[data.owner].push(detailedEvent);
      }
    } else {
      ethAddrToEvent[data.owner] = [detailedEvent];
    }

    if (data.lockAddr in ethAddrToEvent) {
      if (!ethAddrToEvent[data.lockAddr].includes(detailedEvent)) {
        ethAddrToEvent[data.lockAddr].push(detailedEvent);
      }
    } else {
      ethAddrToEvent[data.lockAddr] = [detailedEvent];
    }

    if (keys[0] in edgAddrToETH) {
      if (!edgAddrToETH[keys[0]].includes(data.owner)) {
        edgAddrToETH[keys[0]].push(data.owner);
      }
    } else {
      edgAddrToETH[keys[0]] = [data.owner];
    }

    const value = getEffectiveValue(data.eth, data.term, data.time, lockdropStartTime);
    // Add to totals
    totalETHLocked = totalETHLocked.add(toBN(data.eth));
    totalEffectiveETHLocked = totalEffectiveETHLocked.add(value);
    if (data.term.toString() === '0') {
      totalETHLocked3mo = totalETHLocked3mo.add(toBN(data.eth));
    } else if (data.term.toString() === '1') {
      totalETHLocked6mo = totalETHLocked6mo.add(toBN(data.eth));
    } else if (data.term.toString() === '2') {
      totalETHLocked12mo = totalETHLocked12mo.add(toBN(data.eth));
    } else {
      console.log('encountered lock transaction with invalid term');
    }

    // Add all validators to a separate collection to do validator election over later
    if (data.isValidator) {
      if (keys[0] in validatingLocks) {
        validatingLocks[keys[0]] = {
          lockAmt: toBN(data.eth).add(toBN(validatingLocks[keys[0]].lockAmt)).toString(),
          effectiveValue: toBN(validatingLocks[keys[0]].effectiveValue).add(value).toString(),
          lockAddrs: [data.lockAddr, ...validatingLocks[keys[0]].lockAddrs],
        };
      } else {
        validatingLocks[keys[0]] = {
          lockAmt: toBN(data.eth).toString(),
          effectiveValue: value.toString(),
          lockAddrs: [data.lockAddr],
        };
      }
    }

    // Add all locks to collection, calculating/updating effective value of lock
    if (keys[0] in locks) {
      locks[keys[0]] = {
        lockAmt: toBN(data.eth).add(toBN(locks[keys[0]].lockAmt)).toString(),
        effectiveValue: toBN(locks[keys[0]].effectiveValue).add(value).toString(),
        lockAddrs: [data.lockAddr, ...locks[keys[0]].lockAddrs],
      };
    } else {
      locks[keys[0]] = {
        lockAmt: toBN(data.eth).toString(),
        effectiveValue: value.toString(),
        lockAddrs: [data.lockAddr],
      };
    }
  }
  // Return validating locks, locks, and total ETH locked
  return {
    validatingLocks,
    locks,
    totalETHLocked,
    totalEffectiveETHLocked,
    totalETHLocked3mo,
    totalETHLocked6mo,
    totalETHLocked12mo,
    numLocks: lockEvents.length,
    ethAddrToLockEvent: ethAddrToEvent,
    edgAddrToETHLocks: edgAddrToETH,
  };
};

const calculateEffectiveSignals = async (web3, lockdropContracts, blockNumber = 8461046) => {
  let totalETHSignaled = toBN(0);
  let totalEffectiveETHSignaled = toBN(0);
  const signals = {};
  const ethAddrToEvent = {};
  const edgAddrToETH = {};
  const seenContracts = {};
  let signalEvents = [];
  for (let i = 0; i < lockdropContracts.length; i++) {
    const events = await lockdropContracts[i].getPastEvents('Signaled', {
      fromBlock: 0,
      toBlock: 'latest',
    });

    signalEvents = [ ...signalEvents, ...events ];
  }
  console.log(`Signal events ${signalEvents.length}`);
  const gLocks = {};
  for (let i = 0; i < signalEvents.length; i++) {
    if (i % 100 === 0) console.log(`Processing signal event #${i + 1}`);
    const event = signalEvents[i];
    const data = event.returnValues;
    // Get balance at block that lockdrop ends
    let balance = -1;
    while (balance === -1) {
      try {
        if (blockNumber) {
          balance = await web3.eth.getBalance(data.contractAddr, blockNumber);
        } else {
          balance = await web3.eth.getBalance(data.contractAddr);
        }
      } catch (e) {
        // console.log(`Couldn't find: ${JSON.stringify(data, null, 4)}`);
      }
    }

    // if contract address has been seen (it is in a previously processed signal)
    // then we ignore it; this means that we only acknolwedge the first signal
    // for a given address.
    if (!(data.contractAddr in seenContracts)) {
      seenContracts[data.contractAddr] = true;
      // Get value for each signal event and add it to the collection
      let value;
      // allocate signals to first key if multiple submitted or malformed larger key submitted
      // NOTE: if key was less than length of a correct submission (66 chars), funds are considered lost
      let keys = [data.edgewareAddr];
      if (data.edgewareAddr.length >= 66) {
        keys = data.edgewareAddr.slice(2).match(/.{1,64}/g).map(key => `0x${key}`);
      }

      const detailedEvent = await getSignalsForAddress(data.contractAddr, event.address, web3);
      if (data.contractAddr in ethAddrToEvent) {
        if (!ethAddrToEvent[data.contractAddr].includes(detailedEvent)) {
          ethAddrToEvent[data.contractAddr].push(detailedEvent);
        }
      } else {
        ethAddrToEvent[data.contractAddr] = [detailedEvent];
      }

      if (keys[0] in edgAddrToETH) {
        if (!edgAddrToETH[keys[0]].includes(data.contractAddr)) {
          edgAddrToETH[keys[0]].push(data.contractAddr);
        }
      } else {
        edgAddrToETH[keys[0]] = [data.contractAddr];
      }

      // Treat generalized locks as 3 month locks
      if (generalizedLocks.lockedContractAddresses.includes(data.contractAddr)) {
        console.log('Generalized lock:', balance, data.contractAddr);
        value = getEffectiveValue(balance, '0');
        if (keys[0] in gLocks) {
          gLocks[keys[0]] = toBN(gLocks[keys[0]]).add(value).toString();
        } else {
          gLocks[keys[0]] = value.toString();
        }
        totalETHSignaled = totalETHSignaled.add(toBN(balance));
        totalEffectiveETHSignaled = totalEffectiveETHSignaled.add(value);
        // keep generalized locks collection separate from other signals
      } else {
        value = getEffectiveValue(balance, 'signaling');
        // Add value to total signaled ETH
        totalETHSignaled = totalETHSignaled.add(toBN(balance));
        totalEffectiveETHSignaled = totalEffectiveETHSignaled.add(value);
        // Iterate over signals, partition reward into delayed and immediate amounts
        if (keys[0] in signals) {
          signals[keys[0]] = {
            signalAmt: toBN(balance).add(toBN(signals[keys[0]].signalAmt)).toString(),
            effectiveValue: toBN(signals[keys[0]]
              .effectiveValue)
              .add(value)
              .toString(),
            signalAddrs: [ ...signals[keys[0]].signalAddrs, data.contractAddr ],
          };
        } else {
          signals[keys[0]] = {
            signalAmt: toBN(balance).toString(),
            effectiveValue: value.toString(),
            signalAddrs: [data.contractAddr],
          };
        }
      }
    }
  }

  // Return signals and total ETH signaled
  return {
    signals,
    totalETHSignaled,
    totalEffectiveETHSignaled,
    genLocks: gLocks,
    numSignals: signalEvents.length,
    ethAddrToSignalEvent: ethAddrToEvent,
    edgAddrToETHSignals: edgAddrToETH,
  };
};

export const getCountsByBlock = async (web3, contracts) => {
  let locks = [];
  let signals = [];
  for (let i = 0; i < contracts.length; i++) {
    const lockdropContract = contracts[i];
    const ls = await getLocks(lockdropContract);
    const ss = await getSignals(lockdropContract);
    locks.push(ls);
    signals.push(ss);
  }
  locks = [].concat(...locks);
  signals = [].concat(...signals);
  const allEvents = locks.concat(signals);
  locks.sort((a, b) => a.blockNumber - b.blockNumber);
  signals.sort((a, b) => a.blockNumber - b.blockNumber);
  allEvents.sort((a, b) => a.blockNumber - b.blockNumber);

  if (allEvents.length === 0) {
    throw new Error('No locking events returned from the API');
  }

  // set number of blocks to quantize our x-axis to
  const roundToBlocks = 600;

  const reduceOverBlocks = (blocks, valueGetter) => {
    return blocks.reduce((acc, value) => {
      const blockNumber = Math.ceil(value.blockNumber / roundToBlocks) * roundToBlocks;
      if (acc[acc.length - 1].x === blockNumber) {
        acc[acc.length - 1].y = acc[acc.length - 1].y + valueGetter(value);
      } else {
        acc.push({
          x: blockNumber,
          y: acc[acc.length - 1].y + valueGetter(value),
          origin: value.address,
          txid: value.txid,
        });
      }
      return acc;
    }, [{ x: Math.floor(blocks[0].blockNumber / roundToBlocks) * roundToBlocks, y: 0 }]);
  };

  // TODO: This code assumes there is at least one event of each type
  // number of participants, by blocknum
  const participantsByBlock = reduceOverBlocks(allEvents, (value) => 1);
  const lockEventsByBlock = reduceOverBlocks(locks, (value) => 1);
  const signalEventsByBlock = reduceOverBlocks(signals, (value) => 1);
  const ethLockedByBlock = reduceOverBlocks(locks, (value) => Number(
    web3.utils.fromWei(web3.utils.toBN(value.returnValues.eth), 'ether')
  ));
  const ethSignaledByBlock = [];
  const effectiveETHByBlock = [];

  // construct array converting blocknums to time
  const blocknumToTime = {};
  allEvents.forEach((event) => {
    const time = parseInt(event.returnValues.time, 10);
    blocknumToTime[event.blockNumber] = new Date(+web3.utils.toBN(time) * 1000);
    blocknumToTime[Math.ceil(event.blockNumber / roundToBlocks) * roundToBlocks] =
      new Date(+web3.utils.toBN(time) * 1000);
  });
  const time2 = parseInt(allEvents[0].returnValues.time, 10);
  blocknumToTime[Math.floor(allEvents[0].blockNumber / roundToBlocks) * roundToBlocks] =
    new Date(+web3.utils.toBN(time2) * 1000);

  const lastBlock = Math.max.apply(this, allEvents.map((e) => e.blockNumber));

  return {
    participantsByBlock,
    lockEventsByBlock,
    signalEventsByBlock,
    ethLockedByBlock,
    ethSignaledByBlock,
    effectiveETHByBlock,
    blocknumToTime,
    lastBlock
  };
};

export const fetchStats = async (models, net) => {
  const result = await models.EdgewareLockdropEverything.findAll({
    limit: 1,
    order: [ [ 'createdAt', 'DESC' ]]
  });

  let results;
  if (result.length > 0) {
    results = JSON.parse(result[0].data);
  } else {
    const network = net || 'mainnet';
    const json = JSON.parse(fs.readFileSync('static/contracts/edgeware/Lockdrop.json').toString());
    const web3 = await setupWeb3Provider(network);
    const contracts = (network === 'mainnet')
      ? [MAINNET_LOCKDROP_ORIG, MAINNET_LOCKDROP].map((a) => (new web3.eth.Contract(json.abi, a)))
      : [ROPSTEN_LOCKDROP].map((a) => (new web3.eth.Contract(json.abi, a)));

    const {
      locks,
      validatingLocks,
      totalETHLocked,
      totalEffectiveETHLocked,
      totalETHLocked3mo,
      totalETHLocked6mo,
      totalETHLocked12mo,
      numLocks,
      ethAddrToLockEvent,
      edgAddrToETHLocks,
    } = await calculateEffectiveLocks(web3, contracts);
    const {
      signals,
      totalETHSignaled,
      totalEffectiveETHSignaled,
      numSignals,
      ethAddrToSignalEvent,
      edgAddrToETHSignals,
    } = await calculateEffectiveSignals(web3, contracts);
    const {
      participantsByBlock,
      lockEventsByBlock,
      signalEventsByBlock,
      ethLockedByBlock,
      ethSignaledByBlock,
      effectiveETHByBlock,
      blocknumToTime,
      lastBlock,
    } = await getCountsByBlock(web3, contracts);

    const aggregateResult = {
      // locks
      locks,
      validatingLocks,
      totalETHLocked,
      totalEffectiveETHLocked,
      totalETHLocked3mo,
      totalETHLocked6mo,
      totalETHLocked12mo,
      numLocks,
      // addr to event mapping
      ethAddrToLockEvent,
      ethAddrToSignalEvent,
      // signals
      signals,
      totalETHSignaled,
      totalEffectiveETHSignaled,
      numSignals,
      // more stats
      participantsByBlock,
      lockEventsByBlock,
      signalEventsByBlock,
      ethLockedByBlock,
      ethSignaledByBlock,
      effectiveETHByBlock,
      blocknumToTime,
      lastBlock,
      edgAddrToETHLocks,
      edgAddrToETHSignals,
    };

    await models.EdgewareLockdropEverything.create({
      data: JSON.stringify(aggregateResult),
      createdAt: Date.now(),
    });

    results = aggregateResult;
  }

  return results;
};

export default async (models, req: UserRequest, res: Response, next: NextFunction) => {
  const results = await fetchStats(models, req.query.network);
  return res.json({ status: 'Success', results });
};
