import { CONTEST_FEE_PERCENT, ZERO_ADDRESS } from '@hicommonwealth/shared';
import { Mutex } from 'async-mutex';
import Web3, { Contract, PayableCallOptions, TransactionReceipt } from 'web3';
import { feeManagerAbi } from '../../abis/feeManagerAbi';
import { namespaceAbi } from '../../abis/namespaceAbi';
import { namespaceFactoryAbi } from '../../abis/namespaceFactoryAbi';
import { recurringContestAbi } from '../../abis/recurringContestAbi';
import { singleContestAbi } from '../../abis/singleContestAbi';
import { CREATE_CONTEST_TOPIC } from '../chainConfig';
import {
  createPrivateEvmClient,
  decodeParameters,
  estimateGas,
  getTransactionCount,
} from '../utils';
import { getNamespace } from './namespace';

export const getTotalContestBalance = async (
  contestContract: Contract<
    Readonly<typeof singleContestAbi> | Readonly<typeof recurringContestAbi>
  >,
  contestAddress: string,
  web3: Web3,
  oneOff?: boolean,
): Promise<string> => {
  const promises = [contestContract.methods.contestToken().call()];

  if (!oneOff) {
    promises.push(contestContract.methods.FeeMangerAddress().call());
  }

  const results = await Promise.all(promises);

  const balancePromises: Promise<string>[] = [];

  if (!oneOff) {
    const feeManager = new web3.eth.Contract(feeManagerAbi, String(results[1]));
    balancePromises.push(
      feeManager.methods
        .getBeneficiaryBalance(contestAddress, results[0])
        .call(),
    );
  }
  if (String(results[0]) === ZERO_ADDRESS) {
    balancePromises.push(
      web3.eth.getBalance(contestAddress).then((v: bigint) => {
        return v.toString();
      }),
    );
  } else {
    const calldata =
      '0x70a08231' +
      web3.eth.abi.encodeParameters(['address'], [contestAddress]).substring(2);
    balancePromises.push(
      web3.eth
        .call({
          to: String(results[0]),
          data: calldata,
        })
        .then((v: string) => {
          return String(web3.eth.abi.decodeParameter('uint256', v));
        }),
    );
  }

  const balanceResults = await Promise.all(balancePromises);

  const balance =
    balanceResults.length === 2
      ? BigInt(balanceResults[0]) + BigInt(balanceResults[1])
      : BigInt(balanceResults[0]);

  return balance.toString();
};

/**
 * Gets relevant contest state information
 * @param rpcNodeUrl the rpc node url
 * @param contest the address of the contest
 * @param oneOff boolean indicating whether this is a recurring contest - defaults to false (recurring)
 * @returns Contest Status object
 */
export const getContestStatus = async (
  rpcNodeUrl: string,
  contest: string,
  oneOff: boolean = false,
): Promise<{
  startTime: number;
  endTime: number;
  contestInterval: number;
  lastContentId: string;
}> => {
  const web3 = new Web3(rpcNodeUrl);
  const contestInstance = new web3.eth.Contract(
    oneOff ? singleContestAbi : recurringContestAbi,
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
 * Get the total balance of a given contest
 * @param rpcNodeUrl the rpc node url
 * @param contest the address of contest to get the balance of
 * @param oneOff boolean indicating whether this is a recurring contest - defaults to false (recurring)
 * @returns a numeric contest balance of the contestToken in wei(ie / 1e18 for decimal value)
 */
export const getContestBalance = async (
  rpcNodeUrl: string,
  contest: string,
  oneOff: boolean = false,
): Promise<string> => {
  const web3 = new Web3(rpcNodeUrl);

  const contestInstance = new web3.eth.Contract(
    oneOff ? singleContestAbi : recurringContestAbi,
    contest,
  );

  return await getTotalContestBalance(contestInstance, contest, web3, oneOff);
};

/**
 * Gets vote and more information about winners of a given contest
 * @param rpcNodeUrl the rpc node url
 * @param contest the address of the contest
 * @param prizePercentage the prize percentage of the contest
 * @param payoutStructure the payout structure of the contest
 * @param contestId the id of the contest for data within the contest contract.
 * No contest id will return current winners
 * @param oneOff boolean indicating whether this is a recurring contest - defaults to false (recurring)
 * @returns Contest balance and ContestScores object containing equal indexed content ids, addresses, and votes
 */
export const getContestScore = async (
  rpcNodeUrl: string,
  contest: string,
  prizePercentage: number,
  payoutStructure: number[],
  contestId?: number,
  oneOff: boolean = false,
): Promise<{
  contestBalance: string | null;
  scores: {
    content_id: string;
    creator_address: string;
    votes: string;
    prize: string;
  }[];
}> => {
  const web3 = new Web3(rpcNodeUrl);
  const contestInstance = new web3.eth.Contract(
    oneOff ? singleContestAbi : recurringContestAbi,
    contest,
  );

  const contestData = await Promise.all([
    contestId
      ? contestInstance.methods.getPastWinners(contestId).call()
      : contestInstance.methods.getWinnerIds().call(),
    getContestBalance(rpcNodeUrl, contest, oneOff),
  ]);

  const winnerIds: string[] = contestData[0] as string[];
  const contestBalance = contestData[1];

  if (winnerIds.length == 0) {
    console.warn(
      `getContestScore WARN: No winners found for contest ID (${contestId}) on contest address: ${contest}`,
    );
    return { contestBalance, scores: [] };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const votePromises: any[] = [];
  winnerIds.forEach((w) => {
    votePromises.push(contestInstance.methods.content(w).call());
  });

  const contentMeta = await Promise.all(votePromises);

  const scores = winnerIds.map((v, i) => {
    return {
      winningContent: v,
      winningAddress: contentMeta[i]['creator'],
      voteCount: contentMeta[i]['cumulativeVotes'],
    };
  });

  let prizePool =
    (BigInt(contestBalance) *
      (oneOff ? BigInt(100) : BigInt(prizePercentage))) /
    BigInt(100);
  prizePool = (prizePool * BigInt(100 - CONTEST_FEE_PERCENT)) / BigInt(100); // deduct contest fee from prize pool
  return {
    contestBalance,
    scores: scores.map((s, i) => ({
      content_id: s.winningContent.toString(),
      creator_address: s.winningAddress,
      votes: BigInt(s.voteCount).toString(),
      prize:
        i < Number(payoutStructure.length)
          ? ((prizePool * BigInt(payoutStructure[i])) / BigInt(100)).toString()
          : '0',
    })),
  };
};

export type AddContentResponse = {
  txReceipt: TransactionReceipt;
  contentId: string;
};

/**
 * Adds content to an active contest. Includes validation of contest state
 * @param contest the address of the contest
 * @param creator the address of the user to create content on behalf of
 * @param url the common/commonwealth url of the content
 * @param web3 A web3 instance instantiated with a private key
 * @param nonce The nonce of the transaction
 * @returns txReceipt and contentId of new content (NOTE: this should be saved for future voting)
 */
export const addContent = async (
  contest: string,
  creator: string,
  url: string,
  web3: Web3,
  nonce?: number,
): Promise<AddContentResponse> => {
  const contestInstance = new web3.eth.Contract(singleContestAbi, contest);

  const maxFeePerGasEst = await estimateGas(web3);
  let txReceipt: TransactionReceipt;
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
    throw new Error('Failed to push content to chain: ' + error);
  }

  if (!txReceipt.events?.ContentAdded) {
    throw new Error('Event not included in receipt');
  }

  const event = txReceipt.events['ContentAdded'];

  if (!event) {
    throw new Error('Content not added on-chain');
  }

  return {
    txReceipt,
    contentId: String(event.returnValues.contentId),
  };
};

/**
 * Adds a vote to content if voting power is available and user hasnt voted
 * @param contest the address of the contest
 * @param voter the address of the voter
 * @param contentId The contentId on the contest to vote
 * @param web3 A web3 instance instantiated with a private key
 * @param nonce The nonce of the transaction
 * @returns a tx receipt
 */
export const voteContent = async (
  contest: string,
  voter: string,
  contentId: string,
  web3: Web3,
  nonce?: number,
): Promise<TransactionReceipt> => {
  const contestInstance = new web3.eth.Contract(singleContestAbi, contest);

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
    throw new Error('Failed to push content to chain: ' + error);
  }

  return txReceipt;
};

const nonceMutex = new Mutex();

export const addContentBatch = async ({
  privateKey,
  rpc,
  contest,
  creator,
  url,
}: {
  privateKey: string;
  rpc: string;
  contest: string[];
  creator: string;
  url: string;
  // eslint-disable-next-line @typescript-eslint/require-await
}): Promise<PromiseSettledResult<AddContentResponse>[]> => {
  return nonceMutex.runExclusive(async () => {
    const web3 = createPrivateEvmClient({ rpc, privateKey });
    let currNonce = await getTransactionCount({
      evmClient: web3,
      rpc,
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

export const voteContentBatch = async ({
  privateKey,
  rpc,
  voter,
  entries,
}: {
  privateKey: string;
  rpc: string;
  voter: string;
  entries: {
    contestAddress: string;
    contentId: string;
  }[];
  // eslint-disable-next-line @typescript-eslint/require-await
}) => {
  return nonceMutex.runExclusive(async () => {
    const web3 = createPrivateEvmClient({ rpc, privateKey });
    let currNonce = await getTransactionCount({
      evmClient: web3,
      rpc,
      address: web3.eth.defaultAccount!,
    });

    const promises: Promise<TransactionReceipt>[] = [];

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
export const rollOverContest = async ({
  privateKey,
  rpc,
  contest,
  oneOff,
}: {
  privateKey: string;
  rpc: string;
  contest: string;
  oneOff: boolean;
  // eslint-disable-next-line @typescript-eslint/require-await
}): Promise<boolean> => {
  return nonceMutex.runExclusive(async () => {
    const web3 = createPrivateEvmClient({ rpc, privateKey });
    const contestInstance = new web3.eth.Contract(
      oneOff ? singleContestAbi : recurringContestAbi,
      contest,
    );

    if (oneOff) {
      const contestEnded = await contestInstance.methods.contestEnded().call();
      if (contestEnded) {
        return false;
      } else {
        const endTime = await contestInstance.methods.endTime().call();
        const currentTime = Math.floor(Date.now() / 1000);
        if (Number(endTime) > currentTime) {
          return false;
        }
      }
    }
    const contractCall = oneOff
      ? contestInstance.methods.endContest()
      : contestInstance.methods.newContest();

    // TODO: @ianrowan or @rbennettcw - we should check if the contest is already ended before calling endContest again
    // to avoid transaction failures and unnecessary gas costs

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

export const deployERC20Contest = async ({
  privateKey,
  namespaceName,
  contestInterval,
  winnerShares,
  voteToken,
  voterShare,
  exchangeToken,
  namespaceFactory,
  rpc,
}: {
  privateKey: string;
  namespaceName: string;
  contestInterval: number;
  winnerShares: number[];
  voteToken: string;
  voterShare: number;
  exchangeToken: string;
  namespaceFactory: string;
  rpc: string;
}) => {
  return nonceMutex.runExclusive(async () => {
    const web3 = createPrivateEvmClient({ rpc, privateKey });
    const contract = new web3.eth.Contract(
      namespaceFactoryAbi,
      namespaceFactory,
    );
    const maxFeePerGasEst = await estimateGas(web3);
    let txReceipt: TransactionReceipt;
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
    } catch (err) {
      console.warn('New Contest Transaction failed', err);
      return;
    }

    const eventLog = txReceipt.logs.find(
      (log) => log.topics![0] == CREATE_CONTEST_TOPIC,
    );
    if (!eventLog || !eventLog.data) throw new Error('No event data');

    const { 0: address } = decodeParameters({
      abiInput: ['address', 'address', 'uint256', 'bool'],
      data: eventLog.data.toString(),
    });
    return address as string;
  });
};

export const deployNamespace = async (
  namespaceFactory: string,
  name: string,
  walletAddress: string,
  feeManager: string,
  rpcNodeUrl: string,
  privateKey: string,
): Promise<string> => {
  const web3 = createPrivateEvmClient({ rpc: rpcNodeUrl, privateKey });
  const namespaceCheck = await getNamespace(rpcNodeUrl, name, namespaceFactory);
  if (namespaceCheck === ZERO_ADDRESS) {
    throw new Error('Namespace already reserved');
  }
  const contract = new web3.eth.Contract(namespaceFactoryAbi, namespaceFactory);

  const maxFeePerGasEst = await estimateGas(web3);

  try {
    const uri = `https://common.xyz/api/namespaceMetadata/${name}/{id}`;
    await contract.methods.deployNamespace(name, uri, feeManager, []).send({
      from: web3.eth.defaultAccount,
      type: '0x2',
      maxFeePerGas: maxFeePerGasEst?.toString(),
      maxPriorityFeePerGas: web3.utils.toWei('0.001', 'gwei'),
    });
  } catch (error) {
    throw new Error('Transaction failed: ' + error);
  }
  const namespaceAddress = await getNamespace(
    rpcNodeUrl,
    name,
    namespaceFactory,
  );
  const namespaceContract = new web3.eth.Contract(
    namespaceAbi,
    namespaceAddress,
  );

  try {
    await namespaceContract.methods
      .mintId(walletAddress, 1, 1, '0x')
      .send({ from: web3.eth.defaultAccount });
  } catch (error) {
    throw new Error('Transaction failed: ' + error);
  }

  return namespaceAddress;
};
