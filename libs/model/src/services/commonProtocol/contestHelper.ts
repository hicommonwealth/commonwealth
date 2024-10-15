import { AppError } from '@hicommonwealth/core';
import { Mutex } from 'async-mutex';
import { getTotalContestBalance } from 'shared/src/commonProtocol';
import Web3, { PayableCallOptions } from 'web3';
import { AbiItem } from 'web3-utils';
import { config } from '../../config';
import { contestABI } from './abi/contestAbi';
import { feeManagerABI } from './abi/feeManagerAbi';

const nonceMutex = new Mutex();

export type AddContentResponse = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  txReceipt: any;
  contentId: string;
};

export type ContestStatus = {
  startTime: number;
  endTime: number;
  contestInterval: number;
  lastContentId: string;
};

export type ContestScores = {
  scores: {
    winningContent: string;
    winningAddress: string;
    voteCount: string;
  }[];
  contestBalance: number;
};

/**
 * A helper for creating the web3 provider via an RPC, including private key import
 * @param rpc the rpc of the network to use helper with
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/require-await
const createWeb3Provider = async (rpc: string): Promise<Web3> => {
  if (!config.WEB3.PRIVATE_KEY) throw new AppError('WEB3 private key not set!');
  const web3 = new Web3(rpc);
  const account = web3.eth.accounts.privateKeyToAccount(
    config.WEB3.PRIVATE_KEY,
  );
  web3.eth.accounts.wallet.add(account);
  web3.eth.defaultAccount = account.address;
  return web3;
};

/**
 * Adds content to an active contest. Includes validation of contest state
 * @param rpcNodeUrl the rpc node url
 * @param contest the address of the contest
 * @param creator the address of the user to create content on behalf of
 * @param url the common/commonwealth url of the content
 * @returns txReceipt and contentId of new content (NOTE: this should be saved for future voting)
 */
const addContent = async (
  rpcNodeUrl: string,
  contest: string,
  creator: string,
  url: string,
  web3?: Web3,
  nonce?: number,
): Promise<AddContentResponse> => {
  if (!web3) {
    // eslint-disable-next-line no-param-reassign
    web3 = await createWeb3Provider(rpcNodeUrl);
  }
  const contestInstance = new web3.eth.Contract(
    contestABI as AbiItem[],
    contest,
  );

  const maxFeePerGasEst = await estimateGas(web3);
  let txReceipt;
  try {
    const txDetails: PayableCallOptions = {
      from: web3.eth.defaultAccount,
      gas: '1000000',
      type: '0x2',
      maxFeePerGas: maxFeePerGasEst?.toString(),
      maxPriorityFeePerGas: web3.utils.toWei('0.001', 'gwei'),
    };
    if (nonce) {
      txDetails.nonce = nonce.toString();
    }
    txReceipt = await contestInstance.methods
      .addContent(creator, url, [])
      .send(txDetails);
  } catch (error) {
    throw new AppError('Failed to push content to chain: ' + error);
  }

  if (!txReceipt.events?.ContentAdded) {
    throw new AppError('Event not included in receipt');
  }

  const event = txReceipt.events['ContentAdded'];

  if (!event) {
    throw new AppError('Content not added on-chain');
  }

  return {
    txReceipt,
    contentId: String(event.returnValues.contentId),
  };
};

/**
 * Adds a vote to content if voting power is available and user hasnt voted
 * @param rpcNodeUrl the rpc node url
 * @param contest the address of the contest
 * @param voter the address of the voter
 * @param contentId The contentId on the contest to vote
 * @returns a tx receipt
 */
const voteContent = async (
  rpcNodeUrl: string,
  contest: string,
  voter: string,
  contentId: string,
  web3?: Web3,
  nonce?: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> => {
  if (!web3) {
    // eslint-disable-next-line no-param-reassign
    web3 = await createWeb3Provider(rpcNodeUrl);
  }
  const contestInstance = new web3.eth.Contract(
    contestABI as AbiItem[],
    contest,
  );

  const maxFeePerGasEst = await estimateGas(web3);
  let txReceipt;
  try {
    const txDetails: PayableCallOptions = {
      from: web3.eth.defaultAccount,
      gas: '1000000',
      type: '0x2',
      maxFeePerGas: maxFeePerGasEst?.toString(),
      maxPriorityFeePerGas: web3.utils.toWei('0.001', 'gwei'),
    };
    if (nonce) {
      txDetails.nonce = nonce.toString();
    }
    txReceipt = await contestInstance.methods
      .voteContent(voter, contentId)
      .send(txDetails);
  } catch (error) {
    throw new AppError('Failed to push content to chain: ' + error);
  }

  return txReceipt;
};

/**
 * Gets relevant contest state information
 * @param rpcNodeUrl the rpc node url
 * @param contest the address of the contest
 * @returns Contest Status object
 */
export const getContestStatus = async (
  rpcNodeUrl: string,
  contest: string,
  oneOff?: boolean,
): Promise<ContestStatus> => {
  const web3 = new Web3(rpcNodeUrl);
  const contestInstance = new web3.eth.Contract(
    contestABI as AbiItem[],
    contest,
  );

  const promise = await Promise.all([
    contestInstance.methods.startTime().call(),
    contestInstance.methods.endTime().call(),
    oneOff
      ? contestInstance.methods.contestLength().call()
      : contestInstance.methods.contestInterval().call(),
    contestInstance.methods.currentContentId().call(),
  ]);

  return {
    startTime: Number(promise[0]),
    endTime: Number(promise[1]),
    contestInterval: Number(promise[2]),
    lastContentId: String(promise[3]),
  };
};

/**
 * Gets vote and more information about winners of a given contest
 * @param rpcNodeUrl the rpc node url
 * @param contest the address of the contest
 * @param contestId the id of the contest for data within the contest contract.
 * No contest id will return current winners
 * @returns ContestScores object containing eqaul indexed content ids, addresses, and votes
 */
export const getContestScore = async (
  rpcNodeUrl: string,
  contest: string,
  contestId?: number,
  oneOff?: boolean,
): Promise<ContestScores> => {
  const web3 = new Web3(rpcNodeUrl);
  const contestInstance = new web3.eth.Contract(
    contestABI as AbiItem[],
    contest,
  );

  const contestData = await Promise.all([
    contestId
      ? contestInstance.methods.getPastWinners(contestId).call()
      : contestInstance.methods.getWinnerIds().call(),
    getContestBalance(rpcNodeUrl, contest, oneOff),
  ]);

  const winnerIds: string[] = contestData[0] as string[];

  if (winnerIds.length == 0) {
    throw new Error(
      `getContestScore ERROR: No winners found for contest ID (${contestId}) on contest address: ${contest}`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const votePromises: any[] = [];
  winnerIds.forEach((w) => {
    votePromises.push(contestInstance.methods.content(w).call());
  });

  const contentMeta = await Promise.all(votePromises);

  return {
    scores: winnerIds.map((v, i) => {
      return {
        winningContent: v,
        winningAddress: contentMeta[i]['creator'],
        voteCount: contentMeta[i]['cumulativeVotes'],
      };
    }),
    contestBalance: contestData[1],
  };
};

/**
 * Get the total balance of a given contest
 * @param rpcNodeUrl the rpc node url
 * @param contest the address of contest to get the balance of
 * @returns a numeric contest balance of the contestToken in wei(ie / 1e18 for decimal value)
 */
export const getContestBalance = async (
  rpcNodeUrl: string,
  contest: string,
  oneOff?: boolean,
): Promise<number> => {
  const web3 = new Web3(rpcNodeUrl);

  const contestInstance = new web3.eth.Contract(
    contestABI as AbiItem[],
    contest,
  );

  const balance = await getTotalContestBalance(
    contestInstance,
    contest,
    web3,
    feeManagerABI,
    oneOff,
  );

  return balance;
};

export const addContentBatch = async (
  rpcNodeUrl: string,
  contest: string[],
  creator: string,
  url: string,
): Promise<PromiseSettledResult<AddContentResponse>[]> => {
  return nonceMutex.runExclusive(async () => {
    const web3 = await createWeb3Provider(rpcNodeUrl);
    let currNonce = Number(
      await web3.eth.getTransactionCount(web3.eth.defaultAccount!),
    );

    const promises: Promise<AddContentResponse>[] = [];

    contest.forEach((c) => {
      promises.push(addContent(rpcNodeUrl, c, creator, url, web3, currNonce));
      currNonce++;
    });

    return Promise.allSettled(promises);
  });
};

export type VoteContentBatchEntry = {
  contestAddress: string;
  contentId: string;
};
export const voteContentBatch = async (
  rpcNodeUrl: string,
  voter: string,
  entries: VoteContentBatchEntry[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<PromiseSettledResult<any>[]> => {
  return nonceMutex.runExclusive(async () => {
    const web3 = await createWeb3Provider(rpcNodeUrl);
    let currNonce = Number(
      await web3.eth.getTransactionCount(web3.eth.defaultAccount!),
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const promises: Promise<any>[] = [];

    entries.forEach(({ contestAddress, contentId }) => {
      promises.push(
        voteContent(
          rpcNodeUrl,
          contestAddress,
          voter,
          contentId,
          web3,
          currNonce,
        ),
      );
      currNonce++;
    });

    return Promise.allSettled(promises);
  });
};

/**
 * attempts to rollover and payout a provided contest. Returns false and does not attempt
 * transaction if contest is still active
 * @param rpcNodeUrl the chain node to use
 * @param contest the address of the contest
 * @param oneOff indicate if the contest is oneOff
 * @returns boolean indicating if contest was rolled over
 * NOTE: A false return does not indicate an error, rather that the contest was still ongoing
 * errors will still be throw for other issues
 */
export const rollOverContest = async (
  rpcNodeUrl: string,
  contest: string,
  oneOff: boolean,
): Promise<boolean> => {
  return nonceMutex.runExclusive(async () => {
    const web3 = await createWeb3Provider(rpcNodeUrl);
    const contestInstance = new web3.eth.Contract(
      contestABI as AbiItem[],
      contest,
    );

    const contractCall = oneOff
      ? contestInstance.methods.endContest()
      : contestInstance.methods.newContest();

    let gasResult;
    try {
      gasResult = await contractCall.estimateGas({
        from: web3.eth.defaultAccount,
      });
    } catch {
      return false;
    }
    const maxFeePerGasEst = await estimateGas(web3);
    await contractCall.send({
      from: web3.eth.defaultAccount,
      gas: gasResult.toString(),
      type: '0x2',
      maxFeePerGas: maxFeePerGasEst?.toString(),
      maxPriorityFeePerGas: web3.utils.toWei('0.001', 'gwei'),
    });
    return true;
  });
};

const estimateGas = async (web3: Web3): Promise<bigint | null> => {
  try {
    const latestBlock = await web3.eth.getBlock('latest');

    // Calculate maxFeePerGas and maxPriorityFeePerGas
    const baseFeePerGas = latestBlock.baseFeePerGas;
    const maxPriorityFeePerGas = web3.utils.toWei('0.001', 'gwei');
    const maxFeePerGas =
      baseFeePerGas! * BigInt(2) + BigInt(parseInt(maxPriorityFeePerGas));
    return maxFeePerGas;
  } catch {
    return null;
  }
};
