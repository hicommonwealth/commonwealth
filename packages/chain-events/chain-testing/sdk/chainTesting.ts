import axios from 'axios';
import Web3 from 'web3';
import {
  chainAdvanceTime,
  chainGetEth,
  erc20BalanceReq,
  erc20Transfer,
  erc721Approve,
  govCompCreate,
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
    const response = await axios.post(
      `${this.host}/erc20/transfer`,
      JSON.stringify(request),
      this.header
    );
    return response.data;
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
    const response = await axios.post(
      `${this.host}/erc20/transfer`,
      JSON.stringify(request),
      this.header
    );
    return response.data;
  }

  // Proposal
  /**
   * Get voting power via ERC20 token for a given wallet
   * @param accountIndex account index of test chain to get tokens
   * @param numberOfVotes amount of votes/tokens to receive
   */
  public async getVotingPower(
    accountIndex: number,
    numberOfVotes: string,
    govType: string = 'compound'
  ) {
    const request: govCompGetVotes = { accountIndex, numberOfVotes };
    const response = await axios.post(
      `${this.host}/gov/${govType}/getVotes`,
      JSON.stringify(request),
      this.header
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
    govType: string = 'compound'
  ): Promise<any> {
    const request: govCompCreate = { accountIndex };
    const response = await axios.post(
      `${this.host}/gov/${govType}/createProposal`,
      JSON.stringify(request),
      this.header
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
    govType: string = 'compound'
  ): Promise<any> {
    const request: govCompProposalId = { proposalId };
    const response = await axios.post(
      `${this.host}/gov/${govType}/cancelProposal`,
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
   * @param govType type of governor. 'compound' || 'aave
   */
  public async castVote(
    proposalId: string,
    accountIndex: number,
    forAgainst: boolean,
    govType: string = 'compound'
  ) {
    const request: govCompVote = { proposalId, accountIndex, forAgainst };
    const response = await axios.post(
      `${this.host}/gov/${govType}/castVote`,
      JSON.stringify(request),
      this.header
    );
    return response.data;
  }

  /**
   * Queue a proposal for execution
   * @param proposalId
   * @param govType type of governor. 'compound' || 'aave
   */
  public async queueProposal(proposalId: string, govType: string = 'compound') {
    const request: govCompProposalId = { proposalId };
    const response = await axios.post(
      `${this.host}/gov/${govType}/queue`,
      JSON.stringify(request),
      this.header
    );
    response.data;
  }

  /**
   * execute a passed proposal
   * @param proposalId
   * @param govType type of governor. 'compound' || 'aave
   */
  public async executeProposal(
    proposalId: string,
    govType: string = 'compound'
  ) {
    const request: govCompProposalId = { proposalId };
    const response = await axios.post(
      `${this.host}/gov/${govType}/execute`,
      JSON.stringify(request),
      this.header
    );
    return response.data;
  }

  /**
   * Runs a full proposal cycle from getting voting power to execution
   * @param govType type of governor. 'compound' || 'aave
   */
  public async runProposalCycle(govType: string = 'compound') {
    await axios.get(`${this.host}/gov/${govType}/runFullCylce`);
  }

  /**
   * get current details of a proposal
   * @param proposalId
   * @param govType type of governor. 'compound' || 'aave
   * @returns JSON data of proposal
   */
  public async getProposalDetails(
    proposalId: string,
    govType: string = 'compound'
  ) {
    const request: govCompProposalId = { proposalId };
    const response = await axios.post(
      `${this.host}/gov/${govType}/proposalDetails`,
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

  // ERC721
  /**
   * Transfer a specific ERC721 token ID
   * @param nftAddress ERC721 Contract Address
   * @param tokenId NFT token ID
   * @param to transfer to
   * @param from transfer from: optional if using acct Index
   * @param accountIndex transfer from: optional if using from
   */
  public async transferERC721(
    nftAddress: string,
    tokenId: string,
    to: string,
    from?: string,
    accountIndex?: number
  ) {
    const request: erc721Approve = {
      nftAddress,
      tokenId,
      to,
      from,
      accountIndex,
    };
    const response = await axios.post(
      `${this.host}/erc721/transfer`,
      JSON.stringify(request),
      this.header
    );
    return response.data;
  }

  /**
   * Approve a single ERC721 for use
   * @param nftAddress ERC721 Contract Address
   * @param tokenId NFT token ID
   * @param to the operator to approve to
   * @param from from acct(owner): optional if using acct Index
   * @param accountIndex from acct index(owner): optional if using from
   */
  public async approveERC721(
    nftAddress: string,
    tokenId: string,
    to: string,
    from?: string,
    accountIndex?: number
  ) {
    const request: erc721Approve = {
      nftAddress,
      tokenId,
      to,
      from,
      accountIndex,
      all: false,
    };
    const response = await axios.post(
      `${this.host}/erc721/approve`,
      JSON.stringify(request),
      this.header
    );
    return response.data;
  }
  /**
   * Approve all holdings for use
   * @param nftAddress ERC721 Contract Address
   * @param tokenId NFT token ID
   * @param to the operator to approve to
   * @param from from acct(owner): optional if using acct Index
   * @param accountIndex from acct index(owner): optional if using from
   */
  public async approveAllERC721(
    nftAddress: string,
    tokenId: string,
    to: string,
    from?: string,
    accountIndex?: number
  ) {
    const request: erc721Approve = {
      nftAddress,
      tokenId,
      to,
      from,
      accountIndex,
      all: true,
    };
    const response = await axios.post(
      `${this.host}/erc721/approve`,
      JSON.stringify(request),
      this.header
    );
    return response.data;
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
