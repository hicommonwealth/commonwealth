import { AppError } from '@hicommonwealth/core';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { contestABI } from './abi/contestAbi';
import { feeManagerABI } from './abi/feeManagerAbi';

export type AddContentResponse = {
  txReceipt: any;
  contentId: string;
};

export type ContestStatus = {
  startTime: number;
  endTime: number;
  contestInterval: number;
  lastContentId: string;
};

export type ContestWinners = {
  winningContent: string[];
  winningAddress: string[];
  voteCount: string[];
};

/**
 * Adds content to an active contest. Includes validation of contest state
 * @param web3 an instance of web3.js with correct RPC and Private Key
 * @param contest the address of the contest
 * @param creator the address of the user to create content on behalf of
 * @param url the common/commonwealth url of the content
 * @returns txReceipt and contentId of new content(NOTE: this should be saved for future voting)
 */
export const addContent = async (
  web3: Web3,
  contest: string,
  creator: string,
  url: string,
): Promise<AddContentResponse> => {
  const contestInstance = new web3.eth.Contract(
    contestABI as AbiItem[],
    contest,
  );
  let txReceipt;
  try {
    txReceipt = await contestInstance.methods
      .addContent(creator, url, [])
      .send({ from: web3.eth.defaultAccount, gas: '200000' });
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
 * @param web3 an instance of web3.js with correct RPC and Private Key
 * @param contest the address of the contest
 * @param voter the address of the voter
 * @param contentId The contentId on the contest to vote
 * @returns a tx receipt
 */
export const voteContent = async (
  web3: Web3,
  contest: string,
  voter: string,
  contentId: string,
): Promise<any> => {
  const contestInstance = new web3.eth.Contract(
    contestABI as AbiItem[],
    contest,
  );

  let txReceipt;
  try {
    txReceipt = await contestInstance.methods
      .voteContent(voter, contentId)
      .send({ from: web3.eth.defaultAccount, gas: '200000' });
  } catch (error) {
    throw new AppError('Failed to push content to chain: ' + error);
  }

  return txReceipt;
};

/**
 * Gets relevant contest state information
 * @param web3 an instance of web3.js with correct RPC and Private Key
 * @param contest the address of the contest
 * @returns Contest Status object
 */
export const getContestStatus = async (
  web3: Web3,
  contest: string,
): Promise<ContestStatus> => {
  const contestInstance = new web3.eth.Contract(
    contestABI as AbiItem[],
    contest,
  );

  const promise = await Promise.all([
    contestInstance.methods.startTime().call(),
    contestInstance.methods.endTime().call(),
    contestInstance.methods.contestInterval().call(),
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
 * @param web3 an instance of web3.js with correct RPC and Private Key
 * @param contest the address of the contest
 * @param contestId the id of the contest for data within the contest contract
 * @returns ContestWinners object containing eqaul indexed content ids, addresses, and votes
 */
export const getContestScore = async (
  web3: Web3,
  contest: string,
  contestId?: number,
): Promise<ContestWinners> => {
  const contestInstance = new web3.eth.Contract(
    contestABI as AbiItem[],
    contest,
  );

  const winnerIds: string[] = contestId
    ? await contestInstance.methods.getPastWinners(contestId).call()
    : await contestInstance.methods.getWinnerIds().call();

  if (winnerIds.length == 0) {
    throw new AppError('Contest Id not found on Contest address');
  }

  const votePromises: any[] = [];
  winnerIds.forEach((w) => {
    votePromises.push(contestInstance.methods.content(w).call());
  });

  const contentMeta = await Promise.all(votePromises);
  return {
    winningContent: winnerIds,
    winningAddress: contentMeta.map((c) => c['creator']),
    voteCount: contentMeta.map((c) => c['cumulativeVotes']),
  };
};

/**
 * Get the total balance of a given contest
 * @param web3 an instance of web3.js
 * @param contest the address of contest to get the balance of
 * @returns a numeric contest balance of the contestToken in wei(ie / 1e18 for decimal value)
 */
export const getContestBalance = async (
  web3: Web3,
  contest: string,
): Promise<number> => {
  const contestInstance = new web3.eth.Contract(
    contestABI as AbiItem[],
    contest,
  );

  const promises = [
    contestInstance.methods.contestToken().call(),
    contestInstance.methods.FeeManagerAddress().call(),
  ];

  const results = await Promise.all(promises);
  const feeManager = new web3.eth.Contract(
    feeManagerABI as AbiItem[],
    String(results[1]),
  );
  const balancePromises: Promise<number>[] = [
    feeManager.methods.getBeneficiaryBalance(contest, results[0]).call(),
  ];
  if (String(results[0]) === '0x0000000000000000000000000000000000000000') {
    balancePromises.push(
      web3.eth.getBalance(contest).then((v) => {
        return Number(v);
      }),
    );
  } else {
    const calldata =
      '0x70a08231' +
      web3.eth.abi.encodeParameters(['address'], [contest]).substring(2);
    balancePromises.push(
      web3.eth
        .call({
          to: String(results[0]),
          data: calldata,
        })
        .then((v) => {
          return Number(web3.eth.abi.decodeParameter('uint256', v));
        }),
    );
  }

  const balanceResults = await Promise.all(balancePromises);

  return balanceResults[0] + balanceResults[1];
};

/**
 * A helper for creating the web3 provider via an RPC, including private key import
 * @param rpc the rpc of the network to use helper with
 * @returns
 */
export const createWeb3Provider = async (
  rpc: string,
  privateKey: string,
): Promise<Web3> => {
  if (!privateKey) {
    throw new AppError('Private Key not set for relayer');
  }
  const web3 = new Web3(rpc);
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);
  web3.eth.defaultAccount = account.address;
  return web3;
};
