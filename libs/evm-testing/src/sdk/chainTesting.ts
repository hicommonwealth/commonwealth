import axios from 'axios';
import Web3 from 'web3';
import {
  chainAdvanceTime,
  chainGetEth,
  erc20Approve,
  erc20BalanceReq,
  erc20Transfer,
  govCompCreate,
  govCompGetVotes,
  govCompProposalId,
  govCompVote,
} from '../types';
import { ERC1155 } from './erc1155';
import { ERC721 } from './nft';

export class ChainTesting {
  host: string;
  header = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  contractAddrs = {
    compound: {
      governance: '0xc0Da02939E1441F497fd74F78cE7Decb17B66529',
      token: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
    },
    aave: {
      governance: '0xEC568fffba86c094cf06b22134B23074DFE2252c',
      token: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
    },
  };

  // Object where keys are snapshot ids and the boolean variable indicates
  // whether a snapshot id was already used to revert (cannot use id more than
  // once).
  protected chainSnapshotIds: Record<string, boolean> = {};

  /**
   * Creates a ChainTesting SDK Instance
   * @param host The chain-testing api host
   */
  constructor(host: string) {
    this.host = host;
  }

  // ERC20
  /**
   * Get the balance of a given wallet for any ERC20
   * @param tokenAddress Address of ERC20 Token
   * @param address address to check balance
   * @param convert convert from wei to ether?
   * @returns token balance
   */
  public async getBalance(
    tokenAddress: string,
    address: string,
    convert?: boolean,
  ) {
    const request: erc20BalanceReq = { tokenAddress, address, convert };
    const response = await axios.post(
      `${this.host}/erc20/balance`,
      JSON.stringify(request),
      this.header,
    );
    return response['data']['balance'];
  }

  /**
   * Transfer an ERC20 token between addresses
   * @param tokenAddress ERC20 token address
   * @param to address to transfer to
   * @param amount amount in ether to transfer
   * @param from account to transfer from(erc20.transferFrom)
   * @param accountIndex account index to create transfer tx from(erc20.transfer)
   */
  public async transferErc20(
    tokenAddress: string,
    to: string,
    amount: string,
    from?: string,
    accountIndex?: number,
  ) {
    const request: erc20Transfer = {
      tokenAddress,
      to,
      from,
      amount,
      accountIndex,
    };
    const response = await axios.post(
      `${this.host}/erc20/transfer`,
      JSON.stringify(request),
      this.header,
    );
    return response.data;
  }

  /**
   * Approve a spender to spend an ERC20 token
   * @param tokenAddress ERC20 token address
   * @param spender address to approve
   * @param amount amount to approve
   * @param accountIndex account index to create approve tx from(erc20.approve)
   */
  public async approveErc20(
    tokenAddress: string,
    spender: string,
    amount: string,
    accountIndex?: number,
  ): Promise<{ block: number }> {
    const request: erc20Approve = {
      tokenAddress,
      spender,
      amount,
      accountIndex,
    };
    const response = await axios.post(
      `${this.host}/erc20/approve`,
      JSON.stringify(request),
      this.header,
    );
    return response.data;
  }

  /**
   * Gets ERC20 tokens from a 'Bank Wallet'
   * @param tokenAddress ERC20 token address
   * @param to address to transfer to
   * @param amount amount in ether to receive
   */
  public async getErc20(
    tokenAddress: string,
    to: string,
    amount: string,
  ): Promise<{ block: number }> {
    const fromBank = true;
    const request: erc20Transfer = { tokenAddress, to, amount, fromBank };
    const response = await axios.post(
      `${this.host}/erc20/transfer`,
      JSON.stringify(request),
      this.header,
    );
    return response.data;
  }

  // Proposal
  /**
   * Get voting power via ERC20 token for a given wallet
   * @param accountIndex account index of test chain to get tokens
   * @param numberOfVotes amount of votes/tokens to receive
   * @param govType type of governor. 'compound' || 'aave
   */
  public async getVotingPower(
    accountIndex: number,
    numberOfVotes: string,
    govType = 'compound',
  ) {
    const request: govCompGetVotes = { accountIndex, numberOfVotes };
    const response = await axios.post(
      `${this.host}/gov/${govType}/getVotes`,
      JSON.stringify(request),
      this.header,
    );
    return response.data;
  }

  /**
   * Creates an arbitrary Compound proposal
   * @param accountIndex the index of accounts to create from
   * @param govType type of governor. 'compound' || 'aave
   * @returns proposalId of create Proposal
   */
  public async createProposal(
    accountIndex: number,
    govType = 'compound',
  ): Promise<any> {
    const request: govCompCreate = { accountIndex };
    const response = await axios.post(
      `${this.host}/gov/${govType}/createProposal`,
      JSON.stringify(request),
      this.header,
    );
    return response.data;
  }

  /**
   * Cancel a proposal
   * @param proposalId proposal Id to cancel
   * @param govType type of governor. 'compound' || 'aave
   * @returns proposalId of cancelled
   */
  public async cancelProposal(
    proposalId: string,
    govType = 'compound',
  ): Promise<any> {
    const request: govCompProposalId = { proposalId };
    const response = await axios.post(
      `${this.host}/gov/${govType}/cancelProposal`,
      JSON.stringify(request),
      this.header,
    );
    return response.data;
  }

  /**
   * Cast a vote for an account on a proposal
   * @param proposalId proposal to vote on
   * @param accountIndex account index to vote
   * @param forAgainst vote for or against
   * @param govType type of governor. 'compound' || 'aave
   */
  public async castVote(
    proposalId: string,
    accountIndex: number,
    forAgainst: boolean,
    govType = 'compound',
  ) {
    const request: govCompVote = { proposalId, accountIndex, forAgainst };
    const response = await axios.post(
      `${this.host}/gov/${govType}/castVote`,
      JSON.stringify(request),
      this.header,
    );
    return response.data;
  }

  /**
   * Queue a proposal for execution
   * @param proposalId
   * @param govType type of governor. 'compound' || 'aave
   */
  public async queueProposal(proposalId: string, govType = 'compound') {
    const request: govCompProposalId = { proposalId };
    const response = await axios.post(
      `${this.host}/gov/${govType}/queue`,
      JSON.stringify(request),
      this.header,
    );
    return response.data;
  }

  /**
   * execute a passed proposal
   * @param proposalId
   * @param govType type of governor. 'compound' || 'aave
   */
  public async executeProposal(proposalId: string, govType = 'compound') {
    const request: govCompProposalId = { proposalId };
    const response = await axios.post(
      `${this.host}/gov/${govType}/execute`,
      JSON.stringify(request),
      this.header,
    );
    return response.data;
  }

  /**
   * Runs a full proposal cycle from getting voting power to execution
   * @param govType type of governor. 'compound' || 'aave
   */
  public async runProposalCycle(govType = 'compound') {
    await axios.get(`${this.host}/gov/${govType}/runFullCylce`);
  }

  /**
   * get current details of a proposal
   * @param proposalId
   * @param govType type of governor. 'compound' || 'aave
   * @returns JSON data of proposal
   */
  public async getProposalDetails(proposalId: string, govType = 'compound') {
    const request: govCompProposalId = { proposalId };
    const response = await axios.post(
      `${this.host}/gov/${govType}/proposalDetails`,
      JSON.stringify(request),
      this.header,
    );
    return response.data;
  }

  // Chain Data
  /**
   * gets availble, unlocked test chain accounts
   * @returns List of wallets addresses
   */
  public async getAccounts() {
    const response = await axios.get(`${this.host}/chain/accounts`);
    return response.data;
  }

  /**
   * Gets all data for current block
   * @returns JSON data of current block
   */
  public async getBlock() {
    const response = await axios.get(`${this.host}/chain/block`);
    return response.data;
  }

  /**
   * Given a desired block number, this function will call advanceTime to attempt to advance to the desired block
   * number. Given that this is sometimes unreliable the function will return if the block number is greater than
   * or equal to the minBlockNum or if the number of tries exceeds the maxNumTries.
   * @param desiredBlockNum The desired block number to advance to
   * @param minBlockNum The minimum block number to advance to
   * @param maxNumTries The maximum number of times to attempt to advanceTime
   */
  public async safeAdvanceTime(
    desiredBlockNum: number,
    minBlockNum?: number,
    maxNumTries = 10,
  ): Promise<void> {
    let numTries = 0;
    /* eslint-disable */
    while (true) {
      if (numTries >= maxNumTries)
        throw new Error('Timed out waiting for block');
      const currentBlock = (await this.getBlock()).number;
      const numBlocksToAdvance = desiredBlockNum - currentBlock;
      console.log(
        `Current block: ${currentBlock}... waiting for ${desiredBlockNum}`,
      );
      if (currentBlock >= (minBlockNum || desiredBlockNum)) return;

      await this.advanceTime('1', numBlocksToAdvance);

      await new Promise<void>((resolve) => setTimeout(resolve, 1000));
      numTries += 1;
    }
  }

  /**
   * advance the timestamp and block
   * @param seconds amount of seconds to add to timestamp
   * @param blocks amount of blocks to mine
   * @returns '{PreTime, PostTime}'
   */
  public async advanceTime(seconds: string, blocks = 1) {
    const request: chainAdvanceTime = { seconds, blocks };
    const response = await axios.post(
      `${this.host}/chain/advanceTime`,
      JSON.stringify(request),
      this.header,
    );
    return response.data;
  }

  /**
   * Get ETH to a given account
   * @param toAddress address to get eth to
   * @param amount amount of eth in ether to receive
   */
  public async getETH(toAddress: string, amount: string) {
    const request: chainGetEth = { toAddress, amount };
    await axios.post(
      `${this.host}/chain/getEth`,
      JSON.stringify(request),
      this.header,
    );
  }

  public async getChainSnapshot() {
    const res = await axios.get(
      `${this.host}/chain/getChainSnapshot`,
      this.header,
    );
    if (res?.data?.result) {
      this.chainSnapshotIds[res.data.snapshotId] = false;
    } else {
      throw new Error('Failed to get chain snapshot');
    }

    return res.data.result;
  }

  public async revertChainToSnapshot(snapshotId: string) {
    if (this.chainSnapshotIds[snapshotId]) {
      throw new Error(`Cannot re-use chain snapshot: ${snapshotId}`);
    }
    const res = await axios.post(
      `${this.host}/chain/revertChainToSnapshot`,
      JSON.stringify({ snapshotId }),
      this.header,
    );
    console.log(res.data);
    if (res?.data?.result) {
      this.chainSnapshotIds[snapshotId] = true;
    } else {
      throw new Error(`Failed to revert chain to snapshot: ${snapshotId}`);
    }
    return res.data.result;
  }

  /**
   * Deploys an ERC721 and produces a reuseable object to interact with it
   * @returns ERC721 Object
   */
  public async deployNFT(): Promise<ERC721> {
    const response = await axios.get(`${this.host}/erc721/deploy`);
    return new ERC721(this.host, this.header, response.data['contractAddress']);
  }

  public async deployErc1155(): Promise<ERC1155> {
    const response = await axios.get(`${this.host}/erc1155/deploy`);
    return new ERC1155(
      this.host,
      this.header,
      response.data['contractAddress'],
    );
  }

  //RPC
  /**
   * Gets a web3 provider instance for the running test chain
   * @returns live web3 http provider
   */
  public async getProvider() {
    return new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'));
  }
}
