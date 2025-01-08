import { AppError, ServerError } from '@hicommonwealth/core';
import {
  commonProtocol,
  contestAbi,
  namespaceFactoryAbi,
} from '@hicommonwealth/evm-protocols';
import { Mutex } from 'async-mutex';
import Web3, { PayableCallOptions } from 'web3';
import { AbiItem } from 'web3-utils';
import { config } from '../../config';
import { createWeb3Provider } from './utils';

const nonceMutex = new Mutex();

export type AddContentResponse = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  txReceipt: any;
  contentId: string;
};

export type ContestScores = {
  scores: {
    winningContent: string;
    winningAddress: string;
    voteCount: string;
  }[];
  contestBalance: string;
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
    contestAbi as AbiItem[],
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
    contestAbi as AbiItem[],
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
      contestAbi as AbiItem[],
      contest,
    );

    const contractCall = oneOff
      ? contestInstance.methods.endContest()
      : contestInstance.methods.newContest();

    let gasResult = BigInt(300000);
    try {
      gasResult = await contractCall.estimateGas({
        from: web3.eth.defaultAccount,
      });
    } catch {
      //eslint-disable-next-line
      //@ts-ignore no-empty
    }

    const maxFeePerGasEst = await estimateGas(web3);

    if (gasResult < BigInt(100000)) {
      gasResult = BigInt(300000);
    }

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

export const deployERC20Contest = async (
  namespaceName: string,
  contestInterval: number,
  winnerShares: number[],
  voteToken: string,
  voterShare: number,
  exchangeToken: string,
  namespaceFactory: string,
  rpcNodeUrl: string,
): Promise<string> => {
  if (!config.WEB3.CONTEST_BOT_PRIVATE_KEY)
    throw new ServerError('Contest bot private key not set!');
  const web3 = await createWeb3Provider(
    rpcNodeUrl,
    config.WEB3.CONTEST_BOT_PRIVATE_KEY,
  );
  const contract = new web3.eth.Contract(namespaceFactoryAbi, namespaceFactory);
  const maxFeePerGasEst = await estimateGas(web3);
  let txReceipt;
  try {
    txReceipt = await contract.methods
      .newSingleERC20Contest(
        namespaceName,
        contestInterval,
        winnerShares,
        voteToken,
        voterShare,
        exchangeToken,
      )
      .send({
        from: web3.eth.defaultAccount,
        type: '0x2',
        maxFeePerGas: maxFeePerGasEst?.toString(),
        maxPriorityFeePerGas: web3.utils.toWei('0.001', 'gwei'),
      });
  } catch {
    throw new Error('New Contest Transaction failed');
  }

  const eventLog = txReceipt.logs.find(
    (log) => log.topics![0] == commonProtocol.CREATE_CONTEST_TOPIC,
  );
  const newContestAddress = web3.eth.abi.decodeParameters(
    ['address', 'address', 'uint256', 'bool'],
    // @ts-expect-error StrictNullChecks
    eventLog.data.toString(),
  )['0'] as string;
  return newContestAddress;
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
