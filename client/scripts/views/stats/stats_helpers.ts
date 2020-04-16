import app from 'state';
import $ from 'jquery';
import _ from 'lodash';
import Web3 from 'web3';

export const MAINNET_LOCKDROP_ORIG = '0x1b75B90e60070d37CfA9d87AFfD124bB345bf70a';
export const MAINNET_LOCKDROP = '0xFEC6F679e32D45E22736aD09dFdF6E3368704e31';
export const ROPSTEN_LOCKDROP = '0x111ee804560787E0bFC1898ed79DAe24F2457a04';
const MAINNET_START_BLOCK = 7870000; // original mainnet lockdrop opened on block 7870425
const MAX_BLOCKS_PER_MAINNET_QUERY = 15000;
const { toBN } = Web3.utils;

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

/**
 * Setup web3 provider using InjectedWeb3's injected providers
 */
export function setupWeb3Provider(network, url = null) {
  const providerUrl = url || `https://${network}.infura.io`;
  const provider = (window['web3'])
    ? window['web3']
    : new Web3.providers.HttpProvider(providerUrl);

  return new Web3(provider);
}

export const getParticipationSummary = async (network) => {
  const web3 = setupWeb3Provider(network);
  const ldResults = await $.get(`${app.serverUrl()}/edgewareLockdropStats`, { network });
  const {
    locks,
    validatingLocks,
    totalETHLocked,
    totalEffectiveETHLocked,
    totalETHLocked3mo,
    totalETHLocked6mo,
    totalETHLocked12mo,
    numLocks,
    signals,
    totalETHSignaled,
    totalEffectiveETHSignaled,
    numSignals,
    participantsByBlock,
    lockEventsByBlock,
    signalEventsByBlock,
    ethLockedByBlock,
    ethSignaledByBlock,
    effectiveETHByBlock,
    blocknumToTime,
    lastBlock,
  } = ldResults.results;

  const lastBlockObj = await web3.eth.getBlock(lastBlock);

  const lastBlockTime = lastBlockObj.timestamp;
  // Calculate some metrics with the lock and signal data
  const totalETH = toBN(totalETHLocked).add(toBN(totalETHSignaled));
  const totalEffectiveETH = toBN(totalEffectiveETHLocked).add(toBN(totalEffectiveETHSignaled));
  const avgLock = toBN(totalETHLocked).div(toBN(numLocks));
  const avgSignal = toBN(totalETHSignaled).div(toBN(numSignals));
  // Convert most return types to numbers
  Object.keys(locks).forEach((l) => {
    const newLockAmt = Number(web3.utils.fromWei(locks[l].lockAmt, 'ether'));
    const newEffeVal = Number(web3.utils.fromWei(locks[l].effectiveValue, 'ether'));
    locks[l] = {
      ...locks[l],
      lockAmt: newLockAmt,
      effectiveValue: newEffeVal,
    };
  });
  Object.keys(validatingLocks).forEach((l) => {
    const newLockAmt = Number(web3.utils.fromWei(validatingLocks[l].lockAmt, 'ether'));
    const newEffeVal = Number(web3.utils.fromWei(validatingLocks[l].effectiveValue, 'ether'));
    validatingLocks[l] = {
      ...validatingLocks[l],
      lockAmt: newLockAmt,
      effectiveValue: newEffeVal,
    };
  });
  Object.keys(signals).forEach((s) => {
    const newSignalAmt = Number(web3.utils.fromWei(signals[s].signalAmt, 'ether'));
    const newEffeVal = Number(web3.utils.fromWei(signals[s].effectiveValue, 'ether'));
    signals[s] = {
      ...signals[s],
      signalAmt: newSignalAmt,
      effectiveValue: newEffeVal,
    };
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
