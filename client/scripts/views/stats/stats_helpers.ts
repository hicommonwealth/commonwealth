import app from 'state';
import { default as $ } from 'jquery';
import { default as _ } from 'lodash';

export const MAINNET_LOCKDROP_ORIG = '0x1b75B90e60070d37CfA9d87AFfD124bB345bf70a';
export const MAINNET_LOCKDROP = '0xFEC6F679e32D45E22736aD09dFdF6E3368704e31';
export const ROPSTEN_LOCKDROP = '0x111ee804560787E0bFC1898ed79DAe24F2457a04';
const MAINNET_START_BLOCK = 7870000; // original mainnet lockdrop opened on block 7870425
const MAX_BLOCKS_PER_MAINNET_QUERY = 15000;

let cachedLocks;
let cachedSignals;

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

// unpacks Ethereum contract events serialized on the Commonwealth server
const unpackEvent = (e) => {
  e.blockNumber = e.blocknum;
  e.returnValues = JSON.parse(e.data);
  Object.keys(e.returnValues).map((key) => {
    // unpack encoded hex values
    if (typeof e.returnValues[key] === 'object' && e.returnValues[key]._hex) {
      e.returnValues[key] = e.returnValues[key]._hex;
    }
  });
  delete e.blocknum;
  delete e.data;
  return e;
};

const filterDuplicateLocks = (locks) => {
  // There are duplicate cached locks with the same LUC (some `data`
  // timestamps are in hex vs decimal). Remove duplicate locks.
  const ids = {};
  return locks.filter((event) => {
    const lockAddr = event.returnValues.lockAddr;
    if (ids[lockAddr]) {
      return false;
    } else {
      ids[lockAddr] = true;
      return true;
    }
  });
};

export const getAllSignals = async (web3, lockdropContract) => {
  if (cachedSignals) return cachedSignals;
  const network = await web3.eth.net.getNetworkType();
  if (network === 'main') {
    const req = await $.get(`${app.serverUrl()}/stats/edgeware/lockdrop/events?origin=${MAINNET_LOCKDROP_ORIG}&name=Signaled`);
    const req2 = await $.get(`${app.serverUrl()}/stats/edgeware/lockdrop/events?origin=${MAINNET_LOCKDROP}&name=Signaled`);
    let results = req.events.map(unpackEvent).concat(req2.events.map(unpackEvent));

    // append newer events not cached on server
    const lastBlock = Math.max.apply(this, results.map((d) => d.blockNumber));
    const newEvents = await lockdropContract.getPastEvents('Signaled', {
      fromBlock: lastBlock,
      toBlock: 'latest',
    });
    results = results.concat(newEvents);
    console.log(`Got ${newEvents.length} signal events from Infura not on server`);

    cachedSignals = results;
    return cachedSignals;
  } else {
    return await lockdropContract.getPastEvents('Signaled', {
      fromBlock: 0,
      toBlock: 'latest',
    });
  }
};

export const getAllLocks = async (web3, lockdropContract) => {
  if (cachedLocks) return cachedLocks;
  const network = await web3.eth.net.getNetworkType();
  if (network === 'main') {
    const req = await $.get(`${app.serverUrl()}/stats/edgeware/lockdrop/events?origin=${MAINNET_LOCKDROP_ORIG}&name=Locked`);
    const req2 = await $.get(
      `${app.serverUrl()}/stats/edgeware/lockdrop/events?origin=${MAINNET_LOCKDROP}&name=Locked`);
    let results = req.events.map(unpackEvent).concat(req2.events.map(unpackEvent));

    // append newer events not cached on server
    const lastBlock = Math.max.apply(this, results.map((d) => d.blockNumber));
    const newEvents = await lockdropContract.getPastEvents('Locked', {
      fromBlock: lastBlock,
      toBlock: 'latest',
    });
    results = results.concat(newEvents);
    console.log(`Got ${newEvents.length} lock events from Infura not on server`);

    cachedLocks = filterDuplicateLocks(results);
    return cachedLocks;
  } else {
    return await lockdropContract.getPastEvents('Locked', {
      fromBlock: 0,
      toBlock: 'latest',
    });
  }
};

export const getLocksFromAddr = async (lockdropContract, address) => {
  if (cachedLocks) {
    const matches = cachedLocks.filter((d) => d.returnValues.owner &&
                                       d.returnValues.owner.toLowerCase() === address.toLowerCase());
    if (matches) return filterDuplicateLocks(matches);
  }
  return await lockdropContract.getPastEvents('Locked', {
    fromBlock: 0,
    toBlock: 'latest',
    filter: {
      owner: address,
    }
  });
};

export const getSignalsFromAddr = async (lockdropContract, address) => {
  if (cachedSignals) {
    const matches = cachedSignals.filter((d) => d.returnValues.contractAddr.toLowerCase() === address.toLowerCase());
    if (matches) return matches;
  }
  return await lockdropContract.getPastEvents('Signaled', {
    fromBlock: 0,
    toBlock: 'latest',
    filter: {
      contractAddr: address,
    }
  });
};

// look up lockdrop user contracts at `address`
// since lockAddr is not indexed, we must fetch all locks
export const getLocksAtAddr = async (web3, lockdropContract, address) => {
  const locks = await getAllLocks(web3, lockdropContract);
  return locks.filter((l) => l.returnValues.lockAddr.toLowerCase() === address.toLowerCase());
};

export const getLockStorage = async (lockAddress, web3) => {
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

export const getCurrentTimestamp = async (web3) => {
  const block = await web3.eth.getBlock('latest');
  return block.timestamp;
};

export const calculateEffectiveLocks = async (lockdropContract, initialContract, web3) => {
  let totalETHLocked = web3.utils.toBN(0);
  let totalETHLocked3mo = web3.utils.toBN(0);
  let totalETHLocked6mo = web3.utils.toBN(0);
  let totalETHLocked12mo = web3.utils.toBN(0);
  let totalEffectiveETHLocked = web3.utils.toBN(0);

  const lockdropStartTime = await initialContract.methods.LOCK_START_TIME().call();
  const lockEvents = await getAllLocks(web3, lockdropContract);
  // Add balances and effective values to total
  const locks = {};
  const validatingLocks = {};

  lockEvents.forEach((event) => {
    const data = event.returnValues;
    const time = isHex(data.time) ? web3.utils.hexToNumber(data.time) : parseInt(data.time, 10);
    const value = getEffectiveValue(web3, data.eth, data.term, time, lockdropStartTime, totalETHLocked);

    // Add to totals
    totalETHLocked = totalETHLocked.add(web3.utils.toBN(data.eth));
    totalEffectiveETHLocked = totalEffectiveETHLocked.add(value);
    if (data.term.toString() === '0') {
      totalETHLocked3mo = totalETHLocked3mo.add(web3.utils.toBN(data.eth));
    } else if (data.term.toString() === '1') {
      totalETHLocked6mo = totalETHLocked6mo.add(web3.utils.toBN(data.eth));
    } else if (data.term.toString() === '2') {
      totalETHLocked12mo = totalETHLocked12mo.add(web3.utils.toBN(data.eth));
    } else {
      console.log('encountered lock transaction with invalid term');
    }

    // Add all validators to a separate collection to do validator election over later
    if (data.isValidator) {
      if (data.edgewareAddr in validatingLocks) {
        validatingLocks[data.edgewareAddr] = {
          lockAmt: web3.utils.toBN(data.eth).add(validatingLocks[data.edgewareAddr].lockAmt),
          effectiveValue: validatingLocks[data.edgewareAddr].effectiveValue.add(value),
          lockAddrs: [data.lockAddr, ...validatingLocks[data.edgewareAddr].lockAddrs],
        };
      } else {
        validatingLocks[data.edgewareAddr] = {
          lockAmt: web3.utils.toBN(data.eth),
          effectiveValue: value,
          lockAddrs: [data.lockAddr],
          lockTerm: data.term,
        };
      }
    }
    // Add all lockers to a collection for data processing
    if (data.edgewareAddr in locks) {
      locks[data.edgewareAddr] = {
        lockAmt: web3.utils.toBN(data.eth).add(locks[data.edgewareAddr].lockAmt),
        effectiveValue: locks[data.edgewareAddr].effectiveValue.add(value),
        lockAddrs: [data.lockAddr, ...locks[data.edgewareAddr].lockAddrs],
        lockTerm: data.term,
      };
    } else {
      locks[data.edgewareAddr] = {
        lockAmt: web3.utils.toBN(data.eth),
        effectiveValue: value,
        lockAddrs: [data.lockAddr],
        lockTerm: data.term,
      };
    }
  });

  return {
    locks,
    validatingLocks,
    totalETHLocked,
    totalETHLocked3mo,
    totalETHLocked6mo,
    totalETHLocked12mo,
    totalEffectiveETHLocked,
    numLocks: lockEvents.length
  };
};

export const calculateEffectiveSignals = async (lockdropContract, web3, blockNumber = null, batchSize = 100) => {
  let totalETHSignaled = web3.utils.toBN(0);
  let totalEffectiveETHSignaled = web3.utils.toBN(0);
  const signals = {};
  // Get all signaled events
  const signalEvents = await getAllSignals(web3, lockdropContract);
  // Filter duplicate signals based on sending address
  const seen = {};
  let signalers = signalEvents.map((event) => {
    if (event.returnValues.contractAddr in seen) {
      return { seen: true };
    } else {
      seen[event.returnValues.contractAddr] = true;
      return { ...event.returnValues };
    }
  }).filter((s) => (!s.seen));

  // Get cached balances. these may be out of date
  const balancesReq = await $.get(`${app.serverUrl()}/stats/edgeware/lockdrop/balances`);
  const balancesByAddr = {};
  balancesReq.balances.map((b) => {
    balancesByAddr[b.address] = b.balance;
  });

  signalers = await Promise.all(signalers.map(async (s) => {
    // Get balance at block that lockdrop ends
    const balance = balancesByAddr[s.contractAddr] ? balancesByAddr[s.contractAddr] :
      await getBalanceByBlocknumber(web3, s.contractAddr, blockNumber);
    // Get effective value of signaled balance
    const value = getEffectiveValue(web3, balance, 'signaling', undefined, undefined, undefined);
    // Return values
    return { value, balance, ...s };
  }));

  signalers.forEach((s) => {
    // Add value to total signaled ETH
    totalETHSignaled = totalETHSignaled.add(web3.utils.toBN(s.balance));
    totalEffectiveETHSignaled = totalEffectiveETHSignaled.add(s.value);
    // Add all signalers to a collection for data processing
    if (s.edgewareAddr in signals) {
      signals[s.edgewareAddr] = {
        signalAmt: web3.utils.toBN(s.balance).add(signals[s.edgewareAddr].signalAmt),
        effectiveValue: signals[s.edgewareAddr].effectiveValue.add(s.value),
        signalAddrs: [s.contractAddr, ...signals[s.edgewareAddr].signalAddrs],
      };
    } else {
      signals[s.edgewareAddr] = {
        signalAmt: web3.utils.toBN(s.balance),
        effectiveValue: s.value,
        signalAddrs: [s.contractAddr],
      };
    }
  });
  // Return signals and total ETH signaled
  return {
    signals,
    totalETHSignaled,
    totalEffectiveETHSignaled,
    numSignals: signalEvents.length
  };
};

export const getCountsByBlock = async (web3, lockdropContract) => {
  // TODO: no lockdropContract is passed because we assume the cached request has been fulfilled...
  // TODO: we don't consider the difference between mainnet and ropsten
  const locks = await getAllLocks(web3, lockdropContract);
  const signals = await getAllSignals(web3, lockdropContract);
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
  const lockEventsByBlock = reduceOverBlocks(allEvents.filter((e) => e.name === 'Locked'), (value) => 1);
  const signalEventsByBlock = reduceOverBlocks(allEvents.filter((e) => e.name === 'Signaled'), (value) => 1);
  const ethLockedByBlock = reduceOverBlocks(
    locks, (value) => Number(web3.utils.fromWei(web3.utils.toBN(value.returnValues.eth), 'ether')));
  const ethSignaledByBlock = [];
  const effectiveETHByBlock = [];

  // construct array converting blocknums to time
  const blocknumToTime = {};
  allEvents.map((event) => {
    const time = isHex(event.returnValues.time) ?
      web3.utils.hexToNumber(event.returnValues.time) :
      parseInt(event.returnValues.time, 10);
    blocknumToTime[event.blockNumber] = new Date(+web3.utils.toBN(time) * 1000);
    blocknumToTime[Math.ceil(event.blockNumber / roundToBlocks) * roundToBlocks] =
      new Date(+web3.utils.toBN(time) * 1000);
  });
  const time2 = isHex(allEvents[0].returnValues.time) ?
    web3.utils.hexToNumber(allEvents[0].returnValues.time) :
    parseInt(allEvents[0].returnValues.time, 10);
  blocknumToTime[Math.floor(allEvents[0].blockNumber / roundToBlocks) * roundToBlocks] =
    new Date(+web3.utils.toBN(time2) * 1000);

  const lastBlock = Math.max.apply(this, allEvents.map((e) => e.blockNumber));

  return { participantsByBlock, lockEventsByBlock, signalEventsByBlock,
           ethLockedByBlock, ethSignaledByBlock, effectiveETHByBlock, blocknumToTime, lastBlock };
};

function chunkify(signalEvents, batchSize) {
  if (signalEvents.length >= batchSize) {
    return {
      signalerBatch: signalEvents.slice(0, batchSize),
      signalers: signalEvents.slice(batchSize)
    };
  } else {
    return {
      signalerBatch: signalEvents,
      signalers: [],
    };
  }
}

async function getBalanceByBlocknumber(web3, address, blockNumber) {
  if (blockNumber) {
    return await web3.eth.getBalance(address, blockNumber);
  } else {
    return await web3.eth.getBalance(address);
  }
}

function getEffectiveValue(web3, ethAmount, term, lockTime, lockStart, totalETH) {
  ethAmount = web3.utils.toBN(ethAmount);
  // get locktime bonus if calculating allocation of locks
  let earlyParticipationBonus;
  if (lockTime && lockStart) {
    lockTime = web3.utils.toBN(lockTime);
    lockStart = web3.utils.toBN(lockStart);
    totalETH = web3.utils.toBN(totalETH);
    earlyParticipationBonus = getEarlyParticipationBonus(web3, lockTime, lockStart);
  }

  if (term.toString() === '0') {
    // three month term yields no bonus
    return ethAmount
      .mul(earlyParticipationBonus).div(web3.utils.toBN(100));
  } else if (term.toString() === '1') {
    // six month term yields 30% bonus
    return ethAmount.mul(web3.utils.toBN(130)).div(web3.utils.toBN(100))
      .mul(earlyParticipationBonus).div(web3.utils.toBN(100));
  } else if (term.toString() === '2') {
    // twelve month term yields 120% bonus
    return ethAmount.mul(web3.utils.toBN(220)).div(web3.utils.toBN(100))
      .mul(earlyParticipationBonus).div(web3.utils.toBN(100));
  } else if (term === 'signaling') {
    // signaling yields 80% deduction
    return ethAmount.mul(web3.utils.toBN(20)).div(web3.utils.toBN(100));
  } else {
    // invalid term
    console.error('Found invalid term');
    return web3.utils.toBN(0);
  }
}

export const getEarlyParticipationBonus = (web3, lockTime, lockStart) => {
  const JUNE_1ST_UTC = 1559347200;
  const JUNE_16TH_UTC = 1560643200;
  const JULY_1ST_UTC = 1561939200;
  const JULY_16TH_UTC = 1563235200;
  const JULY_31ST_UTC = 1564531200;
  const AUG_15TH_UTC = 1565827200;
  const AUG_30TH_UTC = 1567123200;

  if (web3.utils.toBN(lockTime).lte(web3.utils.toBN(JUNE_16TH_UTC))) {
    return web3.utils.toBN(150);
  } else if (web3.utils.toBN(lockTime).lte(web3.utils.toBN(JULY_1ST_UTC))) {
    return web3.utils.toBN(135);
  } else if (web3.utils.toBN(lockTime).lte(web3.utils.toBN(JULY_16TH_UTC))) {
    return web3.utils.toBN(123);
  } else if (web3.utils.toBN(lockTime).lte(web3.utils.toBN(JULY_31ST_UTC))) {
    return web3.utils.toBN(114);
  } else if (web3.utils.toBN(lockTime).lte(web3.utils.toBN(AUG_15TH_UTC))) {
    return web3.utils.toBN(108);
  } else if (web3.utils.toBN(lockTime).lte(web3.utils.toBN(AUG_30TH_UTC))) {
    return web3.utils.toBN(105);
  } else {
    return web3.utils.toBN(100);
  }
};

/**
 * Setup web3 provider using InjectedWeb3's injected providers
 */
export function setupWeb3Provider(network, url = null) {
  return (url)
  // tslint:disable-next-line:no-string-literal
    ? new window['Web3'](new window['Web3'].providers.HttpProvider(url))
  // tslint:disable-next-line:no-string-literal
    : new window['Web3'](new window['Web3'].providers.HttpProvider(`https://${network}.infura.io`));
}

export const getAddressSummary = async (addrs, network, token = 'edgeware', contractAddr?) => {
  return new Promise(async (resolve, reject) => {
    const lockdropContractAddress = (token === 'edgeware') ?
      network === 'mainnet' ? MAINNET_LOCKDROP : ROPSTEN_LOCKDROP :
      contractAddr;

    const json = await $.getJSON(`/static/contracts/${token}/Lockdrop.json`);
    const web3 = await setupWeb3Provider(network);
    const contract = new web3.eth.Contract(json.abi, lockdropContractAddress);
    const now = await getCurrentTimestamp(web3);
    const result = [];

    for (const addr of addrs) {
      let lockEvents = await getLocksFromAddr(contract, addr);
      if (lockEvents.length === 0) {
        lockEvents = await getLocksAtAddr(web3, contract, addr);
      }
      const signalEvents = await getSignalsFromAddr(contract, addr);
      // Append only 1 signal event others will not be counted
      if (signalEvents.length > 0) {
        const balance = await web3.eth.getBalance(signalEvents[0].returnValues.contractAddr);
        result.push({
          type: 'signal',
          data: signalEvents[0],
          eth: Number(web3.utils.fromWei(balance, 'ether'))
        });
      }
      // Parse out lock storage values
      const promises = lockEvents.map(async (event) => {
        const lockStorage = await getLockStorage(event.returnValues.lockAddr, web3);
        result.push({
          type: 'lock',
          data: event,
          eth: Number(web3.utils.fromWei(`${event.returnValues.eth}`, 'ether')),
          unlockTimeMinutes: (lockStorage.unlockTime - now) / 60,
        });
      });
      // Wait for all promises to resolve
      await Promise.all(promises);
    }

    resolve({ events: result });
  });
};

export const getParticipationSummary = async (network) => {
  const lockdropContractAddress = (network === 'mainnet') ? MAINNET_LOCKDROP : ROPSTEN_LOCKDROP;
  const initialContractAddress = (network === 'mainnet') ? MAINNET_LOCKDROP_ORIG : ROPSTEN_LOCKDROP;
  const json = await $.getJSON('/static/contracts/edgeware/Lockdrop.json');
  const web3 = await setupWeb3Provider(network);
  const initialContract = new web3.eth.Contract(json.abi, initialContractAddress);
  const lockdropContract = new web3.eth.Contract(json.abi, lockdropContractAddress);

  const { locks, validatingLocks, totalETHLocked, totalEffectiveETHLocked,
        totalETHLocked3mo, totalETHLocked6mo, totalETHLocked12mo, numLocks } =
    await calculateEffectiveLocks(lockdropContract, initialContract, web3);

  const { signals, totalETHSignaled, totalEffectiveETHSignaled, numSignals } =
    await calculateEffectiveSignals(lockdropContract, web3);

  const { participantsByBlock, lockEventsByBlock, signalEventsByBlock,
        ethLockedByBlock, ethSignaledByBlock, effectiveETHByBlock, blocknumToTime, lastBlock } =
    await getCountsByBlock(web3, lockdropContract);

  const lastBlockObj = await web3.eth.getBlock(lastBlock);
  const lastBlockTime = lastBlockObj.timestamp;

  // Calculate some metrics with the lock and signal data
  const totalETH = totalETHLocked.add(totalETHSignaled);
  const totalEffectiveETH = totalEffectiveETHLocked.add(totalEffectiveETHSignaled);
  const avgLock = totalETHLocked.div(web3.utils.toBN(numLocks));
  const avgSignal = totalETHSignaled.div(web3.utils.toBN(numSignals));
  // Convert most return types to numbers
  Object.keys(locks).map((l) => {
    const newLockAmt = Number(web3.utils.fromWei(locks[l].lockAmt, 'ether'));
    const newEffeVal = Number(web3.utils.fromWei(locks[l].effectiveValue, 'ether'));
    locks[l] = Object.assign({}, locks[l], {
      lockAmt: newLockAmt,
      effectiveValue: newEffeVal,
    });
  });
  Object.keys(validatingLocks).map((l) => {
    const newLockAmt = Number(web3.utils.fromWei(validatingLocks[l].lockAmt, 'ether'));
    const newEffeVal = Number(web3.utils.fromWei(validatingLocks[l].effectiveValue, 'ether'));
    validatingLocks[l] = Object.assign({}, validatingLocks[l], {
      lockAmt: newLockAmt,
      effectiveValue: newEffeVal,
    });
  });
  Object.keys(signals).map((s) => {
    const newSignalAmt = Number(web3.utils.fromWei(signals[s].signalAmt, 'ether'));
    const newEffeVal = Number(web3.utils.fromWei(signals[s].effectiveValue, 'ether'));
    signals[s] = Object.assign({}, signals[s], {
      signalAmt: newSignalAmt,
      effectiveValue: newEffeVal,
    });
  });

  return {
    locks,
    validatingLocks,
    signals,
    totalETHLocked: Number(web3.utils.fromWei(totalETHLocked, 'ether')),
    totalETHLocked3mo: Number(web3.utils.fromWei(totalETHLocked3mo, 'ether')),
    totalETHLocked6mo: Number(web3.utils.fromWei(totalETHLocked6mo, 'ether')),
    totalETHLocked12mo: Number(web3.utils.fromWei(totalETHLocked12mo, 'ether')),
    totalEffectiveETHLocked: Number(web3.utils.fromWei(totalEffectiveETHLocked, 'ether')),
    totalETHSignaled: Number(web3.utils.fromWei(totalETHSignaled, 'ether')),
    totalEffectiveETHSignaled: Number(web3.utils.fromWei(totalEffectiveETHSignaled, 'ether')),
    totalETH: Number(web3.utils.fromWei(totalETH, 'ether')),
    totalEffectiveETH: Number(web3.utils.fromWei(totalEffectiveETH, 'ether')),
    numLocks,
    numSignals,
    avgLock: Number(web3.utils.fromWei(avgLock, 'ether')),
    avgSignal: Number(web3.utils.fromWei(avgSignal, 'ether')),
    participantsByBlock,
    lockEventsByBlock,
    signalEventsByBlock,
    ethLockedByBlock,
    blocknumToTime,
    lastBlock,
    lastBlockTime,
  };
};
