import { ServerError } from '@hicommonwealth/core';
import {
  AddContentResponse,
  addContent,
  commonProtocol,
  estimateGas,
  getTransactionCount,
  namespaceFactoryAbi,
  recurringContestAbi,
  singleContestAbi,
  voteContent,
} from '@hicommonwealth/evm-protocols';
import { Mutex } from 'async-mutex';
import { config } from '../../config';
import { createWeb3Provider } from './utils';

const nonceMutex = new Mutex();

export const addContentBatch = async (
  rpcNodeUrl: string,
  contest: string[],
  creator: string,
  url: string,
): Promise<PromiseSettledResult<AddContentResponse>[]> => {
  return nonceMutex.runExclusive(async () => {
    const web3 = createWeb3Provider(rpcNodeUrl);
    let currNonce = await getTransactionCount({
      evmClient: web3,
      rpc: rpcNodeUrl,
      address: web3.eth.defaultAccount!,
    });

    const promises: Promise<AddContentResponse>[] = [];

    contest.forEach((c) => {
      promises.push(addContent(c, creator, url, web3, currNonce));
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
    const web3 = createWeb3Provider(rpcNodeUrl);
    let currNonce = await getTransactionCount({
      evmClient: web3,
      rpc: rpcNodeUrl,
      address: web3.eth.defaultAccount!,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const promises: Promise<any>[] = [];

    entries.forEach(({ contestAddress, contentId }) => {
      promises.push(
        voteContent(contestAddress, voter, contentId, web3, currNonce),
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
    const web3 = createWeb3Provider(rpcNodeUrl);
    const contestInstance = new web3.eth.Contract(
      oneOff ? singleContestAbi : recurringContestAbi,
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
  const web3 = createWeb3Provider(
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
