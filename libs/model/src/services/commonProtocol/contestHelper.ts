import { AppError } from '@hicommonwealth/core';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { contestABI } from './abi/contestAbi';

export type AddContentResponse = {
  txReceipt: any;
  contentId: string;
};

export type ContestStatus = {
  startTime: number;
  endTime: number;
  contestInterval: number;
  currWinners: string[];
  lastContentId: string;
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
      .addContent(creator, url, '')
      .send();
  } catch (error) {
    throw new AppError('Failed to push content to chain: ' + error);
  }
  const event = txReceipt.events['ContentAdded'];

  if (!event) {
    throw new AppError('Content not added on-chain');
  }

  return {
    txReceipt,
    contentId: event.returnValues.contentId,
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
      .send();
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
    contestInstance.methods.winnerIds().call(),
    contestInstance.methods.currContentId().call(),
  ]);

  return {
    startTime: promise[0],
    endTime: promise[1],
    contestInterval: promise[2],
    currWinners: promise[3],
    lastContentId: promise[4],
  };
};

/**
 * A (potential) helper for creating the web3 provider via an RPC, including private key import
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
