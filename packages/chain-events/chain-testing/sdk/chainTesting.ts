import axios from 'axios';
import Web3 from 'web3';
import {
  chainAdvanceTime,
  chainGetEth,
  erc20BalanceReq,
  erc20Transfer,
  govCompGetVotes,
  govCompProposalId,
  govCompVote,
} from '../src/types';

export class ChainTesting {
  host: string;
  header = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

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
    convert?: boolean
  ) {
    const request: erc20BalanceReq = { tokenAddress, address, convert };
    const response = await axios.post(
      `${this.host}/erc20/balance`,
      JSON.stringify(request),
      this.header
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
    accountIndex?: number
  ) {
    const request: erc20Transfer = {
      tokenAddress,
      to,
      from,
      amount,
      accountIndex,
    };
    await axios.post(
      `${this.host}/erc20/transfer`,
      JSON.stringify(request),
      this.header
    );
  }

  /**
   * Gets ERC20 tokens from a 'Bank Wallet'
   * @param tokenAddress ERC20 token address
   * @param to address to transfer to
   * @param amount amount in ether to receive
   */
  public async getErc20(tokenAddress: string, to: string, amount: string) {
    const fromBank = true;
    const request: erc20Transfer = { tokenAddress, to, amount, fromBank };
    await axios.post(
      `${this.host}/erc20/transfer`,
      JSON.stringify(request),
      this.header
    );
  }

  // Proposal
  /**
   * Get voting power via ERC20 token for a given wallet
   * @param accountIndex account index of test chain to get tokens
   * @param numberOfVotes amount of votes/tokens to receive
   */
  public async getVotingPower(accountIndex: number, numberOfVotes: string) {
    const request: govCompGetVotes = { accountIndex, numberOfVotes };
    await axios.post(
      `${this.host}/gov/compound/getVotes`,
      JSON.stringify(request),
      this.header
    );
  }

  /**
   * Creates an arbitrary Compound proposal
   * @returns proposalId of create Proposal
   */
  public async createProposal(): Promise<string> {
    const response = await axios.get(
      `${this.host}/gov/compound/createProposal`
    );
    return response.data;
  }

  /**
   * Cancel a proposal
   * @param proposalId proposal Id to cancel
   * @returns proposalId of cancelled
   */
  public async cancelProposal(proposalId: string): Promise<string> {
    const request: govCompProposalId = { proposalId };
    const response = await axios.post(
      `${this.host}/gov/compound/cancelProposal`,
      JSON.stringify(request),
      this.header
    );
    return response.data;
  }

  /**
   * Cast a vote for an account on a proposal
   * @param proposalId proposal to vote on
   * @param accountIndex account index to vote
   * @param forAgainst vote for or against
   */
  public async castVote(
    proposalId: string,
    accountIndex: number,
    forAgainst: boolean
  ) {
    const request: govCompVote = { proposalId, accountIndex, forAgainst };
    const response = await axios.post(
      `${this.host}/gov/compound/castVote`,
      JSON.stringify(request),
      this.header
    );
  }

  /**
   * Queue a proposal for execution
   * @param proposalId
   */
  public async queueProposal(proposalId: string) {
    const request: govCompProposalId = { proposalId };
    await axios.post(
      `${this.host}/gov/compound/queueProposal`,
      JSON.stringify(request),
      this.header
    );
  }

  /**
   * execute a passed proposal
   * @param proposalId
   */
  public async executeProposal(proposalId: string) {
    const request: govCompProposalId = { proposalId };
    await axios.post(
      `${this.host}/gov/compound/executeProposal`,
      JSON.stringify(request),
      this.header
    );
  }

  /**
   * Runs a full proposal cycle from getting voting power to execution
   */
  public async runProposalCycle() {
    await axios.get(`${this.host}/gov/compound/runFullCylce`);
  }

  /**
   * get current details of a proposal
   * @param proposalId
   * @returns JSON data of proposal
   */
  public async getProposalDetails(proposalId: string) {
    const request: govCompProposalId = { proposalId };
    const response = await axios.post(
      `${this.host}/gov/compound/proposalDetails`,
      JSON.stringify(request),
      this.header
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
   * advance the timestamp and block
   * @param seconds amount of seconds to add to timestamp
   * @returns '{PreTime, PostTime}'
   */
  public async advanceTime(seconds: string) {
    const request: chainAdvanceTime = { seconds };
    const response = await axios.post(
      `${this.host}/chain/advanceTime`,
      JSON.stringify(request),
      this.header
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
      this.header
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
