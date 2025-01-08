import { BigNumber } from '@ethersproject/bignumber';
import { ZERO_ADDRESS } from '@hicommonwealth/shared';
import Web3, { PayableCallOptions, TransactionReceipt } from 'web3';
import { feeManagerAbi } from '../../abis/feeManagerAbi';
import { recurringContestAbi } from '../../abis/recurringContestAbi';
import { singleContestAbi } from '../../abis/singleContestAbi';
import { estimateGas } from '../utils';

export const getTotalContestBalance = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contestContract: any,
  contestAddress: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  web3: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _feeManagerAbi: any[],
  oneOff?: boolean,
): Promise<string> => {
  const promises = [contestContract.methods.contestToken().call()];

  if (!oneOff) {
    promises.push(contestContract.methods.FeeMangerAddress().call());
  }

  const results = await Promise.all(promises);

  const balancePromises: Promise<string>[] = [];

  if (!oneOff) {
    const feeManager = new web3.eth.Contract(
      _feeManagerAbi,
      String(results[1]),
    );
    balancePromises.push(
      feeManager.methods
        .getBeneficiaryBalance(contestAddress, results[0])
        .call(),
    );
  }
  if (String(results[0]) === ZERO_ADDRESS) {
    balancePromises.push(
      web3.eth.getBalance(contestAddress).then((v: string) => {
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
          return web3.eth.abi.decodeParameter('uint256', v);
        }),
    );
  }

  const balanceResults = await Promise.all(balancePromises);

  const balance =
    balanceResults.length === 2
      ? BigNumber.from(balanceResults[0]).add(balanceResults[1])
      : BigNumber.from(balanceResults[0]);

  return BigNumber.from(balance).toString();
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

  return await getTotalContestBalance(
    contestInstance,
    contest,
    web3,
    feeManagerAbi,
    oneOff,
  );
};

/**
 * Gets vote and more information about winners of a given contest
 * @param rpcNodeUrl the rpc node url
 * @param contest the address of the contest
 * @param contestId the id of the contest for data within the contest contract.
 * No contest id will return current winners
 * @param oneOff boolean indicating whether this is a recurring contest - defaults to false (recurring)
 * @returns ContestScores object containing eqaul indexed content ids, addresses, and votes
 */
export const getContestScore = async (
  rpcNodeUrl: string,
  contest: string,
  contestId?: number,
  oneOff: boolean = false,
): Promise<{
  scores: {
    winningContent: string;
    winningAddress: string;
    voteCount: string;
  }[];
  contestBalance: string;
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
